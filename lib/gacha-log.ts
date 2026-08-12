import { ProfileError } from "./profile-error"
import type { GameId } from "./games"
import type { Pull } from "./types"

/**
 * Imports real pull history directly from HoYoverse's public gacha-log API.
 *
 * The player pastes the authenticated history URL extracted from their game
 * client cache. That URL already contains the correct regional host, path, and
 * `authkey`. We reuse it verbatim and only override the pagination params
 * (`gacha_type`, `page`, `size`, `end_id`) for each request.
 *
 * The authkey is short-lived (~24h) and is NEVER persisted — it lives only for
 * the duration of the import request.
 */

// Maps each game's API gacha_type ids -> our internal banner ids.
const GACHA_TYPE_MAP: Record<GameId, Record<string, string>> = {
  hsr: {
    "11": "character", // Character Event Warp
    "12": "lightcone", // Light Cone Event Warp
    "1": "standard", // Stellar Warp
    "2": "standard", // Departure Warp (beginner) -> fold into standard
  },
  genshin: {
    "301": "character", // Character Event Wish
    "400": "character", // Character Event Wish-2
    "302": "weapon", // Weapon Event Wish
    "200": "standard", // Permanent (Wanderlust)
    "100": "standard", // Beginner -> fold into standard
    "500": "character", // Chronicled Wish -> character
  },
  zzz: {
    "2": "agent", // Exclusive Channel (Agent)
    "3": "wengine", // W-Engine Channel
    "5": "bangboo", // Bangboo Channel
    "1": "standard", // Stable Channel
  },
  hi3: {},
  wuwa: {},
  endfield: {},
}

interface GachaLogItem {
  id: string
  gacha_type: string
  name: string
  item_type: string
  rank_type: string
  time: string
}

function classifyType(itemType: string): "character" | "weapon" {
  const t = itemType.toLowerCase()
  if (t.includes("weapon") || t.includes("light cone") || t.includes("w-engine") || t.includes("engine")) {
    return "weapon"
  }
  return "character"
}

// Distinct gacha_type query values to crawl for a given game.
function gachaTypesFor(game: GameId): string[] {
  return Object.keys(GACHA_TYPE_MAP[game] || {})
}

function buildRequestUrl(template: URL, gachaType: string, page: number, endId: string, size = 20): string {
  const u = new URL(template.toString())
  u.searchParams.set("gacha_type", gachaType)
  // some games use default_gacha_type as well; keep it aligned
  if (u.searchParams.has("default_gacha_type")) {
    u.searchParams.set("default_gacha_type", gachaType)
  }
  u.searchParams.set("page", String(page))
  u.searchParams.set("size", String(size))
  u.searchParams.set("end_id", endId)
  return u.toString()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface GachaImportResult {
  // banner id -> pulls (oldest first)
  byBanner: Record<string, Pull[]>
  total: number
  region?: string
}

/**
 * Crawls every banner's full history from the pasted URL.
 * Returns pulls grouped by our internal banner id.
 */
export async function importGachaLogFromUrl(game: GameId, pastedUrl: string): Promise<GachaImportResult> {
  if (game === "hi3") {
    throw new ProfileError("URL import isn't available for this game.", 400)
  }

  let template: URL
  try {
    template = new URL(pastedUrl.trim())
  } catch {
    throw new ProfileError("That doesn't look like a valid URL. Paste the full link from your game client.", 400)
  }

  if (!template.searchParams.get("authkey")) {
    throw new ProfileError("That URL is missing its authkey. Make sure you copied the entire link.", 400)
  }

  const typeMap = GACHA_TYPE_MAP[game]
  const byBanner: Record<string, Pull[]> = {}
  let total = 0
  let region: string | undefined

  for (const gachaType of gachaTypesFor(game)) {
    let endId = "0"
    let page = 1
    let guard = 0 // safety cap: 200 pages * 20 = 4000 pulls per banner

    while (guard < 200) {
      guard++
      const url = buildRequestUrl(template, gachaType, page, endId)
      let res: Response
      try {
        res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
          cache: "no-store",
        })
      } catch {
        throw new ProfileError("Couldn't reach HoYoverse's servers. Please try again.", 502)
      }

      if (!res.ok) {
        throw new ProfileError("HoYoverse rejected the request. Your link may have expired.", res.status)
      }

      const json = await res.json().catch(() => null)
      if (!json) throw new ProfileError("Got an unexpected response from HoYoverse.", 502)

      // retcode 0 = OK. Common errors: -101 authkey timeout, -100 invalid authkey.
      if (json.retcode !== 0) {
        const msg: string = json.message || ""
        if (json.retcode === -101 || /timeout|expired/i.test(msg)) {
          throw new ProfileError("Your import link has expired. Open the history page in-game again and copy a fresh link.", 401)
        }
        if (json.retcode === -100 || /authkey/i.test(msg)) {
          throw new ProfileError("That link's authkey is invalid. Copy the full URL directly from your game client.", 401)
        }
        if (json.retcode === -110 || /visit too frequently|frequent/i.test(msg)) {
          // brief backoff and retry the same page once
          await sleep(1200)
          continue
        }
        throw new ProfileError(msg || "HoYoverse returned an error.", 400)
      }

      region = json.data?.region || region
      const list: GachaLogItem[] = json.data?.list || []
      if (list.length === 0) break // no more pages for this banner

      for (const item of list) {
        const bannerId = typeMap[item.gacha_type] || typeMap[gachaType]
        if (!bannerId) continue
        const rarity = Number(item.rank_type) as 3 | 4 | 5
        if (![3, 4, 5].includes(rarity)) continue
        if (!byBanner[bannerId]) byBanner[bannerId] = []
        byBanner[bannerId].push({
          id: item.id, // stable HoYoverse id -> enables dedupe
          name: item.name,
          rarity,
          type: classifyType(item.item_type),
          pulledAt: new Date(item.time.replace(" ", "T")).getTime() || Date.now(),
        })
      }

      endId = list[list.length - 1].id
      page++
      await sleep(300) // be gentle with the public API
    }
  }

  // API returns newest-first; flip each banner to oldest-first chronological order.
  for (const bannerId of Object.keys(byBanner)) {
    byBanner[bannerId].reverse()
    total += byBanner[bannerId].length
  }

  if (total === 0) {
    throw new ProfileError("No pull history found on that link. Make sure you've opened the in-game history page first.", 404)
  }

  return { byBanner, total, region }
}
