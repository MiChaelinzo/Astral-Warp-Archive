// Central config for the honor-system Supporter unlock.

export const PAYPAL_URL = "https://www.paypal.com/paypalme/michaelinzo77"

// Routes that require Supporter status.
export const PREMIUM_ROUTES = ["/calculator", "/forecast", "/todo", "/timeline"] as const

// Returns true if a feature/route slug is Supporter-only. Accepts either a
// bare slug ("timeline") or a path ("/timeline").
export function isPremium(slug: string): boolean {
  const path = slug.startsWith("/") ? slug : `/${slug}`
  return (PREMIUM_ROUTES as readonly string[]).includes(path)
}

export interface PremiumFeature {
  title: string
  detail: string
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  { title: "Pull Calculator", detail: "Plan exactly how many pulls and how much currency you need to hit any banner with 90% confidence." },
  { title: "Banner Forecasting", detail: "Project your odds week by week from your live pity and planned pull income — with exact 50/50 and guarantee modeling." },
  { title: "Todo List", detail: "Track dailies, weeklies, and farming goals across every supported game in one place." },
  { title: "Timeline", detail: "A full chronological history of every 5★, with pity and 50/50 outcomes visualized." },
  { title: "UIGF / Excel export", detail: "Export your entire history to UIGF v4.0 or CSV for backups and cross-tool sync." },
  { title: "Priority everything", detail: "Support a solo dev and keep the archive ad-free and independent." },
]

export const SUPPORTER_PERK_BLURB =
  "Supporter unlocks the Calculator, Forecast, Todo List, Timeline, and full data export — and keeps Astral Warp Archive running."
