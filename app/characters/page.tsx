import { getGameWarpRecords, getGameProfile } from "@/lib/db"
import { requireGameContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { GameProfileCard } from "@/components/game-profile-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const { user, gameId, game, uid } = await requireGameContext(searchParams)
  const [records, profile] = await Promise.all([
    getGameWarpRecords(user.email, gameId),
    getGameProfile(user.email, gameId),
  ])

  // Build a 5★ "collection" from pull history: group by name, count copies (dupes = eidolons/constellations).
  const fiveStarMap = new Map<string, { name: string; copies: number; firstAt: number; lastAt: number }>()
  for (const rec of records) {
    for (const p of rec.pulls) {
      if (p.rarity !== 5) continue
      const cur = fiveStarMap.get(p.name)
      if (cur) {
        cur.copies++
        cur.firstAt = Math.min(cur.firstAt, p.pulledAt)
        cur.lastAt = Math.max(cur.lastAt, p.pulledAt)
      } else {
        fiveStarMap.set(p.name, { name: p.name, copies: 1, firstAt: p.pulledAt, lastAt: p.pulledAt })
      }
    }
  }
  const collection = Array.from(fiveStarMap.values()).sort((a, b) => b.copies - a.copies || b.lastAt - a.lastAt)
  const rankWord = gameId === "genshin" ? "C" : gameId === "zzz" ? "M" : "E"

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={!!user.isSupporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Characters</h1>
            <p className="mt-1 text-muted-foreground">
              {`Your ${game.name} showcase and every five-star you've pulled.`}
            </p>
          </div>

          <GameProfileCard gameId={gameId} profile={profile} currentUid={uid} />

          <div className="mt-6">
            <Card className="border-border/60 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <Star className="size-5 fill-primary text-primary" />
                  Five-star collection
                  <Badge variant="outline" className="ml-1 border-primary/30 text-primary">
                    {collection.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pulled five-stars grouped by name. Extra copies count as {rankWord}-ranks.
                </p>
              </CardHeader>
              <CardContent>
                {collection.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No five-stars recorded yet. Import your history to populate your collection.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {collection.map((c) => (
                      <div
                        key={c.name}
                        className="flex flex-col gap-1 rounded-xl border border-border/60 bg-secondary/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Star className="size-4 shrink-0 fill-primary text-primary" />
                          {c.copies > 1 && (
                            <span
                              className="rounded px-1.5 text-xs font-semibold"
                              style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
                            >
                              {rankWord}
                              {c.copies - 1}
                            </span>
                          )}
                        </div>
                        <p className="truncate font-heading text-sm font-semibold" title={c.name}>
                          {c.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.copies} {c.copies === 1 ? "copy" : "copies"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
