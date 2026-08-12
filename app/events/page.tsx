import { requireGameContext } from "@/lib/page-context"
import { getGameEvents, getFeaturedCollab } from "@/lib/events"
import { AppShell } from "@/components/app-shell"
import { EventsBoard } from "@/components/events-board"
import { CalendarDays } from "lucide-react"

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const { user, gameId, game } = await requireGameContext(searchParams)

  const now = Date.now()
  const { live, upcoming, ended } = getGameEvents(gameId, now)
  const collab = getFeaturedCollab(gameId, now)

  return (
    <AppShell
      gameId={gameId}
      displayName={user.displayName}
      isSupporter={!!user.isSupporter}
      supporterStatus={user.supporterStatus}
      isAdmin={user.isAdmin}
    >
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
            >
              <CalendarDays className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Events &amp; Banners</h1>
              <p className="text-muted-foreground">
                Live and upcoming {game.pullNoun.toLowerCase()} banners for {game.name}
              </p>
            </div>
          </div>

          <EventsBoard gameId={gameId} collab={collab} live={live} upcoming={upcoming} ended={ended} />
        </div>
      </div>
    </AppShell>
  )
}
