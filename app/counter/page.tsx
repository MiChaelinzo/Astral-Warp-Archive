import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getGameWarpRecords } from "@/lib/db"
import { aggregateStats } from "@/lib/warp-stats"
import { getGame } from "@/lib/games"
import { resolvePageContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { BannerCard } from "@/components/banner-card"
import { PityPredictor } from "@/components/pity-predictor"
import { AddPullDialog } from "@/components/add-pull-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export default async function WishCounterPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { gameId } = await resolvePageContext(searchParams)
  const game = getGame(gameId)
  const records = await getGameWarpRecords(user.email, gameId)
  const agg = aggregateStats(records)
  const hasData = agg.totalPulls > 0
  const bannerPity = agg.perBanner.map((b) => ({ bannerType: b.bannerType, currentPity: b.currentPity }))

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={!!user.isSupporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
              >
                <Sparkles className="size-6" />
              </span>
              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                  {game.pullNoun} Counter
                </h1>
                <p className="text-muted-foreground">Live pity tracking for every {game.name} banner</p>
              </div>
            </div>
            <AddPullDialog gameId={gameId} />
          </div>

          {hasData ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                {agg.perBanner.map((b) => (
                  <BannerCard key={b.bannerType} analytics={b} />
                ))}
              </div>
              <PityPredictor gameId={gameId} banners={bannerPity} />
            </div>
          ) : (
            <Card className="border-border/60 bg-card/70 backdrop-blur">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Sparkles className="size-8 text-muted-foreground" />
                <p className="text-balance text-muted-foreground">
                  No {game.pullPlural.toLowerCase()} tracked yet. Import your history or add a pull to see live pity
                  counters.
                </p>
                <AddPullDialog gameId={gameId} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
