import type { GameId } from "./games"

export type EventKind = "character" | "lightcone" | "weapon" | "collab" | "rerun"
export type EventPhase = "live" | "upcoming" | "ended"

export interface FeaturedUnit {
  name: string
  rarity: 4 | 5
  // short descriptor: element / path / role, shown as a chip
  role?: string
}

export interface BannerEvent {
  id: string
  gameId: GameId
  title: string
  kind: EventKind
  // maps to a GameDef banner id where relevant (character/lightcone/weapon)
  bannerId?: string
  featured: FeaturedUnit[]
  start: string // ISO date (UTC)
  end: string // ISO date (UTC)
  isCollab?: boolean
  // dates/units announced but not final — surfaced with an "estimated" note
  estimated?: boolean
  // optional key-art shown on the highlight card
  image?: string
  description: string
}

/**
 * Banner schedule for each game. Dates are UTC and, for unreleased content,
 * marked `estimated` since official windows can shift. This is editorial data
 * — not pulled from a live API — so it can be curated as patches are revealed.
 */
export const BANNER_EVENTS: BannerEvent[] = [
  // ---------------- Honkai: Star Rail ----------------
  {
    id: "hsr-fate-collab",
    gameId: "hsr",
    title: "Fate/stay night [Unlimited Blade Works] Collaboration",
    kind: "collab",
    bannerId: "character",
    isCollab: true,
    estimated: true,
    image: "/events/fate-collab.png",
    featured: [
      { name: "Saber (Artoria Pendragon)", rarity: 5, role: "The Knight of the Sword" },
      { name: "Archer (EMIYA)", rarity: 5, role: "The Unlimited Blade" },
      { name: "Rin Tohsaka", rarity: 4, role: "Collab 4★" },
    ],
    start: "2026-08-13T06:00:00Z",
    end: "2026-09-03T05:59:00Z",
    description:
      "Star Rail's landmark crossover with Fate/stay night brings two limited 5★ collaboration warps to the Astral Express. Window and units are based on the reveal and are subject to HoYoverse's official confirmation.",
  },
  {
    id: "hsr-live-1",
    gameId: "hsr",
    title: "Character Event Warp — Phase I",
    kind: "character",
    bannerId: "character",
    featured: [
      { name: "Castorice", rarity: 5, role: "Remembrance" },
      { name: "Hyacine", rarity: 5, role: "Abundance" },
    ],
    start: "2026-07-02T06:00:00Z",
    end: "2026-08-12T05:59:00Z",
    description: "The current featured limited warp running before the Fate collaboration takes over.",
  },
  {
    id: "hsr-upcoming-lc",
    gameId: "hsr",
    title: "Fate Collaboration — Light Cone Warp",
    kind: "lightcone",
    bannerId: "lightcone",
    isCollab: true,
    estimated: true,
    featured: [
      { name: "Avalon (Saber signature)", rarity: 5, role: "Preservation LC" },
      { name: "Unlimited Blade Works (EMIYA signature)", rarity: 5, role: "The Hunt LC" },
    ],
    start: "2026-08-13T06:00:00Z",
    end: "2026-09-03T05:59:00Z",
    description: "Signature collaboration Light Cones running alongside the Fate character warps.",
  },
  {
    id: "hsr-upcoming-2",
    gameId: "hsr",
    title: "Character Event Warp — Post-Collab",
    kind: "character",
    bannerId: "character",
    estimated: true,
    featured: [
      { name: "Cerydra", rarity: 5, role: "Erudition" },
      { name: "Cyrene", rarity: 5, role: "Remembrance" },
    ],
    start: "2026-09-03T06:00:00Z",
    end: "2026-10-14T05:59:00Z",
    description: "Estimated follow-up featured warp after the collaboration concludes.",
  },

  // ---------------- Genshin Impact ----------------
  {
    id: "gi-live-1",
    gameId: "genshin",
    title: "Character Event Wish — Phase I",
    kind: "character",
    bannerId: "character",
    featured: [
      { name: "Varesa", rarity: 5, role: "Electro" },
      { name: "Ineffa", rarity: 5, role: "Electro" },
    ],
    start: "2026-07-08T06:00:00Z",
    end: "2026-07-29T05:59:00Z",
    description: "Current double featured character wish.",
  },
  {
    id: "gi-upcoming-1",
    gameId: "genshin",
    title: "Character Event Wish — Phase II",
    kind: "character",
    bannerId: "character",
    estimated: true,
    featured: [{ name: "Nefer", rarity: 5, role: "Dendro" }],
    start: "2026-07-29T06:00:00Z",
    end: "2026-08-19T05:59:00Z",
    description: "Estimated next featured wish for the upcoming patch.",
  },

  // ---------------- Zenless Zone Zero ----------------
  {
    id: "zzz-live-1",
    gameId: "zzz",
    title: "Exclusive Channel — Agent",
    kind: "character",
    bannerId: "agent",
    featured: [{ name: "Orphie & Magus", rarity: 5, role: "S-Rank Agent" }],
    start: "2026-07-09T06:00:00Z",
    end: "2026-07-30T05:59:00Z",
    description: "Current featured S-Rank Agent channel.",
  },
  {
    id: "zzz-upcoming-1",
    gameId: "zzz",
    title: "Exclusive Channel — Agent (Next)",
    kind: "character",
    bannerId: "agent",
    estimated: true,
    featured: [{ name: "Jufufu", rarity: 5, role: "S-Rank Agent" }],
    start: "2026-07-30T06:00:00Z",
    end: "2026-08-20T05:59:00Z",
    description: "Estimated upcoming S-Rank Agent.",
  },

  // ---------------- Wuthering Waves ----------------
  {
    id: "wuwa-live-1",
    gameId: "wuwa",
    title: "Featured Resonator Convene",
    kind: "character",
    bannerId: "resonator",
    featured: [{ name: "Qiuyuan", rarity: 5, role: "Spectro" }],
    start: "2026-07-10T06:00:00Z",
    end: "2026-07-31T05:59:00Z",
    description: "Current featured limited Resonator.",
  },
  {
    id: "wuwa-upcoming-1",
    gameId: "wuwa",
    title: "Featured Resonator Convene (Next)",
    kind: "character",
    bannerId: "resonator",
    estimated: true,
    featured: [{ name: "Galbrena", rarity: 5, role: "Havoc" }],
    start: "2026-07-31T06:00:00Z",
    end: "2026-08-21T05:59:00Z",
    description: "Estimated upcoming limited Resonator.",
  },
]

