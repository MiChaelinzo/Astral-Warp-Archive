import { getGameWarpRecords, getPercentiles, getUserStats, recordDailyVisit } from "@/lib/db"
import { aggregateStats } from "@/lib/warp-stats"
import { buildStrategy } from "@/lib/strategy"
import { computeAchievements } from "@/lib/achievements"
import { requireGameContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { AddPullDialog } from "@/components/add-pull-dialog"
import { StrategyPanel } from "@/components/strategy-panel"
import { SpendingAnalytics } from "@/components/spending-analytics"
import { CommunityRank } from "@/components/community-rank"
import { StreakAchievements } from "@/components/streak-achievements"
import { ShareProfileButton } from "@/components/share-profile-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Star, Sparkles, TrendingDown, Layers, ArrowRight } from "lucide-react"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const { user, gameId, game, uid } = await requireGameContext(searchParams)

  const records = await getGameWarpRecords(user.email, gameId)
  const agg = aggregateStats(records)
  const hasData = agg.totalPulls > 0
  const tips = buildStrategy(gameId, agg.perBanner)
  const [percentiles, activity, stats] = await Promise.all([
    hasData ? getPercentiles(user.email, gameId).catch(() => null) : Promise.resolve(null),
    recordDailyVisit(user.email).catch(() => null),
    getUserStats(user.email, gameId).catch(() => null),
  ])
  const achievements = computeAchievements(stats, activity)

  const summary = [
    { icon: Layers, label: `Total ${game.pullPlural.toLowerCase()}`, value: agg.totalPulls.toLocaleString(), tint: "text-foreground" },
    { icon: Star, label: "Five-stars", value: agg.fiveStars, tint: "text-primary" },
    { icon: Sparkles, label: "Four-stars", value: agg.fourStars, tint: "text-chart-2" },
    { icon: TrendingDown, label: "Avg 5★ pity", value: agg.avgFivePity ? agg.avgFivePity.toFixed(1) : "—", tint: "text-accent" },
  ]

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={!!user.isSupporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl text-balance">
                Welcome back, {user.displayName}
              </h1>
              <p className="mt-1 text-muted-foreground">{game.blurb}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasData && uid && <ShareProfileButton gameId={gameId} uid={uid} />}
              <AddPullDialog gameId={gameId} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summary.map((s) => (
              <Card key={s.label} className="border-border/60 bg-card/70 backdrop-blur">
                <CardContent className="flex items-center gap-3 py-5">
                  <span className={`flex size-10 items-center justify-center rounded-lg bg-secondary ${s.tint}`}>
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <p className={`font-heading text-2xl font-bold ${s.tint}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <StreakAchievements achievements={achievements} activity={activity} accent={game.accent} />
          </div>

          {hasData ? (
            <div className="mt-6 flex flex-col gap-6">
              <StrategyPanel tips={tips} />

              <div className="grid gap-6 lg:grid-cols-2">
                <SpendingAnalytics gameId={gameId} perBanner={agg.perBanner} />
                {percentiles ? (
                  <CommunityRank gameId={gameId} percentiles={percentiles} />
                ) : (
                  <Card className="border-border/60 bg-card/70 backdrop-blur">
                    <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                      <Sparkles className="size-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Your community ranking will appear here once your stats sync to the leaderboard.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
                  <div>
                    <p className="font-heading text-base font-semibold">Dig into your pity</p>
                    <p className="text-sm text-muted-foreground">
                      See per-banner pity, 50/50 history, and your full pull database.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button render={<Link href={`/counter?game=${gameId}`} />} nativeButton={false} variant="secondary" size="sm">
                      {game.pullNoun} Counter <ArrowRight className="size-4" />
                    </Button>
                    <Button render={<Link href={`/forecast?game=${gameId}`} />} nativeButton={false} variant="secondary" size="sm">
                      Forecast <ArrowRight className="size-4" />
                    </Button>
                    <Button render={<Link href={`/database?game=${gameId}`} />} nativeButton={false} variant="secondary" size="sm">
                      Database <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="mt-8 border-dashed border-border/60 bg-card/40">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Star className="size-6" />
                </span>
                <h2 className="font-heading text-lg font-semibold">No {game.pullPlural.toLowerCase()} recorded yet</h2>
                <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                  Record your first {game.pullNoun.toLowerCase()} or import your history from Settings to start tracking
                  pity, 50/50 history, and your global luck score for {game.name}.
                </p>
                <div className="mt-2 flex gap-2">
                  <AddPullDialog gameId={gameId} />
                  <Button render={<Link href={`/settings?game=${gameId}`} />} nativeButton={false} variant="secondary">
                    Import history
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
