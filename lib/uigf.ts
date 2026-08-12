import type { GameId } from "./games"
import type { Pull, WarpRecord } from "./types"

/**
 * UIGF v4.0 (unified) + SRGF v1.0 (Star Rail) interchange.
 *
 * These are the formats produced by community tools such as
 * biuuu/star-rail-warp-export and Snap.Hutao. Supporting them lets a user
 * export from those tools and import their full, accurate gacha history here
 * (and vice-versa).
 *
 * Spec references:
 *  - UIGF v4.0:  https://uigf.org/en/standards/uigf.html  (keys: hk4e, hkrpg, nap)
 *  - SRGF v1.0:  https://uigf.org/en/standards/srgf.html
 */

// Game id <-> UIGF v4.0 business key
const UIGF_KEY: Record<GameId, string> = {
  genshin: "hk4e",
  hsr: "hkrpg",
  zzz: "nap",
  hi3: "", // not part of UIGF
  wuwa: "", // not part of UIGF (manual-only)
  endfield: "", // not part of UIGF (manual-only)
}

// API gacha_type ids -> our internal banner ids (mirror of gacha-log map).
const GACHA_TYPE_TO_BANNER: Record<GameId, Record<string, string>> = {
  hsr: { "11": "character", "12": "lightcone", "1": "standard", "2": "standard" },
  genshin: { "301": "character", "400": "character", "302": "weapon", "200": "standard", "100": "standard", "500": "character" },
  zzz: { "2": "agent", "3": "wengine", "5": "bangboo", "1": "standard" },
  hi3: {},
  wuwa: {},
  endfield: {},
}

// Our internal banner id -> a single representative gacha_type for export.
const BANNER_TO_GACHA_TYPE: Record<GameId, Record<string, string>> = {
  hsr: { character: "11", lightcone: "12", standard: "1" },
  genshin: { character: "301", weapon: "302", standard: "200" },
  zzz: { agent: "2", wengine: "3", bangboo: "5", standard: "1" },
  hi3: {},
  wuwa: {},
  endfield: {},
}

// Per-game item_type label for a pull (best-effort, English).
function itemTypeLabel(game: GameId, type: "character" | "weapon"): string {
  if (type === "character") return game === "zzz" ? "Agents" : "Character"
  if (game === "hsr") return "Light Cone"
  if (game === "zzz") return "W-Engines"
  return "Weapon"
}

function classifyItemType(itemType: string): "character" | "weapon" {
  const t = (itemType || "").toLowerCase()
  if (t.includes("weapon") || t.includes("light cone") || t.includes("engine")) return "weapon"
  return "character"
}

// Format a unix-ms timestamp as "yyyy-MM-dd HH:mm:ss" at the given UTC offset (hours).
function formatTime(ms: number, tzOffsetHours: number): string {
  const d = new Date(ms + tzOffsetHours * 3600_000)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
}

// Parse a "yyyy-MM-dd HH:mm:ss" wall-clock string at the given offset into unix-ms.
function parseTime(time: string, tzOffsetHours: number): number {
  const m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(time || "")
  if (!m) return Date.now()
  const [, y, mo, da, h, mi, s] = m.map(Number) as unknown as number[]
  return Date.UTC(y, mo - 1, da, h, mi, s) - tzOffsetHours * 3600_000
}

interface RawRecord {
  gacha_type?: string
  uigf_gacha_type?: string
  name?: string
  item_id?: string
  item_type?: string
  rank_type?: string
  time?: string
  id?: string
}

export interface UigfImportResult {
  byBanner: Record<string, Pull[]> // oldest-first within each banner
  total: number
  uid?: string
}

/**
 * Parse a UIGF v4.0, SRGF v1.0, or legacy UIGF (Genshin) JSON object and extract
 * pulls for the requested game, grouped by our internal banner id.
 */
