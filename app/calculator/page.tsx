import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getGameWarpRecords } from "@/lib/db"
import { aggregateStats } from "@/lib/warp-stats"
import { getGame } from "@/lib/games"
import { resolvePageContext } from "@/lib/page-context"
import { isPremium } from "@/lib/premium"
import { AppShell } from "@/components/app-shell"
import { PremiumGate } from "@/components/premium-gate"
import { PullCalculator } from "@/components/pull-calculator"
import { Gauge } from "lucide-react"

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { gameId } = await resolvePageContext(searchParams)
  const game = getGame(gameId)
  const supporter = !!user.isSupporter
  const locked = isPremium("calculator") && !supporter

  // Seed the calculator with the player's live pity per banner.
  const records = await getGameWarpRecords(user.email, gameId)
  const agg = aggregateStats(records)
  const initialPity: Record<string, number> = {}
  for (const b of agg.perBanner) initialPity[b.bannerType] = b.currentPity

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={supporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
            >
              <Gauge className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Calculator</h1>
              <p className="text-muted-foreground">
                Plan exactly how many {game.pullPlural.toLowerCase()} and how much {game.currency} you need
              </p>
            </div>
          </div>

          <PremiumGate isSupporter={!locked} title="The Calculator">
            <PullCalculator gameId={gameId} initialPity={initialPity} />
          </PremiumGate>
        </div>
      </div>
    </AppShell>
  )
}
