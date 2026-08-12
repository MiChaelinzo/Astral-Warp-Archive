import { getGameWarpRecords } from "@/lib/db"
import { requireGameContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { PullDatabase, type DbRow } from "@/components/pull-database"
import { Card, CardContent } from "@/components/ui/card"
import { Database as DatabaseIcon } from "lucide-react"

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const { user, gameId, game } = await requireGameContext(searchParams)
  const records = await getGameWarpRecords(user.email, gameId)

  // Build flat rows with per-5★ pity. pulls[] are newest-first; walk oldest-first to count pity.
  const rows: DbRow[] = []
  for (const rec of records) {
    const banner = game.banners.find((b) => b.id === rec.bannerType) ?? game.banners[0]
    let counter = 0
    const ordered = rec.pulls.slice().reverse() // oldest-first
    const withPity = ordered.map((p) => {
      counter++
      const pity = p.rarity === 5 ? counter : undefined
      if (p.rarity === 5) counter = 0
      return { p, pity }
    })
    for (const { p, pity } of withPity.reverse()) {
      rows.push({
        id: p.id,
        name: p.name,
        rarity: p.rarity,
        banner: rec.bannerType,
        bannerLabel: banner.name,
        pity,
        pulledAt: p.pulledAt,
      })
    }
  }
  rows.sort((a, b) => b.pulledAt - a.pulledAt)

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={!!user.isSupporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-foreground">
              <DatabaseIcon className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Database</h1>
              <p className="text-muted-foreground">
                {`Every ${game.pullNoun.toLowerCase()} you've recorded, searchable and filterable.`}
              </p>
            </div>
          </div>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardContent className="py-6">
              {rows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No {game.pullPlural.toLowerCase()} recorded yet. Import your history from Settings to fill your
                  database.
                </p>
              ) : (
                <PullDatabase gameId={gameId} rows={rows} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