export function getEventPhase(event: Pick<BannerEvent, "start" | "end">, now = Date.now()): EventPhase {
  const start = Date.parse(event.start)
  const end = Date.parse(event.end)
  if (now < start) return "upcoming"
  if (now > end) return "ended"
  return "live"
}

/** Events for a game, split by phase and sorted for display (live → upcoming → ended). */
export function getGameEvents(gameId: GameId, now = Date.now()) {
  const all = BANNER_EVENTS.filter((e) => e.gameId === gameId)
  const live = all
    .filter((e) => getEventPhase(e, now) === "live")
    .sort((a, b) => Date.parse(a.end) - Date.parse(b.end))
  const upcoming = all
    .filter((e) => getEventPhase(e, now) === "upcoming")
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  const ended = all
    .filter((e) => getEventPhase(e, now) === "ended")
    .sort((a, b) => Date.parse(b.end) - Date.parse(a.end))
  return { live, upcoming, ended }
}

/** The most prominent collaboration to spotlight (prefers live, else soonest upcoming). */
export function getFeaturedCollab(gameId: GameId, now = Date.now()): BannerEvent | null {
  const collabs = BANNER_EVENTS.filter((e) => e.gameId === gameId && e.isCollab)
  const live = collabs.find((e) => getEventPhase(e, now) === "live")
  if (live) return live
  const upcoming = collabs
    .filter((e) => getEventPhase(e, now) === "upcoming")
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  return upcoming[0] ?? null
}
