"use client"

import { useMemo } from "react"
import { getGame, type GameId } from "@/lib/games"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineEntry {
  id: string
  name: string
  rarity: 3 | 4 | 5
  pulledAt: number
  fiftyFifty?: "win" | "loss"
  banner: string
  pityAt: number
}

export function WarpTimeline({ gameId, entries }: { gameId: GameId; entries: TimelineEntry[] }) {
  const game = getGame(gameId)

  const months = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>()
    for (const e of entries) {
      const d = new Date(e.pulledAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [entries])

  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No five-star pulls yet — your timeline will fill in as you track {game.pullPlural.toLowerCase()}.
      </p>
    )
  }

  return (
    <div className="relative pl-6">
      {/* vertical line */}
      <div className="absolute bottom-2 left-2 top-2 w-px bg-border" aria-hidden />

      <div className="flex flex-col gap-8">
        {months.map(([key, monthEntries]) => {
          const label = new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })
          return (
            <div key={key}>
              <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
                <span className="ml-2 text-xs font-normal normal-case text-muted-foreground/70">
                  {monthEntries.length} five-star{monthEntries.length === 1 ? "" : "s"}
                </span>
              </h3>
              <div className="flex flex-col gap-3">
                {monthEntries.map((e) => {
                  const bannerDef = game.banners.find((b) => b.id === e.banner)
                  const lucky = e.pityAt <= 40
                  return (
                    <div key={e.id} className="relative flex items-center gap-3">
                      <span
                        className="absolute -left-[18px] flex size-3.5 items-center justify-center rounded-full ring-4 ring-background"
                        style={{ backgroundColor: game.accent }}
                        aria-hidden
                      />
                      <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Star className="size-4 shrink-0" style={{ color: game.accent }} fill={game.accent} />
                          <span className="font-medium">{e.name}</span>
                          {e.fiftyFifty && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                e.fiftyFifty === "win"
                                  ? "bg-chart-2/20 text-chart-2"
                                  : "bg-destructive/20 text-destructive",
                              )}
                            >
                              {e.fiftyFifty === "win" ? "Won 50/50" : "Lost 50/50"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {bannerDef && <span className="hidden sm:inline">{bannerDef.name}</span>}
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-mono font-semibold",
                              lucky ? "bg-chart-2/15 text-chart-2" : "bg-secondary text-foreground",
                            )}
                          >
                            {e.pityAt} pity
                          </span>
                          <span className="hidden md:inline">
                            {new Date(e.pulledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