export function parseUigf(game: GameId, data: unknown): UigfImportResult {
  if (!data || typeof data !== "object") {
    throw new Error("That file isn't valid JSON.")
  }
  const obj = data as Record<string, any>
  const typeMap = GACHA_TYPE_TO_BANNER[game]
  if (!typeMap || Object.keys(typeMap).length === 0) {
    throw new Error("This game can't be imported from a UIGF/SRGF file.")
  }

  // Collect {records, uid, tz} blocks that belong to the target game.
  const blocks: { list: RawRecord[]; uid?: string; tz: number }[] = []

  const uigfKey = UIGF_KEY[game]
  if (uigfKey && Array.isArray(obj[uigfKey])) {
    // UIGF v4.0 unified format
    for (const acct of obj[uigfKey]) {
      blocks.push({
        list: Array.isArray(acct.list) ? acct.list : [],
        uid: acct.uid != null ? String(acct.uid) : undefined,
        tz: typeof acct.timezone === "number" ? acct.timezone : 8,
      })
    }
  } else if (Array.isArray(obj.list)) {
    // SRGF v1.0 (HSR) or legacy UIGF (Genshin): single top-level list
    const info = obj.info || {}
    const isSrgf = "srgf_version" in info
    const isLegacyUigf = "uigf_version" in info
    if (isSrgf && game !== "hsr") throw new Error("This SRGF file is for Honkai: Star Rail.")
    if (isLegacyUigf && game !== "genshin") throw new Error("This UIGF file is for Genshin Impact.")
    blocks.push({
      list: obj.list,
      uid: info.uid != null ? String(info.uid) : undefined,
      tz: typeof info.region_time_zone === "number" ? info.region_time_zone : 8,
    })
  } else {
    throw new Error("Couldn't find any gacha records for this game in that file.")
  }

  const byBanner: Record<string, Pull[]> = {}
  let uid: string | undefined
  let total = 0

  for (const block of blocks) {
    uid = uid || block.uid
    for (const r of block.list) {
      const gt = String(r.uigf_gacha_type ?? r.gacha_type ?? "")
      const bannerId = typeMap[gt]
      if (!bannerId) continue
      const rarity = Number(r.rank_type) as 3 | 4 | 5
      if (![3, 4, 5].includes(rarity)) continue
      const name = (r.name && String(r.name)) || (r.item_id ? `Item ${r.item_id}` : "Unknown")
      if (!byBanner[bannerId]) byBanner[bannerId] = []
      byBanner[bannerId].push({
        id: r.id ? String(r.id) : `${gt}-${r.time}-${name}`,
        name,
        rarity,
        type: classifyItemType(r.item_type || ""),
        pulledAt: parseTime(r.time || "", block.tz),
      })
      total++
    }
  }

  // oldest-first chronological within each banner (matches our storage convention)
  for (const id of Object.keys(byBanner)) {
    byBanner[id].sort((a, b) => a.pulledAt - b.pulledAt)
  }

  if (total === 0) {
    throw new Error("No matching gacha records were found in that file.")
  }

  return { byBanner, total, uid }
}

const APP_NAME = "Astral Warp Archive"
const APP_VERSION = "1.0.0"

/**
 * Build a UIGF v4.0 export object for a single game's records.
 * (UIGF v4.0 is the current cross-tool standard and supports all three games.)
 */
export function buildUigfExport(game: GameId, uid: string, records: WarpRecord[], tz = 8): object {
  const key = UIGF_KEY[game]
  if (!key) throw new Error("This game cannot be exported to UIGF.")
  const bannerMap = BANNER_TO_GACHA_TYPE[game]

  const list: RawRecord[] = []
  for (const rec of records) {
    const gachaType = bannerMap[rec.bannerType]
    if (!gachaType) continue
    // pulls are newest-first in storage; export oldest-first
    const ordered = [...rec.pulls].sort((a, b) => a.pulledAt - b.pulledAt)
    for (const p of ordered) {
      const entry: RawRecord = {
        gacha_type: gachaType,
        name: p.name,
        item_type: itemTypeLabel(game, p.type),
        rank_type: String(p.rarity),
        time: formatTime(p.pulledAt, tz),
        id: p.id,
      }
      if (game === "genshin") entry.uigf_gacha_type = gachaType
      list.push(entry)
    }
  }

  list.sort((a, b) => String(a.id).localeCompare(String(b.id)))

  return {
    info: {
      export_timestamp: String(Math.floor(Date.now() / 1000)),
      export_app: APP_NAME,
      export_app_version: APP_VERSION,
      version: "v4.0",
    },
    [key]: [
      {
        uid: uid || "0",
        timezone: tz,
        lang: "en-us",
        list,
      },
    ],
  }
}

/** Build an Excel-compatible CSV of every pull across all banners. */
export function buildCsvExport(game: GameId, records: WarpRecord[]): string {
  const rows: string[] = ["banner,rarity,type,name,won_5050,time_iso"]
  const all: { banner: string; p: Pull }[] = []
  for (const rec of records) {
    for (const p of rec.pulls) all.push({ banner: rec.bannerType, p })
  }
  all.sort((a, b) => b.p.pulledAt - a.p.pulledAt)
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  for (const { banner, p } of all) {
    rows.push(
      [
        banner,
        String(p.rarity),
        p.type,
        esc(p.name),
        p.won5050 === undefined ? "" : p.won5050 ? "win" : "lose",
        new Date(p.pulledAt).toISOString(),
      ].join(","),
    )
  }
  return rows.join("\n")
}
