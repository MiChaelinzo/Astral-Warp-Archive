"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import { getGame, type GameId } from "@/lib/games"
import { forecastOverTime } from "@/lib/forecast"
import { CalendarClock, Target, TrendingUp, Coins, Sparkles, ShieldCheck } from "lucide-react"

interface BannerPity {
  bannerType: string
  currentPity: number
}

export function BannerForecast({
  gameId,
  banners,
  savedCurrency = 0,
}: {
  gameId: GameId
  banners: BannerPity[]
  savedCurrency?: number
}) {
  const game = getGame(gameId)
  const accent = game.accent

  const pityFor = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of banners) map[b.bannerType] = b.currentPity
    return map
  }, [banners])

  const [bannerId, setBannerId] = useState(banners[0]?.bannerType ?? game.banners[0].id)
  const currentPity = pityFor[bannerId] ?? 0

  // Income plan, all expressed in pulls.
  const [savedPulls, setSavedPulls] = useState(Math.floor(savedCurrency / game.currencyPerPull))
  const [pullsPerWeek, setPullsPerWeek] = useState(14)
  const [weeks, setWeeks] = useState(12)
  const [guaranteed, setGuaranteed] = useState(false)

  const result = useMemo(
    () =>
      forecastOverTime({
        gameId,
        bannerId,
        currentPity,
        guaranteed,
        savedPulls,
        pullsPerWeek,
        weeks,
      }),
    [gameId, bannerId, currentPity, guaranteed, savedPulls, pullsPerWeek, weeks],
  )

  const chartData = result.points.map((p) => ({
    week: p.week,
    featured: Math.round(p.featured * 1000) / 10,
    pulls: p.pullsAvailable,
  }))

  const noun = game.pullPlural.toLowerCase()
  const targetLabel = result.limited ? "featured unit" : "5★"

  const metrics = [
    {
      icon: CalendarClock,
      label: `Coin-flip ${targetLabel}`,
      value: result.weekFor50 === null ? `>${weeks}w` : weekLabel(result.weekFor50),
      hint: "to reach 50%",
    },
    {
      icon: Target,
      label: `Safe ${targetLabel}`,
      value: result.weekFor90 === null ? `>${weeks}w` : weekLabel(result.weekFor90),
      hint: "to reach 90%",
    },
    {
      icon: TrendingUp,
      label: `Odds in ${weeks}w`,
      value: `${Math.round(result.finalChance * 100)}%`,
      hint: `with ${result.finalPulls.toLocaleString()} ${noun}`,
    },
    {
      icon: Coins,
      label: `Banked by week ${weeks}`,
      value: result.finalPulls.toLocaleString(),
      hint: `${(result.finalPulls * game.currencyPerPull).toLocaleString()} ${game.currency}`,
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" style={{ color: accent }} />
            Your pull plan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Banner</Label>
            <Select value={bannerId} onValueChange={(v) => v && setBannerId(v)}>
              <SelectTrigger>
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
            <p className="text-xs text-muted-foreground">
              Starting from your live pity of <span className="font-medium text-foreground">{currentPity}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="saved-pulls">{game.pullPlural} saved</Label>
              <Input
                id="saved-pulls"
                type="number"
                min={0}
                value={savedPulls}
                onChange={(e) => setSavedPulls(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="per-week">{game.pullPlural} / week</Label>
              <Input
                id="per-week"
                type="number"
                min={0}
                value={pullsPerWeek}
                onChange={(e) => setPullsPerWeek(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="weeks">Forecast horizon: {weeks} weeks</Label>
            <input
              id="weeks"
              type="range"
              min={4}
              max={26}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
              style={{ accentColor: accent }}
            />
          </div>

          {result.limited && (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <ShieldCheck className="size-4" style={{ color: accent }} />
                Guarantee active
              </span>
              <Switch checked={guaranteed} onCheckedChange={setGuaranteed} />
            </label>
          )}
          {result.limited && (
            <p className="text-[11px] text-muted-foreground">
              Turn this on if you lost your last 50/50 — your next 5★ is guaranteed to be the featured unit.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4" style={{ color: accent }} />
            {result.limited ? "Featured unit" : "5★"} odds over time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {metrics.map((m) => (
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

          <ChartContainer
            config={{
              featured: { label: `${targetLabel} chance`, color: accent },
              pulls: { label: noun, color: "var(--muted-foreground)" },
            }}
            className="aspect-[16/8] w-full"
          >
            <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="fillFeatured" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-featured)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-featured)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => `${v}w`}
                className="text-xs"
              />
              <YAxis
                yAxisId="chance"
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
                  const d = payload[0].payload as { week: number; featured: number; pulls: number }
                  return (
                    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">Week {d.week}</p>
                      <p style={{ color: accent }}>{d.featured}% chance</p>
                      <p className="text-xs text-muted-foreground">
                        {d.pulls.toLocaleString()} {noun} banked
                      </p>
                    </div>
                  )
                }}
              />
              <ReferenceLine
                yAxisId="chance"
                y={50}
                stroke="var(--muted-foreground)"
                strokeDasharray="2 4"
                strokeOpacity={0.5}
              />
              <Area
                yAxisId="chance"
                dataKey="featured"
                type="monotone"
                stroke="var(--color-featured)"
                strokeWidth={2}
                fill="url(#fillFeatured)"
              />
              <Line
                yAxisId="chance"
                dataKey="featured"
                type="monotone"
                stroke="transparent"
                dot={false}
                activeDot={{ r: 4, fill: accent }}
              />
            </AreaChart>
          </ChartContainer>

          <p className="text-pretty text-xs text-muted-foreground">
            Combines this banner&apos;s soft-pity model ({result.banner?.softPity}→{result.banner?.hardPity}) with your
            saved {noun} plus {pullsPerWeek} per week.{" "}
            {result.limited
              ? "The featured-unit curve models the 50/50 and guarantee exactly."
              : "Standard banners have no 50/50, so this is your chance of any 5★."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function weekLabel(week: number): string {
  if (week === 0) return "Now"
  return `${week}w`
}
