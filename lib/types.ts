import type { GameId } from "./games"

// Banner ids are now game-specific strings (see lib/games.ts).
export type BannerType = string

// Rarity: 5, 4, or 3 stars
export interface Pull {
  id: string
  name: string // character / weapon / item name
  rarity: 3 | 4 | 5
  type: "character" | "weapon"
  // For 5-stars on limited banners: was it the rate-up (won 50/50) or off-banner (lost)?
  won5050?: boolean
  pulledAt: number
}

// Lifecycle of a Supporter unlock backed by a payment receipt.
// none: never submitted · pending: awaiting admin review ·
// approved: verified (premium unlocked) · rejected: declined, may resubmit.
export type SupporterStatus = "none" | "pending" | "approved" | "rejected"

export interface User {
  id: string // USER#<email>
  email: string
  passwordHash: string
  displayName: string
  uid: string // optional in-game UID (HSR, kept for backwards compat)
  uids?: Partial<Record<GameId, string>> // per-game UIDs
  isSupporter?: boolean // effective premium gate (true only when approved)
  supporterStatus?: SupporterStatus
  supporterSince?: number
  createdAt: number
}

// A payment receipt uploaded by a user to claim Supporter status.
// Stored in one partition (PK = RECEIPTS) keyed by id for admin review.
export interface ReceiptSubmission {
  id: string
  email: string
  displayName: string
  pathname: string // private blob pathname (never exposed directly)
  filename: string
  contentType: string
  provider: string // e.g. "PayPal", "Ko-fi"
  amount?: string // free-text amount the user entered
  note?: string // optional note / transaction id
  status: SupporterStatus // pending | approved | rejected
  submittedAt: number
  reviewedAt?: number
  reviewedBy?: string
  reviewNote?: string // admin reason on rejection
}

// Showcased character pulled from a public profile API (Mihomo / Enka)
export interface ShowcaseCharacter {
  id: string
  name: string
  rarity: number
  level: number
  rank: number // eidolon / constellation / mindscape level
  icon: string // absolute CDN url
  portrait: string // absolute CDN url
  element: string
  elementColor: string
  elementIcon: string
  path: string // path / weapon-type / specialty
  pathIcon: string
}

// Public account profile fetched from a provider (Mihomo for HSR, Enka for Genshin/ZZZ)
export interface GameProfile {
  gameId: GameId
  uid: string
  nickname: string
  level: number
  worldLevel: number
  signature: string
  avatarIcon: string // absolute CDN url
  friendCount: number
  // generic labelled stats (varies per game) shown as pills
  stats: { label: string; value: number | string }[]
  characters: ShowcaseCharacter[]
  fetchedAt: number
}

// Legacy alias (HSR) — kept so older imports compile
export type HsrProfile = GameProfile

export interface PublicUser {
  email: string
  displayName: string
  uid: string
  uids?: Partial<Record<GameId, string>>
  isSupporter?: boolean
  supporterStatus?: SupporterStatus
  supporterSince?: number
  isAdmin?: boolean
  createdAt: number
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
  category: "daily" | "weekly" | "goal"
  createdAt: number
}

export interface Session {
  id: string // SESSION#<token>
  userId: string // email
  expiresAt: number
}

// Daily-visit streak tracking (one row per user, SK = ACTIVITY)
export interface Activity {
  lastActiveDay: string // YYYY-MM-DD (UTC)
  currentStreak: number
  longestStreak: number
  totalDays: number
  updatedAt: number
}

export interface WarpRecord {
  id: string
  userId: string
  gameId: GameId
  bannerType: BannerType
  pulls: Pull[]
  updatedAt: number
}

// Aggregated stats used by leaderboards and the public profile (per game)
export interface UserStats {
  email: string
  gameId: GameId
  displayName: string
  uid: string
  totalPulls: number
  fiveStars: number
  fourStars: number
  luckyScore: number // higher = luckier
  avgFivePity: number
  win5050Rate: number // 0-1
  updatedAt: number
}

export interface BannerAnalytics {
  gameId: GameId
  bannerType: BannerType
  totalPulls: number
  fiveStars: number
  fourStars: number
  threeStars: number
  currentPity: number // pulls since last 5-star
  fourStarPity: number // pulls since last 4-star
  avgFivePity: number
  fiveStarHistory: { name: string; pity: number; won5050?: boolean; pulledAt: number }[]
  win5050: { wins: number; total: number }
}
