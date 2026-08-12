import type { UserStats, Activity } from "./types"

/**
 * Achievement badges derived purely from a user's denormalized UserStats (and,
 * when viewing your own dashboard, your visit streak). Deriving from UserStats
 * means the exact same badges render on the public profile, where only stats
 * are available.
 */

// Icon keys are mapped to lucide components in the display component so this
// module stays free of React/JSX and can run anywhere.
export type AchievementIcon =
  | "rocket"
  | "layers"
  | "gem"
  | "star"
  | "clover"
  | "shield"
  | "trophy"
  | "flame"
  | "calendar"
  | "sparkles"

export interface Achievement {
  id: string
  title: string
  detail: string
  icon: AchievementIcon
  earned: boolean
  // progress 0-1 toward earning (for the locked state bar)
  progress: number
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function computeAchievements(stats: UserStats | null, activity?: Activity | null): Achievement[] {
  const totalPulls = stats?.totalPulls ?? 0
  const fiveStars = stats?.fiveStars ?? 0
  const avgPity = stats?.avgFivePity ?? 0
  const win5050 = stats?.win5050Rate ?? 0
  const luck = stats?.luckyScore ?? 0
  const streak = activity?.currentStreak ?? 0
  const longest = activity?.longestStreak ?? 0

  const list: Achievement[] = [
    {
      id: "maiden-voyage",
      title: "Maiden Voyage",
      detail: "Record your first pull.",
      icon: "rocket",
      earned: totalPulls >= 1,
      progress: clamp01(totalPulls / 1),
    },
    {
      id: "centurion",
      title: "Centurion",
      detail: "Track 100 lifetime pulls.",
      icon: "layers",
      earned: totalPulls >= 100,
      progress: clamp01(totalPulls / 100),
    },
    {
      id: "deep-pockets",
      title: "Deep Pockets",
      detail: "Track 1,000 lifetime pulls.",
      icon: "gem",
      earned: totalPulls >= 1000,
      progress: clamp01(totalPulls / 1000),
    },
    {
      id: "constellation",
      title: "Constellation",
      detail: "Pull 10 five-stars.",
      icon: "star",
      earned: fiveStars >= 10,
      progress: clamp01(fiveStars / 10),
    },
    {
      id: "fortunes-favorite",
      title: "Fortune's Favorite",
      detail: "Average under 50 pity across 3+ five-stars.",
      icon: "clover",
      earned: fiveStars >= 3 && avgPity > 0 && avgPity <= 50,
      progress: fiveStars >= 3 && avgPity > 0 ? clamp01((75 - avgPity) / 25) : 0,
    },
    {
      id: "coinflip-master",
      title: "Coinflip Master",
      detail: "Win 60%+ of your tracked 50/50s.",
      icon: "shield",
      earned: fiveStars >= 4 && win5050 >= 0.6,
      progress: clamp01(win5050 / 0.6),
    },
    {
      id: "stellar-luck",
      title: "Stellar Luck",
      detail: "Reach a luck score of 90+.",
      icon: "trophy",
      earned: luck >= 90,
      progress: clamp01(luck / 90),
    },
    {
      id: "weekly-devotee",
      title: "Weekly Devotee",
      detail: "Maintain a 7-day visit streak.",
      icon: "flame",
      earned: streak >= 7,
      progress: clamp01(streak / 7),
    },
    {
      id: "monthly-pilgrim",
      title: "Monthly Pilgrim",
      detail: "Reach a 30-day streak.",
      icon: "calendar",
      earned: longest >= 30,
      progress: clamp01(longest / 30),
    },
  ]

  // Earned first, then by closeness to earning.
  return list.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1
    return b.progress - a.progress
  })
}

export function earnedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length
}
