import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import type {
  User,
  Session,
  WarpRecord,
  BannerType,
  Pull,
  UserStats,
  GameProfile,
  TodoItem,
  Activity,
  ReceiptSubmission,
  SupporterStatus,
} from "./types"
import { GAME_IDS, type GameId } from "./games"

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN as string,
    clientConfig: { region: process.env.AWS_REGION },
  }),
})

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

/*
 * Single-table design (composite key: PK + SK) — multi-game
 * ------------------------------------------------------------------
 *  Entity       | PK                      | SK
 * ------------------------------------------------------------------
 *  User         | USER#<email>            | PROFILE
 *  GameProfile  | USER#<email>            | GAMEPROFILE#<gameId>
 *  WarpRecord   | USER#<email>            | WARP#<gameId>#<banner>
 *  Activity     | USER#<email>            | ACTIVITY
 *  Session      | SESSION#<token>         | SESSION
 *  Receipt      | RECEIPTS                | RECEIPT#<submittedAt>#<id>
 *  Leaderboard  | LEADERBOARD#<gameId>    | USER#<email>
 *
 *  A single user's entire account (profile + every game's records) lives
 *  in one partition (USER#<email>) so it loads with one Query — O(1)
 *  partition access that scales horizontally to millions of users. Each
 *  game's leaderboard is its own partition (LEADERBOARD#<gameId>) so a
 *  ranking view is a single Query. At extreme scale these would be
 *  sharded by region/score-bucket without changing the query pattern.
 */
const userPk = (email: string) => `USER#${email.toLowerCase()}`
const sessionPk = (token: string) => `SESSION#${token}`
const warpSk = (game: GameId, banner: BannerType) => `WARP#${game}#${banner}`
const warpPrefix = (game: GameId) => `WARP#${game}#`
const gameProfileSk = (game: GameId) => `GAMEPROFILE#${game}`
const lbPk = (game: GameId) => `LEADERBOARD#${game}`
const lbSk = (email: string) => `USER#${email.toLowerCase()}`
const RECEIPTS_PK = "RECEIPTS"
// Sorts newest-last by submission time; querying then reversing gives newest-first.
const receiptSk = (submittedAt: number, id: string) => `RECEIPT#${String(submittedAt).padStart(15, "0")}#${id}`

/* ---------- users ---------- */
export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: userPk(email), SK: "PROFILE" } }),
  )
  return (res.Item as User) || null
}

export async function createUser(user: User): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: userPk(user.email), SK: "PROFILE", ...user },
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  )
}

export async function updateUserGameUid(email: string, game: GameId, uid: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPk(email), SK: "PROFILE" },
      UpdateExpression: "SET #uids.#g = :uid",
      ExpressionAttributeNames: { "#uids": "uids", "#g": game },
      ExpressionAttributeValues: { ":uid": uid },
    }),
  ).catch(async () => {
    // uids map may not exist yet — create it first
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: userPk(email), SK: "PROFILE" },
        UpdateExpression: "SET #uids = :map",
        ExpressionAttributeNames: { "#uids": "uids" },
        ExpressionAttributeValues: { ":map": { [game]: uid } },
      }),
    )
  })
}

/* ---------- todos (one item per user, stored as a list) ---------- */
export async function getTodos(email: string): Promise<TodoItem[]> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: userPk(email), SK: "TODOS" } }),
  )
  return ((res.Item?.items as TodoItem[]) ?? []).sort((a, b) => a.createdAt - b.createdAt)
}

export async function saveTodos(email: string, items: TodoItem[]): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: userPk(email), SK: "TODOS", items, updatedAt: Date.now() },
    }),
  )
}

/* ---------- activity / visit streaks (one row per user, SK = ACTIVITY) ---------- */
function utcDay(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10) // YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export async function getActivity(email: string): Promise<Activity | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: userPk(email), SK: "ACTIVITY" } }),
  )
  if (!res.Item) return null
  const { PK, SK, ...activity } = res.Item as Activity & { PK: string; SK: string }
  return activity as Activity
}

/**
 * Records that the user is active today and updates their visit streak.
 * Idempotent within a single UTC day. A gap of exactly one day extends the
 * streak; any larger gap resets it to 1.
 */
export async function recordDailyVisit(email: string): Promise<Activity> {
  const today = utcDay()
  const existing = await getActivity(email)

  let next: Activity
  if (!existing) {
    next = { lastActiveDay: today, currentStreak: 1, longestStreak: 1, totalDays: 1, updatedAt: Date.now() }
  } else if (existing.lastActiveDay === today) {
    return existing // already counted today
  } else {
    const gap = daysBetween(existing.lastActiveDay, today)
    const currentStreak = gap === 1 ? existing.currentStreak + 1 : 1
    next = {
      lastActiveDay: today,
      currentStreak,
      longestStreak: Math.max(existing.longestStreak, currentStreak),
      totalDays: existing.totalDays + 1,
      updatedAt: Date.now(),
    }
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: userPk(email), SK: "ACTIVITY", ...next },
    }),
  )
  return next
}

