"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { getGame, type GameId } from "@/lib/games"
import { getEventPhase, type BannerEvent, type EventPhase } from "@/lib/events"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Star, Sparkle, CalendarDays, Clock, Swords, Info } from "lucide-react"

interface EventsBoardProps {
  gameId: GameId
  collab: BannerEvent | null
  live: BannerEvent[]
  upcoming: BannerEvent[]
  ended: BannerEvent[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

/** Human "time remaining" between now and a target timestamp. */
function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  const diff = Date.parse(targetIso) - now
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function EventsBoard({ gameId, collab, live, upcoming, ended }: EventsBoardProps) {
  const game = getGame(gameId)

  return (
    <div className="flex flex-col gap-8">
      {collab && <CollabHighlight event={collab} accent={game.accent} />}

      <EventSection
        title="Live now"
        icon={<Clock className="size-4" />}
        events={live}
        accent={game.accent}
        emptyText={`No banners are currently live for ${game.name}.`}
      />
      <EventSection
        title="Upcoming"
        icon={<CalendarDays className="size-4" />}
        events={upcoming}
        accent={game.accent}
        emptyText="No upcoming banners announced yet."
      />
      {ended.length > 0 && (
        <EventSection
          title="Recently ended"
          icon={<CalendarDays className="size-4" />}
          events={ended}
          accent={game.accent}
          muted
        />
      )}
    </div>
  )
}

function CollabHighlight({ event, accent }: { event: BannerEvent; accent: string }) {
  const phase = getEventPhase(event)
  const countdown = useCountdown(phase === "upcoming" ? event.start : event.end)

  return (
    <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur">
      {event.image && (
        <div className="relative h-44 w-full sm:h-56">
          <Image
            src={event.image || "/placeholder.svg"}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" aria-hidden />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge
              className="border-none font-semibold uppercase tracking-wide text-background"
              style={{ backgroundColor: accent }}
            >
              <Swords className="mr-1 size-3.5" /> Collaboration
            </Badge>
            <PhaseBadge phase={phase} accent={accent} />
          </div>
        </div>
      )}
      <CardContent className="flex flex-col gap-4 py-5">
        <div>
          <h2 className="text-balance font-heading text-xl font-bold tracking-tight md:text-2xl">{event.title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>
              {fmtDate(event.start)} — {fmtDate(event.end)}
            </span>
            {countdown && (
              <span className="font-medium" style={{ color: accent }}>
                · {phase === "upcoming" ? `Starts in ${countdown}` : `Ends in ${countdown}`}
              </span>
            )}
          </p>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{event.description}</p>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Featured units</p>
          <div className="flex flex-wrap gap-2">
            {event.featured.map((u) => (
              <UnitChip key={u.name} name={u.name} rarity={u.rarity} role={u.role} accent={accent} />
            ))}
          </div>
        </div>

        {event.estimated && <EstimatedNote />}
      </CardContent>
    </Card>
  )
}

function EventSection({
  title,
  icon,
  events,
  accent,
  emptyText,
  muted,
}: {
  title: string
  icon: React.ReactNode
  events: BannerEvent[]
  accent: string
  emptyText?: string
  muted?: boolean
}) {
  if (events.length === 0 && !emptyText) return null
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h2>
      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} accent={accent} muted={muted} />
          ))}
        </div>
      )}
    </section>
  )
}

function EventCard({ event, accent, muted }: { event: BannerEvent; accent: string; muted?: boolean }) {
  const phase = getEventPhase(event)
  const countdown = useCountdown(phase === "upcoming" ? event.start : event.end)

  return (
    <Card className={cn("border-border/60 bg-card/60 backdrop-blur", muted && "opacity-70")}>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {event.isCollab ? (
              <Swords className="size-4 shrink-0" style={{ color: accent }} />
            ) : (
              <Star className="size-4 shrink-0" style={{ color: accent }} fill={accent} />
            )}
            <h3 className="font-heading text-sm font-semibold leading-tight">{event.title}</h3>
          </div>
          <PhaseBadge phase={phase} accent={accent} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {event.featured.map((u) => (
            <UnitChip key={u.name} name={u.name} rarity={u.rarity} role={u.role} accent={accent} compact />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>
            {fmtDate(event.start)} — {fmtDate(event.end)}
          </span>
          {countdown && (
            <span className="font-medium" style={{ color: accent }}>
              · {phase === "upcoming" ? `in ${countdown}` : `${countdown} left`}
            </span>
          )}
        </div>

        {event.estimated && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
            <Info className="size-3" /> Estimated — subject to change
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function UnitChip({
  name,
  rarity,
  role,
  accent,
  compact,
}: {
  name: string
  rarity: 4 | 5
  role?: string
  accent: string
  compact?: boolean
}) {
  const five = rarity === 5
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        compact && "text-[11px]",
      )}
      style={{
        borderColor: five ? `${accent}66` : "var(--border)",
        backgroundColor: five ? `${accent}1a` : "var(--secondary)",
        color: five ? accent : "var(--foreground)",
      }}
    >
      {five ? <Star className="size-3" fill={accent} /> : <Sparkle className="size-3" />}
      {name}
      {role && !compact && <span className="text-muted-foreground">· {role}</span>}
    </span>
  )
}

function PhaseBadge({ phase, accent }: { phase: EventPhase; accent: string }) {
  if (phase === "live") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background"
        style={{ backgroundColor: accent }}
      >
        <span className="size-1.5 animate-pulse rounded-full bg-background" /> Live
      </span>
    )
  }
  if (phase === "upcoming") {
    return (
      <span
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ borderColor: `${accent}66`, color: accent }}
      >
        Soon
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      Ended
    </span>
  )
}

function EstimatedNote() {
  return (
    <p className="flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      Dates and featured units are based on early reveals and may change before the official release.
    </p>
  )
}
