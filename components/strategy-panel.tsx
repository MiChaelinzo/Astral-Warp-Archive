import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { StrategyTip } from "@/lib/strategy"
import { cn } from "@/lib/utils"
import { Compass, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"

const TONE = {
  good: { icon: TrendingUp, ring: "border-primary/40", chip: "bg-primary/15 text-primary" },
  warn: { icon: AlertTriangle, ring: "border-chart-5/40", chip: "bg-chart-5/15 text-chart-5" },
  info: { icon: Lightbulb, ring: "border-border", chip: "bg-secondary text-muted-foreground" },
} as const

export function StrategyPanel({ tips }: { tips: StrategyTip[] }) {
  if (tips.length === 0) return null
  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="size-4 text-primary" />
          Your pull strategy
        </CardTitle>
        <CardDescription>Recommendations generated from your live pity and 50/50 history.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {tips.map((t, i) => {
          const tone = TONE[t.tone]
          const Icon = tone.icon
          return (
            <div key={i} className={cn("flex flex-col gap-1.5 rounded-lg border bg-background/40 p-3", tone.ring)}>
              <div className="flex items-center gap-2">
                <span className={cn("flex size-6 items-center justify-center rounded-md", tone.chip)}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">{t.banner}</span>
              </div>
              <p className="text-sm font-semibold leading-tight text-pretty">{t.title}</p>
              <p className="text-xs leading-snug text-muted-foreground text-pretty">{t.detail}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
