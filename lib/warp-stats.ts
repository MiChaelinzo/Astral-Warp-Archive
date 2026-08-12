import type { WarpRecord, BannerAnalytics, UserStats } from "./types"
import type { GameId } from "./games"

// pulls[] is ordered newest-first (index 0 = most recent)
export function computeBannerAnalytics(rec: WarpRecord): BannerAnalytics {
  const pulls = rec.pulls
  const total = pulls.length
  let fiveStars = 0
  let fourStars = 0
  let threeStars = 0

  for (const p of pulls) {
    if (p.rarity === 5) fiveStars++
    else if (p.rarity === 4) fourStars++
    else threeStars++
  }

  // current pity = pulls since the most recent 5-star (count from front)
  let currentPity = 0
  for (const p of pulls) {
    if (p.rarity === 5) break
    currentPity++
  }
  let fourStarPity = 0
  for (const p of pulls) {
    if (p.rarity >= 4) break
    fourStarPity++
  }

  // 5-star history with the pity at which each was obtained.
  const fiveStarHistory: BannerAnalytics["fiveStarHistory"] = []
  let counter = 0
  let wins = 0
  let win5050Total = 0
  for (let i = pulls.length - 1; i >= 0; i--) {
    const p = pulls[i]
    counter++
    if (p.rarity === 5) {
      fiveStarHistory.push({ name: p.name, pity: counter, won5050: p.won5050, pulledAt: p.pulledAt })
      if (p.won5050 !== undefined) {
        win5050Total++
        if (p.won5050) wins++
      }
      counter = 0
    }
  }
  fiveStarHistory.reverse() // newest first

  const pitySum = fiveStarHistory.reduce((s, h) => s + h.pity, 0)
  const avgFivePity = fiveStarHistory.length ? pitySum / fiveStarHistory.length : 0

  return {
    gameId: rec.gameId,
    bannerType: rec.bannerType,
    totalPulls: total,
    fiveStars,
    fourStars,
    threeStars,
    currentPity,
    fourStarPity,
    avgFivePity,
    fiveStarHistory,
    win5050: { wins, total: win5050Total },
  }
}

export function aggregateStats(records: WarpRecord[]): {
  totalPulls: number
  fiveStars: number
  fourStars: number
  avgFivePity: number
  win5050Rate: number
  perBanner: BannerAnalytics[]
} {
  const perBanner = records.map(computeBannerAnalytics)
  const totalPulls = perBanner.reduce((s, b) => s + b.totalPulls, 0)
  const fiveStars = perBanner.reduce((s, b) => s + b.fiveStars, 0)
  const fourStars = perBanner.reduce((s, b) => s + b.fourStars, 0)

  const allPity = perBanner.flatMap((b) => b.fiveStarHistory.map((h) => h.pity))
  const avgFivePity = allPity.length ? allPity.reduce((a, b) => a + b, 0) / allPity.length : 0

  const wins = perBanner.reduce((s, b) => s + b.win5050.wins, 0)
  const totalRoll = perBanner.reduce((s, b) => s + b.win5050.total, 0)
  const win5050Rate = totalRoll ? wins / totalRoll : 0

  return { totalPulls, fiveStars, fourStars, avgFivePity, win5050Rate, perBanner }
}

// luckyScore: higher = luckier. Based on how far below the soft-pity average each 5-star landed.
export function buildUserStats(
  email: string,
  gameId: GameId,
  displayName: string,
  uid: string,
  records: WarpRecord[],
): UserStats {
  const agg = aggregateStats(records)
  const baseline = 62.5
  const luckyScore =
    agg.avgFivePity > 0 ? Math.max(0, Math.round((baseline - agg.avgFivePity + baseline) * 0.8)) : 0
  return {
    email: email.toLowerCase(),
    gameId,
    displayName,
    uid,
    totalPulls: agg.totalPulls,
    fiveStars: agg.fiveStars,
    fourStars: agg.fourStars,
    luckyScore,
    avgFivePity: Math.round(agg.avgFivePity * 10) / 10,
    win5050Rate: agg.win5050Rate,
    updatedAt: Date.now(),
  }
}
