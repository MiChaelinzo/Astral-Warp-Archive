import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { BannerAnalytics } from "@/lib/types"
import { getGame, type GameId } from "@/lib/games"
import { cn } from "@/lib/utils"
import { Star, Sparkle } from "lucide-react"

export function BannerCard({ analytics }: { analytics: BannerAnalytics }) {
  const game = getGame(analytics.gameId as GameId)
  const banner = game.banners.find((b) => b.id === analytics.bannerType) ?? game.banners[0]
  const { currentPity, fourStarPity, fiveStars, fourStars, totalPulls, avgFivePity, win5050, fiveStarHistory } =
    analytics

  const softPity = banner.softPity
  const hardPity = banner.hardPity
  const pityPct = Math.min(100, (currentPity / hardPity) * 100)
  const nearSoft = currentPity >= softPity - 8 && currentPity < hardPity
  const winRate = win5050.total ? Math.round((win5050.wins / win5050.total) * 100) : null

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div>
          <h3 className="font-heading text-base font-semibold">{banner.name}</h3>
          <p className="text-sm text-muted-foreground">{totalPulls} warps logged</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          {banner.limited ? "Limited" : "Standard"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* 5-star pity */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <Star className="size-3.5 fill-primary" />5★ pity
            </span>
            <span className={cn("font-mono", nearSoft ? "text-primary" : "text-muted-foreground")}>
              {currentPity} / {hardPity}
            </span>
          </div>
          <Progress value={pityPct} className="h-2" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {currentPity >= softPity ? (
              <span className="text-primary">In soft pity — five-star incoming.</span>
            ) : (
              <>Soft pity at {softPity} · {Math.max(0, softPity - currentPity)} warps to go</>
            )}
          </p>
        </div>

        {/* 4-star pity */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium text-chart-2">
              <Sparkle className="size-3.5 fill-chart-2" />4★ pity
            </span>
            <span className="font-mono text-muted-foreground">{fourStarPity} / 10</span>
          </div>
          <Progress value={Math.min(100, (fourStarPity / 10) * 100)} className="h-2 [&>div]:bg-chart-2" />
        </div>

        {/* mini stats */}
        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
          <Mini label="5★" value={fiveStars} className="text-primary" />
          <Mini label="4★" value={fourStars} className="text-chart-2" />
          <Mini label="Avg 5★ pity" value={avgFivePity ? avgFivePity.toFixed(0) : "—"} />
        </div>

        {winRate !== null && (
          <div className="rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">50/50 win rate: </span>
            <span className="font-medium text-foreground">
              {winRate}% ({win5050.wins}/{win5050.total})
            </span>
          </div>
        )}

        {/* recent 5-stars */}
        {fiveStarHistory.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent five-stars</p>
            <ul className="flex flex-col gap-1">
              {fiveStarHistory.slice(0, 4).map((h, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <Star className="size-3 fill-primary text-primary" />
                    {h.name}
                    {h.won5050 === false && (
                      <span className="text-xs text-destructive">(lost 50/50)</span>
                    )}
                  </span>
                  <span className="font-mono text-muted-foreground">pity {h.pity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Mini({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div>
      <p className={cn("font-heading text-lg font-bold", className)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
