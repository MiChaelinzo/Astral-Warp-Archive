import type { LucideIcon } from "lucide-react"
import { TrainFront, Wind, Cpu, Swords, Waves, Hexagon } from "lucide-react"

export type GameId = "hsr" | "genshin" | "zzz" | "hi3" | "wuwa" | "endfield"

export type ImportProvider = "mihomo" | "enka-genshin" | "enka-zzz" | "none"

export interface BannerDef {
  id: string
  name: string
  short: string
  softPity: number
  hardPity: number
  // Whether this banner has a 50/50 (limited) mechanic
  limited: boolean
}

export interface GameDef {
  id: GameId
  name: string
  short: string
  icon: LucideIcon
  // terminology
  pullNoun: string // "Warp", "Wish", "Signal", "Supply"
  pullPlural: string // "Warps", "Wishes", "Signals", "Supplies"
  pullVerb: string // "warp", "wish"...
  currency: string // "Stellar Jade", "Primogems"...
  currencyPerPull: number // in-game currency cost of one pull
  // approximate USD value of one pull, derived from the best top-up bundle
  usdPerPull: number
  topRarity: 5
  // theme accent (hsl values applied via inline style / class)
  accent: string // hex for chips/badges
  banners: BannerDef[]
  importProvider: ImportProvider
  // example UID for the import placeholder
  uidPlaceholder: string
  uidLength: number
  // server data version label used in messaging
  blurb: string
}

