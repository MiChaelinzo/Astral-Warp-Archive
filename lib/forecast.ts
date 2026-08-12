import { getGame, getBanner, type GameId } from "./games"
import { pullProbability, chanceWithin } from "./probability"

/**
 * Forecasting model — layers a planned pull income over the existing soft-pity
 * probability engine (lib/probability.ts) to answer "by when can I realistically
 * land this unit?" rather than just "what are my odds right now?".
 *
 * For limited banners we model the 50/50 → guarantee mechanic exactly with a
 * small forward DP over (pity, guaranteed) state, so the "featured unit" curve
 * accounts for the fact that a loss converts your next 5★ into a guarantee.
 */

/**
 * Probability of obtaining the FEATURED (rate-up) 5★ at least once within
 * `pulls` attempts, starting from `currentPity` and an optional active
 * guarantee. Exact for the standard 50/50 + guarantee system.
 */
export function featuredChanceWithin(
  currentPity: number,
  guaranteed: boolean,
  pulls: number,
  softPity: number,
  hardPity: number,
): number {
  if (pulls <= 0) return 0
  // Probability mass over live states keyed by `${pity}:${guaranteed}`.
  let live = new Map<string, number>()
  live.set(`${currentPity}:${guaranteed ? 1 : 0}`, 1)
  let obtained = 0

  for (let i = 0; i < pulls; i++) {
    const next = new Map<string, number>()
    for (const [key, mass] of live) {
      if (mass <= 0) continue
      const [pityStr, gStr] = key.split(":")
      const pity = Number(pityStr)
      const g = gStr === "1"
      const p = pullProbability(pity + 1, softPity, hardPity)

      // Miss: pity advances, guarantee unchanged.
      add(next, `${pity + 1}:${g ? 1 : 0}`, mass * (1 - p))

      // Hit a 5★.
      if (g) {
        // Guaranteed → it's the featured unit.
        obtained += mass * p
      } else {
        // 50/50: half featured (obtained), half off-banner (now guaranteed at pity 0).
        obtained += mass * p * 0.5
        add(next, `0:1`, mass * p * 0.5)
      }
    }
    live = next
  }
  return Math.min(1, obtained)
}

function add(map: Map<string, number>, key: string, value: number) {
  if (value <= 0) return
  map.set(key, (map.get(key) ?? 0) + value)
}

export interface ForecastPoint {
  week: number
  pullsAvailable: number
  anyFive: number // 0-1 chance of >=1 five-star
  featured: number // 0-1 chance of the rate-up unit (limited banners)
}

export interface ForecastInput {
  gameId: GameId
  bannerId: string
  currentPity: number
  guaranteed: boolean
  savedPulls: number
  pullsPerWeek: number
  weeks: number
}

export interface ForecastResult {
  banner: ReturnType<typeof getBanner>
  limited: boolean
  points: ForecastPoint[]
  // first week index where featured (or anyFive for non-limited) crosses each target
  weekFor50: number | null
  weekFor90: number | null
  finalChance: number
  finalPulls: number
}

/**
 * Builds a week-by-week forecast: how many pulls you'll have banked by each
 * week (saved + income) and the resulting cumulative odds.
 */
export function forecastOverTime(input: ForecastInput): ForecastResult {
  const { gameId, bannerId, currentPity, guaranteed, savedPulls, pullsPerWeek, weeks } = input
  const banner = getBanner(gameId, bannerId) ?? getGame(gameId).banners[0]
  const { softPity, hardPity, limited } = banner

  const points: ForecastPoint[] = []
  let weekFor50: number | null = null
  let weekFor90: number | null = null

  for (let w = 0; w <= weeks; w++) {
    const pullsAvailable = Math.max(0, Math.round(savedPulls + pullsPerWeek * w))
    const anyFive = chanceWithin(currentPity, pullsAvailable, softPity, hardPity)
    const featured = limited
      ? featuredChanceWithin(currentPity, guaranteed, pullsAvailable, softPity, hardPity)
      : anyFive
    if (weekFor50 === null && featured >= 0.5) weekFor50 = w
    if (weekFor90 === null && featured >= 0.9) weekFor90 = w
    points.push({ week: w, pullsAvailable, anyFive, featured })
  }

  const last = points[points.length - 1]
  return {
    banner,
    limited,
    points,
    weekFor50,
    weekFor90,
    finalChance: last.featured,
    finalPulls: last.pullsAvailable,
  }
}
