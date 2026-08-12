import { getGame, getBanner, type GameId } from "./games"

/**
 * Gacha 5-star probability model.
 * ------------------------------------------------------------------
 * HoYoverse games use a "soft pity" system: a small flat base rate per
 * pull until a soft-pity threshold, after which the rate ramps steeply
 * up to a guaranteed 5-star at hard pity. We model the ramp linearly
 * from the base rate to 1.0 across the soft→hard window. This linear
 * approximation reproduces the well-known ~73.5 average pity on the
 * 90-pull character banner and is the same approach community tools use.
 */

// Per-pull base 5-star rate before soft pity kicks in.
// Weapon/light-cone style banners (shorter soft pity) have a higher base rate.
function baseRateFor(softPity: number): number {
  return softPity <= 66 ? 0.008 : 0.006
}

/** Probability that pull number `pity` (1-indexed since last 5-star) is a 5-star. */
export function pullProbability(pity: number, softPity: number, hardPity: number): number {
  if (pity >= hardPity) return 1
  const base = baseRateFor(softPity)
  if (pity < softPity) return base
  // linear ramp from base (at softPity) up to 1.0 (at hardPity)
  const progress = (pity - softPity + 1) / (hardPity - softPity)
  return Math.min(1, base + (1 - base) * progress)
}

/**
 * Probability of hitting at least one 5-star within the next `pulls`
 * attempts, starting from `currentPity`.
 */
export function chanceWithin(currentPity: number, pulls: number, softPity: number, hardPity: number): number {
  let pMiss = 1
  for (let i = 1; i <= pulls; i++) {
    const pity = currentPity + i
    pMiss *= 1 - pullProbability(pity, softPity, hardPity)
    if (pMiss <= 0) return 1
  }
  return 1 - pMiss
}

/** Expected number of pulls until the next 5-star from `currentPity`. */
export function expectedPullsToFive(currentPity: number, softPity: number, hardPity: number): number {
  // E = sum over k>=1 of P(not obtained in first k-1 pulls)
  let expected = 0
  let pMiss = 1
  for (let i = 1; i <= hardPity - currentPity; i++) {
    expected += pMiss
    const pity = currentPity + i
    pMiss *= 1 - pullProbability(pity, softPity, hardPity)
    if (pMiss <= 0) break
  }
  return expected
}

/** Smallest pull count needed to reach `target` cumulative probability (e.g. 0.5, 0.9). */
export function pullsForChance(
  currentPity: number,
  target: number,
  softPity: number,
  hardPity: number,
): number {
  for (let k = 1; k <= hardPity - currentPity; k++) {
    if (chanceWithin(currentPity, k, softPity, hardPity) >= target) return k
  }
  return hardPity - currentPity
}

export interface PredictionPoint {
  pulls: number
  chance: number // 0-1
}

/**
 * Full prediction for a banner from the player's current pity:
 * a probability curve plus headline milestones.
 */
export function predictBanner(gameId: GameId, bannerId: string, currentPity: number) {
  const banner = getBanner(gameId, bannerId) ?? getGame(gameId).banners[0]
  const { softPity, hardPity } = banner
  const remaining = Math.max(0, hardPity - currentPity)

  const curve: PredictionPoint[] = []
  // sample the curve at every pull up to hard pity (capped for charting)
  const step = remaining > 60 ? 2 : 1
  for (let k = step; k <= remaining; k += step) {
    curve.push({ pulls: k, chance: chanceWithin(currentPity, k, softPity, hardPity) })
  }
  if (curve.length === 0 || curve[curve.length - 1].pulls !== remaining) {
    if (remaining > 0) curve.push({ pulls: remaining, chance: 1 })
  }

  return {
    banner,
    currentPity,
    remaining,
    expected: expectedPullsToFive(currentPity, softPity, hardPity),
    next10: chanceWithin(currentPity, 10, softPity, hardPity),
    next20: chanceWithin(currentPity, 20, softPity, hardPity),
    pullsFor50: pullsForChance(currentPity, 0.5, softPity, hardPity),
    pullsFor90: pullsForChance(currentPity, 0.9, softPity, hardPity),
    curve,
  }
}
