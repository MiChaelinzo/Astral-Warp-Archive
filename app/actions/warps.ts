"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { getCurrentUser } from "@/lib/auth"
import {
  addPulls,
  mergePulls,
  getGameWarpRecords,
  saveUserStats,
  getWarpRecord,
  saveWarpRecord,
  clearGameData,
} from "@/lib/db"
import { buildUserStats } from "@/lib/warp-stats"
import { importGachaLogFromUrl } from "@/lib/gacha-log"
import { parseUigf } from "@/lib/uigf"
import { ProfileError } from "@/lib/profile-error"
import type { Pull } from "@/lib/types"
import { getGame, isGameId, getBanner, GAME_IDS, type GameId } from "@/lib/games"

async function refreshStats(email: string, game: GameId, displayName: string, uid: string) {
  const records = await getGameWarpRecords(email, game)
  await saveUserStats(buildUserStats(email, game, displayName, uid, records))
}

function gameUid(user: { uid: string; uids?: Partial<Record<GameId, string>> }, game: GameId): string {
  return user.uids?.[game] || (game === "hsr" ? user.uid : "") || ""
}

export type WarpActionState = { error?: string; success?: string } | undefined

export async function recordPull(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }

  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  const banner = String(formData.get("banner") || "")
  const bannerDef = getBanner(game, banner)
  if (!bannerDef) return { error: "Invalid banner." }

  const name = String(formData.get("name") || "").trim()
  const rarity = Number(formData.get("rarity")) as 3 | 4 | 5
  const type = String(formData.get("type") || "character") as "character" | "weapon"
  const won5050Raw = String(formData.get("won5050") || "")

  if (!name) return { error: "Enter the item or character name." }
  if (![3, 4, 5].includes(rarity)) return { error: "Select a rarity." }

  const pull: Pull = { id: nanoid(10), name, rarity, type, pulledAt: Date.now() }
  if (rarity === 5 && bannerDef.limited && won5050Raw) {
    pull.won5050 = won5050Raw === "win"
  }

  await addPulls(user.email, game, banner, [pull])
  await refreshStats(user.email, game, user.displayName, gameUid(user, game))
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")
  return { success: `Recorded ${rarity}★ ${name}.` }
}

// Quick batch import: paste lines like "5 Acheron win" or "4 Pela" or "3 Cloudflame Slash"
export async function importPulls(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }

  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  const banner = String(formData.get("banner") || "")
  const bannerDef = getBanner(game, banner)
  if (!bannerDef) return { error: "Invalid banner." }

  const raw = String(formData.get("bulk") || "").trim()
  if (!raw) return { error: "Paste at least one pull." }

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean)
  const pulls: Pull[] = []
  const now = Date.now()
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/)
    const rarity = Number(parts[0]) as 3 | 4 | 5
    if (![3, 4, 5].includes(rarity)) continue
    let rest = parts.slice(1)
    let won5050: boolean | undefined
    const last = rest[rest.length - 1]?.toLowerCase()
    if (rarity === 5 && bannerDef.limited) {
      if (last === "win") {
        won5050 = true
        rest = rest.slice(0, -1)
      } else if (last === "lose" || last === "loss") {
        won5050 = false
        rest = rest.slice(0, -1)
      }
    }
    const name = rest.join(" ")
    if (!name) continue
    pulls.push({
      id: nanoid(10),
      name,
      rarity,
      type: "character",
      won5050,
      pulledAt: now + (lines.length - i),
    })
  }

  if (!pulls.length) return { error: "No valid pulls found. Use: <rarity> <name> [win|lose]" }

  await addPulls(user.email, game, banner, pulls.reverse())
  await refreshStats(user.email, game, user.displayName, gameUid(user, game))
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")
  return { success: `Imported ${pulls.length} ${getGame(game).pullNoun.toLowerCase()}s.` }
}

export async function resetBanner(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }
  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  const banner = String(formData.get("banner") || "")
  if (!getBanner(game, banner)) return { error: "Invalid banner." }

  const rec = await getWarpRecord(user.email, game, banner)
  rec.pulls = []
  await saveWarpRecord(rec)
  await refreshStats(user.email, game, user.displayName, gameUid(user, game))
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")
  return { success: "Banner history cleared." }
}

