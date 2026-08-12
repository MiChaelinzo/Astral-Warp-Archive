import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Achievement, AchievementIcon } from "@/lib/achievements"
import type { Activity } from "@/lib/types"
import {
  Rocket,
  Layers,
  Gem,
  Star,
  Clover,
  Shield,
  Trophy,
  Flame,
  Calendar,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

const ICONS: Record<AchievementIcon, LucideIcon> = {
  rocket: Rocket,
  layers: Layers,
  gem: Gem,
  star: Star,
  clover: Clover,
  shield: Shield,
  trophy: Trophy,
  flame: Flame,
  calendar: Calendar,
  sparkles: Sparkles,
}

export function StreakAchievements({
  achievements,
  activity,
  accent,
  compact = false,
}: {
  achievements: Achievement[]
  activity?: Activity | null
  accent: string
  compact?: boolean
}) {
  const earned = achievements.filter((a) => a.earned).length
  const visible = compact ? achievements.filter((a) => a.earned) : achievements

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}26`, color: accent }}
          >
            <Trophy className="size-4" />
          </span>
          <div>
            <CardTitle className="font-heading text-base">Achievements</CardTitle>
            <p className="text-xs text-muted-foreground">
              {earned} of {achievements.length} unlocked
            </p>
          </div>
        </div>

        {activity && (
          <div className="flex items-center gap-3">
            <StreakStat label="Day streak" value={activity.currentStreak} accent={accent} icon={Flame} />
            <StreakStat label="Best" value={activity.longestStreak} accent={accent} icon={Calendar} />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {visible.length === 0 ? (
          <p className="rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            No badges yet — start tracking pulls to earn your first.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((a) => {
              const Icon = ICONS[a.icon]
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                    a.earned ? "border-border/60 bg-secondary/40" : "border-dashed border-border/50 bg-background/30",
                  )}
                  title={a.detail}
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={
                      a.earned
                        ? { backgroundColor: `${accent}26`, color: accent }
                        : { backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className={cn("text-sm font-medium", !a.earned && "text-muted-foreground")}>{a.title}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{a.detail}</p>
                  </div>
                  {!a.earned && a.progress > 0 && (
                    <Progress value={Math.round(a.progress * 100)} className="h-1" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StreakStat({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string
  value: number
  accent: string
  icon: LucideIcon
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5">
      <Icon className="size-4" style={{ color: accent }} />
      <div className="leading-tight">
        <p className="font-heading text-base font-bold" style={{ color: accent }}>
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
