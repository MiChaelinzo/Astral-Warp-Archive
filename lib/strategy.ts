import { getGame, getBanner, type GameId } from "./games"
import { chanceWithin, expectedPullsToFive, pullsForChance } from "./probability"
import type { BannerAnalytics } from "./types"

export interface StrategyTip {
  tone: "good" | "warn" | "info"
  banner: string
  title: string
  detail: string
}

/**
 * Turn a banner's analytics into a concrete pull recommendation, grounded in
 * the soft-pity probability model. This is the "strat" surfaced after import.
 */
export function bannerStrategy(gameId: GameId, b: BannerAnalytics): StrategyTip | null {
  const def = getBanner(gameId, b.bannerType)
  if (!def) return null
  const game = getGame(gameId)
  const { softPity, hardPity } = def
  const pity = b.currentPity
  const toSoft = softPity - pity

  // How many pulls (and how much currency) to be ~90% safe from here.
  const pullsTo90 = pullsForChance(pity, 0.9, softPity, hardPity)
  const jadeTo90 = pullsTo90 * game.currencyPerPull
  const expected = Math.round(expectedPullsToFive(pity, softPity, hardPity))

  if (pity >= softPity) {
    return {
      tone: "good",
      banner: def.short,
      title: `In soft pity at ${pity} — pull now`,
      detail: `You're past the ${softPity} soft-pity threshold on ${def.name}. Your next ${pulls(game)} has a ${pct(chanceWithin(pity, 5, softPity, hardPity))} chance per 5 of hitting. A 5★ is essentially guaranteed within ${hardPity - pity} more.`,
    }
  }

  if (toSoft <= 10) {
    return {
      tone: "info",
      banner: def.short,
      title: `${toSoft} from soft pity`,
      detail: `Only ${toSoft} ${pulls(game)} to reach soft pity on ${def.name}. Save a small reserve — about ${pullsTo90} ${pulls(game)} (${jadeTo90.toLocaleString()} ${game.currency}) gives you a 90% shot from your current ${pity} pity.`,
    }
  }

  if (def.limited && b.win5050.total > 0 && b.win5050.wins / b.win5050.total < 0.4) {
    return {
      tone: "warn",
      banner: def.short,
      title: "50/50 luck running cold",
      detail: `You've won ${b.win5050.wins}/${b.win5050.total} of your 50/50s here (below the 50% average). Budget for a possible guarantee: up to ${(hardPity * 2).toLocaleString()} ${pulls(game)} to be safe on a limited unit.`,
    }
  }

  return {
    tone: "info",
    banner: def.short,
    title: `Building pity (${pity})`,
    detail: `On average you'll hit your next 5★ around pity ${expected}. From ${pity}, plan for roughly ${pullsTo90} ${pulls(game)} (${jadeTo90.toLocaleString()} ${game.currency}) for a 90% chance.`,
  }
}

function pulls(game: { pullPlural: string }) {
  return game.pullPlural.toLowerCase()
}
function pct(x: number) {
  return `${Math.round(x * 100)}%`
}

/** Build the full set of tips for a player's banners, most actionable first. */
export function buildStrategy(gameId: GameId, perBanner: BannerAnalytics[]): StrategyTip[] {
  const order = { good: 0, warn: 1, info: 2 } as const
  return perBanner
    .filter((b) => b.totalPulls > 0)
    .map((b) => bannerStrategy(gameId, b))
    .filter((t): t is StrategyTip => t !== null)
    .sort((a, b) => order[a.tone] - order[b.tone])
}
