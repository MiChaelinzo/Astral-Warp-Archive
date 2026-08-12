import type { UserStats } from "./types"
import type { GameId } from "./games"
import { GAME_IDS } from "./games"

/**
 * Deterministic, fictional demo trailblazers so the leaderboard looks alive
 * before real players sign up. Their emails are namespaced with "demo+" so they
 * can be filtered out and never collide with real accounts. Stats are
 * pre-aggregated (no warp records are created) and vary per game for realism.
 */
type DemoSeed = {
  name: string
  uidBase: number
  totalPulls: number
  fiveStars: number
  fourStars: number
  avgFivePity: number
  win5050Rate: number
}

const ROSTER: DemoSeed[] = [
  { name: "StelleVanguard", uidBase: 1, totalPulls: 1840, fiveStars: 31, fourStars: 214, avgFivePity: 52.1, win5050Rate: 0.71 },
  { name: "NebulaDrifter", uidBase: 2, totalPulls: 2210, fiveStars: 27, fourStars: 251, avgFivePity: 68.4, win5050Rate: 0.46 },
  { name: "AeonChaser", uidBase: 3, totalPulls: 980, fiveStars: 18, fourStars: 119, avgFivePity: 44.7, win5050Rate: 0.62 },
  { name: "CosmicGambit", uidBase: 4, totalPulls: 3120, fiveStars: 41, fourStars: 372, avgFivePity: 61.3, win5050Rate: 0.53 },
  { name: "VoidWalker77", uidBase: 5, totalPulls: 640, fiveStars: 12, fourStars: 78, avgFivePity: 38.9, win5050Rate: 0.75 },
  { name: "LumineDreams", uidBase: 6, totalPulls: 1490, fiveStars: 22, fourStars: 168, avgFivePity: 57.8, win5050Rate: 0.5 },
  { name: "QuantumLuck", uidBase: 7, totalPulls: 2760, fiveStars: 36, fourStars: 305, avgFivePity: 49.2, win5050Rate: 0.67 },
  { name: "SolarFlareX", uidBase: 8, totalPulls: 1120, fiveStars: 15, fourStars: 131, avgFivePity: 72.6, win5050Rate: 0.4 },
  { name: "EchoOfStars", uidBase: 9, totalPulls: 1980, fiveStars: 29, fourStars: 224, avgFivePity: 55.0, win5050Rate: 0.58 },
  { name: "PrismHunter", uidBase: 10, totalPulls: 870, fiveStars: 14, fourStars: 96, avgFivePity: 47.3, win5050Rate: 0.64 },
  { name: "AstralNomad", uidBase: 11, totalPulls: 2540, fiveStars: 33, fourStars: 281, avgFivePity: 63.7, win5050Rate: 0.48 },
  { name: "GildedFortune", uidBase: 12, totalPulls: 1660, fiveStars: 26, fourStars: 187, avgFivePity: 41.5, win5050Rate: 0.73 },
]

// Slightly vary stats per game so each leaderboard feels distinct.
const GAME_FACTOR: Record<GameId, number> = { hsr: 1, genshin: 0.92, zzz: 0.78, hi3: 0.55, wuwa: 0.7, endfield: 0.42 }

function uidFor(game: GameId, base: number): string {
  const prefixes: Record<GameId, string> = { hsr: "80", genshin: "61", zzz: "100", hi3: "20", wuwa: "70", endfield: "30" }
  return `${prefixes[game]}${String(base).padStart(7, "0")}`
}

function luckyScore(avgFivePity: number): number {
  const baseline = 62.5
  return avgFivePity > 0 ? Math.max(0, Math.round((baseline - avgFivePity + baseline) * 0.8)) : 0
}

export function demoStatsForGame(game: GameId): UserStats[] {
  const factor = GAME_FACTOR[game]
  return ROSTER.map((d) => {
    const totalPulls = Math.round(d.totalPulls * factor)
    const fiveStars = Math.max(1, Math.round(d.fiveStars * factor))
    const fourStars = Math.round(d.fourStars * factor)
    // nudge pity a little per game for variety
    const avgFivePity = Math.round((d.avgFivePity + (game === "zzz" ? 2.5 : game === "genshin" ? -1.5 : 0)) * 10) / 10
    return {
      email: `demo+${d.name.toLowerCase()}@astralwarp.app`,
      gameId: game,
      displayName: d.name,
      uid: uidFor(game, d.uidBase),
      totalPulls,
      fiveStars,
      fourStars,
      luckyScore: luckyScore(avgFivePity),
      avgFivePity,
      win5050Rate: d.win5050Rate,
      updatedAt: Date.now(),
    }
  })
}

export function allDemoStats(): Record<GameId, UserStats[]> {
  return Object.fromEntries(GAME_IDS.map((g) => [g, demoStatsForGame(g)])) as Record<GameId, UserStats[]>
}
