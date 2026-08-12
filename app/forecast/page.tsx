import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getGameWarpRecords } from "@/lib/db"
import { aggregateStats } from "@/lib/warp-stats"
import { getGame } from "@/lib/games"
import { resolvePageContext } from "@/lib/page-context"
import { isPremium } from "@/lib/premium"
import { AppShell } from "@/components/app-shell"
import { PremiumGate } from "@/components/premium-gate"
import { BannerForecast } from "@/components/banner-forecast"
import { CalendarClock } from "lucide-react"

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { gameId } = await resolvePageContext(searchParams)
  const game = getGame(gameId)
  const supporter = !!user.isSupporter
  const locked = isPremium("forecast") && !supporter

  const records = await getGameWarpRecords(user.email, gameId)
  const agg = aggregateStats(records)
  const banners = agg.perBanner.length
    ? agg.perBanner.map((b) => ({ bannerType: b.bannerType, currentPity: b.currentPity }))
    : game.banners.map((b) => ({ bannerType: b.id, currentPity: 0 }))

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={supporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
            >
              <CalendarClock className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Forecast</h1>
              <p className="text-muted-foreground">
                Project your odds over the coming weeks from your live pity and planned {game.pullPlural.toLowerCase()}{" "}
                income
              </p>
            </div>
          </div>

          <PremiumGate isSupporter={!locked} title="Banner Forecasting">
            <BannerForecast gameId={gameId} banners={banners} />
          </PremiumGate>
        </div>
      </div>
    </AppShell>
  )
}
