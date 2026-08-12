"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { getGame, type GameId } from "@/lib/games"
import { predictBanner } from "@/lib/probability"
import { Sparkles, Target, TrendingUp, Dice5 } from "lucide-react"

interface BannerPity {
  bannerType: string
  currentPity: number
}

export function PityPredictor({ gameId, banners }: { gameId: GameId; banners: BannerPity[] }) {
  const game = getGame(gameId)
  // only banners with a known pity model and that the user has data for
  const options = banners.length
    ? banners
    : game.banners.slice(0, 1).map((b) => ({ bannerType: b.id, currentPity: 0 }))

  const [selected, setSelected] = useState(options[0]?.bannerType ?? game.banners[0].id)
  const current = options.find((o) => o.bannerType === selected) ?? options[0]

  const prediction = useMemo(
    () => predictBanner(gameId, selected, current?.currentPity ?? 0),
    [gameId, selected, current?.currentPity],
  )

  const chartData = prediction.curve.map((p) => ({
    pulls: p.pulls,
    chance: Math.round(p.chance * 1000) / 10,
  }))

  const accent = game.accent
  const noun = game.pullNoun.toLowerCase()

  const milestones = [
    {
      icon: Dice5,
      label: `Next 10 ${game.pullPlural.toLowerCase()}`,
      value: `${Math.round(prediction.next10 * 100)}%`,
      hint: "chance of a 5★",
    },
    {
      icon: Target,
      label: "Coin-flip odds",
      value: `${prediction.pullsFor50} ${noun}s`,
      hint: "for a 50% chance",
    },
    {
      icon: TrendingUp,
      label: "Near-certain",
      value: `${prediction.pullsFor90} ${noun}s`,
      hint: "for a 90% chance",
    },
    {
      icon: Sparkles,
      label: "Expected pity",
      value: `${Math.round(prediction.expected)} ${noun}s`,
      hint: "average until 5★",
    },
  ]

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}26`, color: accent }}
          >
            <Sparkles className="size-4" />
          </span>
          <div>
            <CardTitle className="font-heading text-base">Pull Predictor</CardTitle>
            <p className="text-xs text-muted-foreground">
              Odds of your next 5★ from pity {prediction.currentPity}
            </p>
          </div>
        </div>
        <Select value={selected} onValueChange={(v) => setSelected(v ?? options[0].bannerType)}>
          <SelectTrigger className="w-auto min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {game.banners.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {milestones.map((m) => (
            <div key={m.label} className="rounded-lg border border-border/60 bg-secondary/40 p-3">
              <m.icon className="size-4 text-muted-foreground" />
              <p className="mt-2 font-heading text-xl font-bold" style={{ color: accent }}>
                {m.value}
              </p>
              <p className="text-xs font-medium text-foreground">{m.label}</p>
              <p className="text-[11px] text-muted-foreground">{m.hint}</p>
            </div>
          ))}
        </div>

        {prediction.remaining > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cumulative 5★ probability over the next {prediction.remaining} {game.pullPlural.toLowerCase()}
            </p>
            <ChartContainer
              config={{ chance: { label: "5★ chance", color: accent } }}
              className="aspect-[16/7] w-full"
            >
              <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="fillChance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chance)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-chance)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="pulls"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => `+${v}`}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={34}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  className="text-xs"
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { pulls: number; chance: number }
                    return (
                      <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-sm shadow-md">
                        <p className="font-medium">
                          In {d.pulls} {game.pullPlural.toLowerCase()}
                        </p>
                        <p style={{ color: accent }}>{d.chance}% chance of a 5★</p>
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="2 4" strokeOpacity={0.5} />
                <Area
                  dataKey="chance"
                  type="monotone"
                  stroke="var(--color-chance)"
                  strokeWidth={2}
                  fill="url(#fillChance)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <p className="rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            You&apos;re at hard pity — your next {noun} is a guaranteed 5★.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