export async function setSupporter(
  email: string,
  isSupporter: boolean,
  status: SupporterStatus = isSupporter ? "approved" : "none",
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPk(email), SK: "PROFILE" },
      UpdateExpression: "SET isSupporter = :s, supporterStatus = :st, supporterSince = :t",
      ExpressionAttributeValues: {
        ":s": isSupporter,
        ":st": status,
        ":t": isSupporter ? Date.now() : 0,
      },
    }),
  )
}

/* ---------- supporter receipts (admin-reviewed premium) ---------- */
export async function createReceipt(receipt: ReceiptSubmission): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: RECEIPTS_PK, SK: receiptSk(receipt.submittedAt, receipt.id), ...receipt },
    }),
  )
}

// Newest-first list of all receipts (admin view).
export async function listReceipts(): Promise<ReceiptSubmission[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": RECEIPTS_PK, ":sk": "RECEIPT#" },
      ScanIndexForward: false, // newest first
    }),
  )
  return (res.Items as ReceiptSubmission[]) || []
}

export async function getReceipt(submittedAt: number, id: string): Promise<ReceiptSubmission | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: RECEIPTS_PK, SK: receiptSk(submittedAt, id) } }),
  )
  return (res.Item as ReceiptSubmission) || null
}

export async function updateReceiptStatus(
  submittedAt: number,
  id: string,
  status: SupporterStatus,
  reviewedBy: string,
  reviewNote?: string,
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: RECEIPTS_PK, SK: receiptSk(submittedAt, id) },
      UpdateExpression: "SET #s = :s, reviewedAt = :r, reviewedBy = :by, reviewNote = :note",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": status,
        ":r": Date.now(),
        ":by": reviewedBy,
        ":note": reviewNote ?? "",
      },
    }),
  )
}

/* ---------- public game profiles (cached from Mihomo / Enka) ---------- */
export async function saveGameProfile(email: string, profile: GameProfile): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: userPk(email), SK: gameProfileSk(profile.gameId), ...profile },
    }),
  )
}

export async function getGameProfile(email: string, game: GameId): Promise<GameProfile | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: userPk(email), SK: gameProfileSk(game) } }),
  )
  if (!res.Item) return null
  const { PK, SK, ...profile } = res.Item as GameProfile & { PK: string; SK: string }
  return profile as GameProfile
}

/* ---------- sessions ---------- */
export async function createSession(token: string, userId: string, expiresAt: number): Promise<void> {
  const session: Session = { id: token, userId, expiresAt }
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: { PK: sessionPk(token), SK: "SESSION", ...session } }),
  )
}

export async function getSession(token: string): Promise<Session | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: sessionPk(token), SK: "SESSION" } }),
  )
  const session = res.Item as Session | undefined
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    await deleteSession(token)
    return null
  }
  return session
}

export async function deleteSession(token: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: sessionPk(token), SK: "SESSION" } }),
  )
}

/* ---------- warps (game-scoped) ---------- */
export async function getWarpRecord(email: string, game: GameId, banner: BannerType): Promise<WarpRecord> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: userPk(email), SK: warpSk(game, banner) } }),
  )
  const rec = res.Item as WarpRecord | undefined
  return (
    rec || {
      id: `${userPk(email)}#${game}#${banner}`,
      userId: email.toLowerCase(),
      gameId: game,
      bannerType: banner,
      pulls: [],
      updatedAt: 0,
    }
  )
}

export async function getGameWarpRecords(email: string, game: GameId): Promise<WarpRecord[]> {
  // One Query pulls all of a user's records for a single game.
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": userPk(email), ":prefix": warpPrefix(game) },
    }),
  )
  return (res.Items as WarpRecord[]) || []
}

export async function saveWarpRecord(rec: WarpRecord): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: userPk(rec.userId),
        SK: warpSk(rec.gameId, rec.bannerType),
        ...rec,
        updatedAt: Date.now(),
      },
    }),
  )
}

// Deletes a single warp record (one banner) for a user+game.
export async function deleteWarpRecord(email: string, game: GameId, banner: BannerType): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: userPk(email), SK: warpSk(game, banner) } }),
  )
}

// Removes a user's denormalized stats row from a game's leaderboard partition.
export async function deleteUserStats(email: string, game: GameId): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: lbPk(game), SK: lbSk(email) } }),
  )
}

// Wipes every banner record for one game and drops the user from that
// game's leaderboard. Returns the number of banner records removed.
export async function clearGameData(email: string, game: GameId): Promise<number> {
  const records = await getGameWarpRecords(email, game)
  await Promise.all(records.map((r) => deleteWarpRecord(email, game, r.bannerType)))
  await deleteUserStats(email, game)
  return records.length
}

