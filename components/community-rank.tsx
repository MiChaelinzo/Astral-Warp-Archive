import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Percentiles } from "@/lib/db"
import { getGame, type GameId } from "@/lib/games"
import { Users, Award } from "lucide-react"

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function CommunityRank({ gameId, percentiles }: { gameId: GameId; percentiles: Percentiles }) {
  const game = getGame(gameId)
  const accent = game.accent
  const { luck, pulls, fiveStars, totalPlayers, rankLuck } = percentiles

  const bars = [
    { label: "Luck score", value: luck, hint: `luckier than ${luck}% of players` },
    { label: `${game.pullPlural} logged`, value: pulls, hint: `more than ${pulls}% of players` },
    { label: "Five-stars", value: fiveStars, hint: `more than ${fiveStars}% of players` },
  ]

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent}26`, color: accent }}
            >
              <Users className="size-4" />
            </span>
            <div>
              <CardTitle className="font-heading text-base">Community Standing</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ranked against {totalPlayers.toLocaleString()} {game.name} players
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1">
            <Award className="size-3.5" style={{ color: accent }} />
            <span className="font-mono text-sm font-semibold">#{rankLuck}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-center">
          <p className="font-heading text-3xl font-bold" style={{ color: accent }}>
            {ordinal(Math.max(1, 100 - luck))} percentile
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re luckier than <span className="font-medium text-foreground">{luck}%</span> of tracked players
          </p>
        </div>

        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-foreground">{b.label}</span>
              <span className="font-mono text-muted-foreground">{b.hint}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, b.value)}%`, backgroundColor: accent }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
