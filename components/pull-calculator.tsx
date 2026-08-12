"use client"

import { useMemo, useState } from "react"
import { getGame, getBanner, type GameId } from "@/lib/games"
import { chanceWithin, pullsForChance } from "@/lib/probability"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Target, Coins, Sparkles, TicketCheck } from "lucide-react"

const TARGETS = [
  { label: "Coin flip (50%)", value: 0.5 },
  { label: "Likely (75%)", value: 0.75 },
  { label: "Safe (90%)", value: 0.9 },
  { label: "Near-certain (99%)", value: 0.99 },
]

export function PullCalculator({
  gameId,
  initialPity,
}: {
  gameId: GameId
  initialPity: Partial<Record<string, number>>
}) {
  const game = getGame(gameId)
  const [bannerId, setBannerId] = useState(game.banners[0].id)
  const banner = getBanner(gameId, bannerId) ?? game.banners[0]

  const [pity, setPity] = useState(initialPity[bannerId] ?? 0)
  const [target, setTarget] = useState(0.9)
  const [copies, setCopies] = useState(1)
  const [savedCurrency, setSavedCurrency] = useState(0)

  function onBannerChange(id: string) {
    setBannerId(id)
    setPity(initialPity[id] ?? 0)
  }

  const result = useMemo(() => {
    const { softPity, hardPity } = banner
    // pulls to one copy at target confidence
    const perCopy = pullsForChance(pity, target, softPity, hardPity)
    // additional copies start from 0 pity each; on 50/50 banners a copy may cost a guarantee.
    // Use a pragmatic estimate: subsequent copies cost the target-confidence pulls from 0 pity.
    const perCopyFromZero = pullsForChance(0, target, softPity, hardPity)
    const totalPulls = perCopy + (copies - 1) * perCopyFromZero
    const currencyNeeded = totalPulls * game.currencyPerPull
    const usd = totalPulls * game.usdPerPull
    const havesPulls = Math.floor(savedCurrency / game.currencyPerPull)
    const shortfallPulls = Math.max(0, totalPulls - havesPulls)
    const shortfallCurrency = shortfallPulls * game.currencyPerPull
    const chanceWithSaved = havesPulls > 0 ? chanceWithin(pity, havesPulls, softPity, hardPity) : 0
    return { perCopy, totalPulls, currencyNeeded, usd, havesPulls, shortfallPulls, shortfallCurrency, chanceWithSaved }
  }, [banner, pity, target, copies, savedCurrency, game])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" />
            Plan your pulls
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Banner</Label>
            <Select value={bannerId} onValueChange={(v) => v && onBannerChange(v)}>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pity">Current pity</Label>
              <Input
                id="pity"
                type="number"
                min={0}
                max={banner.hardPity}
                value={pity}
                onChange={(e) => setPity(Math.max(0, Math.min(banner.hardPity, Number(e.target.value) || 0)))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="copies">Copies wanted</Label>
              <Input
                id="copies"
                type="number"
                min={1}
                max={7}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(7, Number(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Target confidence</Label>
            <Select value={String(target)} onValueChange={(v) => v && setTarget(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGETS.map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saved">
              {game.currency} saved <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="saved"
              type="number"
              min={0}
              value={savedCurrency}
              onChange={(e) => setSavedCurrency(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-primary/30 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            What you need
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<TicketCheck className="size-4" />} label={`${game.pullPlural} needed`} value={result.totalPulls.toLocaleString()} accent={game.accent} />
            <Stat icon={<Coins className="size-4" />} label={`${game.currency}`} value={result.currencyNeeded.toLocaleString()} accent={game.accent} />
          </div>

          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-sm text-muted-foreground">
              Estimated real-money value:{" "}
              <span className="font-semibold text-foreground">${result.usd.toFixed(2)}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              For {copies} cop{copies === 1 ? "y" : "ies"} at {Math.round(target * 100)}% confidence, starting from{" "}
              {pity} pity.
            </p>
          </div>

          {savedCurrency > 0 && (
            <div
              className="rounded-lg border p-3"
              style={{
                borderColor: result.shortfallPulls === 0 ? "var(--chart-2)" : undefined,
                backgroundColor: result.shortfallPulls === 0 ? "color-mix(in oklch, var(--chart-2) 12%, transparent)" : undefined,
              }}
            >
              {result.shortfallPulls === 0 ? (
                <p className="text-sm font-medium text-chart-2">
                  You have enough — {result.havesPulls.toLocaleString()} {game.pullPlural.toLowerCase()} saved covers it.
                </p>
              ) : (
                <p className="text-sm">
                  You&apos;re short <span className="font-semibold text-primary">{result.shortfallPulls.toLocaleString()}</span>{" "}
                  {game.pullPlural.toLowerCase()} (
                  <span className="font-semibold">{result.shortfallCurrency.toLocaleString()}</span> {game.currency}).
                  Your saved currency gives ~{Math.round(result.chanceWithSaved * 100)}% chance.
                </p>
              )}
            </div>
          )}

          <p className="text-pretty text-xs text-muted-foreground">
            Estimates use this banner&apos;s soft-pity model ({banner.softPity}→{banner.hardPity}). Multi-copy estimates
            assume each extra copy starts from 0 pity and don&apos;t model the 50/50 guarantee carryover precisely.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/40 p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</span>
      <span className="font-mono text-xl font-bold" style={{ color: accent }}>
        {value}
      </span>
    </div>
  )
}