export const GAMES: Record<GameId, GameDef> = {
  hsr: {
    id: "hsr",
    name: "Honkai: Star Rail",
    short: "Star Rail",
    icon: TrainFront,
    pullNoun: "Warp",
    pullPlural: "Warps",
    pullVerb: "warp",
    currency: "Stellar Jade",
    currencyPerPull: 160,
    usdPerPull: 1.93,
    topRarity: 5,
    accent: "#f5c542",
    importProvider: "mihomo",
    uidPlaceholder: "800333171",
    uidLength: 9,
    blurb: "Track warps across every banner and watch your pity climb.",
    banners: [
      { id: "character", name: "Character Event Warp", short: "Character", softPity: 74, hardPity: 90, limited: true },
      { id: "lightcone", name: "Light Cone Event Warp", short: "Light Cone", softPity: 64, hardPity: 80, limited: true },
      { id: "standard", name: "Stellar Warp", short: "Standard", softPity: 74, hardPity: 90, limited: false },
    ],
  },
  genshin: {
    id: "genshin",
    name: "Genshin Impact",
    short: "Genshin",
    icon: Wind,
    pullNoun: "Wish",
    pullPlural: "Wishes",
    pullVerb: "wish",
    currency: "Primogems",
    currencyPerPull: 160,
    usdPerPull: 1.93,
    topRarity: 5,
    accent: "#4fc3f7",
    importProvider: "enka-genshin",
    uidPlaceholder: "618285856",
    uidLength: 9,
    blurb: "Log wishes on every banner and master your pity counts.",
    banners: [
      { id: "character", name: "Character Event Wish", short: "Character", softPity: 74, hardPity: 90, limited: true },
      { id: "weapon", name: "Weapon Event Wish", short: "Weapon", softPity: 63, hardPity: 80, limited: true },
      { id: "standard", name: "Wanderlust Invocation", short: "Standard", softPity: 74, hardPity: 90, limited: false },
    ],
  },
  zzz: {
    id: "zzz",
    name: "Zenless Zone Zero",
    short: "ZZZ",
    icon: Cpu,
    pullNoun: "Signal",
    pullPlural: "Signals",
    pullVerb: "signal",
    currency: "Polychrome",
    currencyPerPull: 160,
    usdPerPull: 1.93,
    topRarity: 5,
    accent: "#ff7043",
    importProvider: "enka-zzz",
    uidPlaceholder: "1000000094",
    uidLength: 10,
    blurb: "Track Signal Searches across Agents, W-Engines, and Bangboo.",
    banners: [
      { id: "agent", name: "Exclusive Channel (Agent)", short: "Agent", softPity: 74, hardPity: 90, limited: true },
      { id: "wengine", name: "W-Engine Channel", short: "W-Engine", softPity: 64, hardPity: 80, limited: true },
      { id: "bangboo", name: "Bangboo Channel", short: "Bangboo", softPity: 64, hardPity: 80, limited: false },
      { id: "standard", name: "Stable Channel", short: "Standard", softPity: 74, hardPity: 90, limited: false },
    ],
  },
  hi3: {
    id: "hi3",
    name: "Honkai Impact 3rd",
    short: "Honkai 3rd",
    icon: Swords,
    pullNoun: "Supply",
    pullPlural: "Supplies",
    pullVerb: "supply",
    currency: "Crystals",
    currencyPerPull: 280,
    usdPerPull: 2.2,
    topRarity: 5,
    accent: "#ba68c8",
    importProvider: "none",
    uidPlaceholder: "manual only",
    uidLength: 0,
    blurb: "Manually track Expansion and Focused Supply pulls.",
    banners: [
      { id: "expansion", name: "Expansion Supply", short: "Expansion", softPity: 0, hardPity: 100, limited: true },
      { id: "focused", name: "Focused Supply", short: "Focused", softPity: 0, hardPity: 50, limited: true },
    ],
  },
  wuwa: {
    id: "wuwa",
    name: "Wuthering Waves",
    short: "WuWa",
    icon: Waves,
    pullNoun: "Convene",
    pullPlural: "Convenes",
    pullVerb: "convene",
    currency: "Astrite",
    currencyPerPull: 160,
    usdPerPull: 1.93,
    topRarity: 5,
    accent: "#34d399",
    importProvider: "none",
    uidPlaceholder: "manual only",
    uidLength: 0,
    blurb: "Manually track Resonator and Weapon Convenes and watch your pity climb.",
    banners: [
      { id: "resonator", name: "Featured Resonator Convene", short: "Resonator", softPity: 66, hardPity: 80, limited: true },
      { id: "weapon", name: "Featured Weapon Convene", short: "Weapon", softPity: 66, hardPity: 80, limited: true },
      { id: "standard", name: "Standard Convene", short: "Standard", softPity: 66, hardPity: 80, limited: false },
    ],
  },
  endfield: {
    id: "endfield",
    name: "Arknights: Endfield",
    short: "Endfield",
    icon: Hexagon,
    pullNoun: "Recruit",
    pullPlural: "Recruits",
    pullVerb: "recruit",
    currency: "Orundum",
    currencyPerPull: 600,
    usdPerPull: 1.98,
    topRarity: 5,
    accent: "#c9873f",
    importProvider: "none",
    uidPlaceholder: "manual only",
    uidLength: 0,
    blurb: "Manually track Operator and Weapon recruitment and watch your pity climb.",
    banners: [
      { id: "operator", name: "Featured Operator Recruitment", short: "Operator", softPity: 65, hardPity: 80, limited: true },
      { id: "weapon", name: "Featured Weapon Recruitment", short: "Weapon", softPity: 65, hardPity: 80, limited: true },
      { id: "standard", name: "Standard Recruitment", short: "Standard", softPity: 65, hardPity: 80, limited: false },
    ],
  },
}

export const GAME_LIST: GameDef[] = [GAMES.hsr, GAMES.genshin, GAMES.zzz, GAMES.hi3, GAMES.wuwa, GAMES.endfield]

export const GAME_IDS: GameId[] = ["hsr", "genshin", "zzz", "hi3", "wuwa", "endfield"]

export function isGameId(v: string): v is GameId {
  return (GAME_IDS as string[]).includes(v)
}

export function getGame(id: string): GameDef {
  return isGameId(id) ? GAMES[id] : GAMES.hsr
}

export function getBanner(gameId: GameId, bannerId: string): BannerDef | undefined {
  return GAMES[gameId].banners.find((b) => b.id === bannerId)
}