export async function addPulls(
  email: string,
  game: GameId,
  banner: BannerType,
  newPulls: Pull[],
): Promise<WarpRecord> {
  const rec = await getWarpRecord(email, game, banner)
  rec.pulls = [...newPulls, ...rec.pulls] // newest first
  rec.userId = email.toLowerCase()
  rec.gameId = game
  rec.updatedAt = Date.now()
  await saveWarpRecord(rec)
  return rec
}

/**
 * Merges pulls into a banner, de-duplicating by pull id (stable HoYoverse id
 * for URL imports). Returns the number of genuinely new pulls added. Safe to
 * re-run with an overlapping history without creating duplicates.
 */
export async function mergePulls(
  email: string,
  game: GameId,
  banner: BannerType,
  incoming: Pull[],
): Promise<number> {
  const rec = await getWarpRecord(email, game, banner)
  const seen = new Set(rec.pulls.map((p) => p.id))
  const fresh = incoming.filter((p) => !seen.has(p.id))
  if (fresh.length === 0) return 0
  // Combine, then sort newest-first by pull time for a stable timeline.
  const combined = [...fresh, ...rec.pulls].sort((a, b) => b.pulledAt - a.pulledAt)
  rec.pulls = combined
  rec.userId = email.toLowerCase()
  rec.gameId = game
  rec.updatedAt = Date.now()
  await saveWarpRecord(rec)
  return fresh.length
}

/* ---------- stats (denormalized into per-game LEADERBOARD partitions) ---------- */
export async function saveUserStats(stats: UserStats): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: lbPk(stats.gameId), SK: lbSk(stats.email), ...stats },
    }),
  )
}

export async function getGameLeaderboard(game: GameId): Promise<UserStats[]> {
  // Single Query against one game's LEADERBOARD partition — no Scan.
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": lbPk(game) },
    }),
  )
  return (res.Items as UserStats[]) || []
}

// Aggregate every game's leaderboard partition (used for global landing-page totals).
export async function getAllUserStats(): Promise<UserStats[]> {
  const perGame = await Promise.all(GAME_IDS.map((g) => getGameLeaderboard(g)))
  return perGame.flat()
}

// Idempotent demo seeding: writes a batch of demo trailblazers into a game's
// leaderboard partition only if it has fewer than the expected demo count.
export async function seedGameStatsIfEmpty(game: GameId, demo: UserStats[]): Promise<void> {
  const existing = await getGameLeaderboard(game)
  const realCount = existing.filter((u) => !u.email.startsWith("demo+")).length
  const demoCount = existing.filter((u) => u.email.startsWith("demo+")).length
  // Seed once: only if no demo rows are present yet for this game.
  if (demoCount > 0 || realCount > 50) return
  await Promise.all(demo.map((u) => saveUserStats(u)))
}

/** A single user's denormalized stats row for one game (or null). */
export async function getUserStats(email: string, game: GameId): Promise<UserStats | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: lbPk(game), SK: lbSk(email) } }),
  )
  if (!res.Item) return null
  const { PK, SK, ...stats } = res.Item as UserStats & { PK: string; SK: string }
  return stats as UserStats
}

export interface Percentiles {
  totalPlayers: number
  luck: number // % of players this user is luckier than (0-100)
  pulls: number
  fiveStars: number
  rankLuck: number // 1-indexed rank by luck score
}

/**
 * Community percentile ranking for a user within one game, computed from the
 * game's leaderboard partition (a single Query — scales as the board is the
 * one partition we already read for rankings).
 */
export async function getPercentiles(email: string, game: GameId): Promise<Percentiles | null> {
  const board = (await getGameLeaderboard(game)).filter((u) => u.totalPulls > 0)
  const me = board.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!me || board.length === 0) return null
  const n = board.length
  const pct = (count: number) => Math.round((count / n) * 100)
  const luckierThan = board.filter((u) => u.luckyScore < me.luckyScore).length
  const morePulls = board.filter((u) => u.totalPulls < me.totalPulls).length
  const moreFives = board.filter((u) => u.fiveStars < me.fiveStars).length
  const rankLuck = board.filter((u) => u.luckyScore > me.luckyScore).length + 1
  return {
    totalPlayers: n,
    luck: pct(luckierThan),
    pulls: pct(morePulls),
    fiveStars: pct(moreFives),
    rankLuck,
  }
}

/** Look up a public stats row by in-game UID for a game (for shareable profiles). */
export async function getStatsByUid(game: GameId, uid: string): Promise<UserStats | null> {
  const board = await getGameLeaderboard(game)
  return board.find((u) => u.uid === uid) ?? null
}