// Deletes a single pull by id from a banner — used to remove an accidental
// duplicate without touching the rest of your history.
export async function deletePull(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }
  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  const banner = String(formData.get("banner") || "")
  if (!getBanner(game, banner)) return { error: "Invalid banner." }
  const pullId = String(formData.get("pullId") || "")
  if (!pullId) return { error: "Missing pull id." }

  const rec = await getWarpRecord(user.email, game, banner)
  const before = rec.pulls.length
  rec.pulls = rec.pulls.filter((p) => p.id !== pullId)
  if (rec.pulls.length === before) return { error: "That pull was already removed." }

  await saveWarpRecord(rec)
  await refreshStats(user.email, game, user.displayName, gameUid(user, game))
  revalidatePath("/database")
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")
  return { success: "Pull deleted." }
}

// Wipes ALL pull history for the current game (every banner) and drops the
// user from that game's leaderboard. Useful before a clean re-import.
export async function resetGame(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }
  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  // Require a typed confirmation to avoid accidental wipes.
  if (String(formData.get("confirm") || "").trim().toUpperCase() !== "RESET") {
    return { error: `Type RESET to confirm clearing your ${getGame(game).name} data.` }
  }

  const removed = await clearGameData(user.email, game)
  revalidatePath("/database")
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")
  if (removed === 0) return { success: `No ${getGame(game).name} data to clear.` }
  return { success: `Cleared all ${getGame(game).name} history. You can re-import a clean file now.` }
}

// Wipes pull history across EVERY game and removes the user from all
// leaderboards. The account itself (login) is preserved.
export async function resetAccount(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }
  if (String(formData.get("confirm") || "").trim().toUpperCase() !== "RESET EVERYTHING") {
    return { error: 'Type "RESET EVERYTHING" exactly to confirm.' }
  }

  let total = 0
  for (const g of GAME_IDS) {
    total += await clearGameData(user.email, g)
  }
  revalidatePath("/database")
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")
  return { success: `Account reset — cleared ${total} banner record${total === 1 ? "" : "s"} across all games.` }
}

// Imports complete pull history from a pasted HoYoverse gacha-log URL.
// The authkey embedded in the URL is used only for this request and never stored.
export async function importFromUrl(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }

  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  if (getGame(game).importProvider === "none") {
    return { error: "URL import isn't available for this game." }
  }

  const url = String(formData.get("url") || "").trim()
  if (!url) return { error: "Paste your in-game history URL." }

  let result
  try {
    result = await importGachaLogFromUrl(game, url)
  } catch (err) {
    if (err instanceof ProfileError) return { error: err.message }
    console.log("[v0] importFromUrl error:", err instanceof Error ? err.message : String(err))
    return { error: "Something went wrong during import. Please try again." }
  }

  let added = 0
  for (const [banner, pulls] of Object.entries(result.byBanner)) {
    if (!getBanner(game, banner)) continue
    added += await mergePulls(user.email, game, banner, pulls)
  }

  await refreshStats(user.email, game, user.displayName, gameUid(user, game))
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")

  const noun = getGame(game).pullPlural.toLowerCase()
  if (added === 0) {
    return { success: `Already up to date — no new ${noun} found (${result.total} total in history).` }
  }
  return { success: `Imported ${added} new ${noun} from your history.` }
}

// Imports a UIGF v4.0 / SRGF v1.0 .json file (e.g. exported from star-rail-warp-export).
export async function importFromFile(_prev: WarpActionState, formData: FormData): Promise<WarpActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }

  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }

  const file = formData.get("file")
  let text = String(formData.get("json") || "")
  if (file && typeof (file as File).text === "function") {
    text = await (file as File).text()
  }
  if (!text.trim()) return { error: "Choose a UIGF/SRGF .json file to import." }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { error: "That file isn't valid JSON. Export a UIGF or SRGF .json and try again." }
  }

  let parsed
  try {
    parsed = parseUigf(game, data)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not read that file." }
  }

  let added = 0
  for (const [banner, pulls] of Object.entries(parsed.byBanner)) {
    if (!getBanner(game, banner)) continue
    added += await mergePulls(user.email, game, banner, pulls)
  }

  // If the file carried a UID and the user has none for this game, save it.
  if (parsed.uid && !gameUid(user, game)) {
    try {
      const { updateUserGameUid } = await import("@/lib/db")
      await updateUserGameUid(user.email, game, parsed.uid)
    } catch {}
  }

  await refreshStats(user.email, game, user.displayName, parsed.uid || gameUid(user, game))
  revalidatePath("/dashboard")
  revalidatePath("/leaderboard")

  const noun = getGame(game).pullPlural.toLowerCase()
  if (added === 0) {
    return { success: `File read OK — no new ${noun} (your history is already current with ${parsed.total} in the file).` }
  }
  return { success: `Imported ${added} new ${noun} from your file.` }
}
