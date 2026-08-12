import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGame, type GameId } from "@/lib/games"
import type { BannerAnalytics } from "@/lib/types"
import { Coins, DollarSign, Gem, Receipt } from "lucide-react"

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

export function SpendingAnalytics({ gameId, perBanner }: { gameId: GameId; perBanner: BannerAnalytics[] }) {
  const game = getGame(gameId)
  const totalPulls = perBanner.reduce((s, b) => s + b.totalPulls, 0)
  const totalFives = perBanner.reduce((s, b) => s + b.fiveStars, 0)
  const currencySpent = totalPulls * game.currencyPerPull
  const usdValue = totalPulls * game.usdPerPull
  const costPerFive = totalFives > 0 ? usdValue / totalFives : 0
  const accent = game.accent

  const headline = [
    {
      icon: Coins,
      label: `${game.currency} spent`,
      value: fmtNum(currencySpent),
      tint: "text-foreground",
    },
    {
      icon: DollarSign,
      label: "Est. value",
      value: fmtUsd(usdValue),
      tint: "text-primary",
    },
    {
      icon: Receipt,
      label: "Cost per 5★",
      value: totalFives ? fmtUsd(costPerFive) : "—",
      tint: "text-accent",
    },
    {
      icon: Gem,
      label: `${game.pullPlural} / 5★`,
      value: totalFives ? (totalPulls / totalFives).toFixed(1) : "—",
      tint: "text-chart-2",
    },
  ]

  // per-banner breakdown bar widths
  const maxBannerUsd = Math.max(1, ...perBanner.map((b) => b.totalPulls * game.usdPerPull))

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}26`, color: accent }}
          >
            <Coins className="size-4" />
          </span>
          <div>
            <CardTitle className="font-heading text-base">Spending & Value</CardTitle>
            <p className="text-xs text-muted-foreground">Estimated investment across all banners</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {headline.map((h) => (
            <div key={h.label} className="rounded-lg border border-border/60 bg-secondary/40 p-3">
              <h.icon className="size-4 text-muted-foreground" />
              <p className={`mt-2 font-heading text-xl font-bold ${h.tint}`}>{h.value}</p>
              <p className="text-xs text-muted-foreground">{h.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Value by banner</p>
          {perBanner
            .slice()
            .sort((a, b) => b.totalPulls - a.totalPulls)
            .map((b) => {
              const banner = game.banners.find((x) => x.id === b.bannerType)
              const usd = b.totalPulls * game.usdPerPull
              const pct = (usd / maxBannerUsd) * 100
              return (
                <div key={b.bannerType}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{banner?.name ?? b.bannerType}</span>
                    <span className="font-mono text-muted-foreground">
                      {fmtUsd(usd)} · {b.totalPulls} {game.pullPlural.toLowerCase()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
                  </div>
                </div>
              )
            })}
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Estimates use the most efficient top-up bundle ({fmtUsd(game.usdPerPull)}/{game.pullNoun.toLowerCase()}).
          Actual spend varies with free {game.currency.toLowerCase()}, events, and your region&apos;s pricing.
        </p>
      </CardContent>
    </Card>
  )
}
