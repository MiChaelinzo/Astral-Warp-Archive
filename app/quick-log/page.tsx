import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getGameWarpRecords } from "@/lib/db"
import { aggregateStats } from "@/lib/warp-stats"
import { getGame } from "@/lib/games"
import { resolvePageContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { QuickLog } from "@/components/quick-log"
import { Card, CardContent } from "@/components/ui/card"
import { Zap } from "lucide-react"

export default async function QuickLogPage({
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
  const bannerPity = agg.perBanner.map((b) => ({ bannerType: b.bannerType, currentPity: b.currentPity }))

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={!!user.isSupporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
            >
              <Zap className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">Quick Log</h1>
              <p className="text-sm text-muted-foreground">Tap to record a {game.pullNoun.toLowerCase()} on the go</p>
            </div>
          </div>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardContent className="py-6">
              <QuickLog gameId={gameId} bannerPity={bannerPity} />
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground text-pretty">
            Add this app to your home screen for one-tap logging. Your pity updates instantly across the dashboard and
            leaderboard.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
