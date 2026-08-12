import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { getGameLeaderboard, seedGameStatsIfEmpty } from "@/lib/db"
import { demoStatsForGame } from "@/lib/demo-data"
import { getGame, isGameId, type GameId } from "@/lib/games"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { UserStats } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Trophy, Star, Layers, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

type Board = {
  key: string
  label: string
  icon: typeof Trophy
  sort: (a: UserStats, b: UserStats) => number
  format: (u: UserStats) => string
  hint: string
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const sp = await searchParams
  const gameId: GameId = isGameId(sp.game || "") ? (sp.game as GameId) : "hsr"
  const game = getGame(gameId)

  // Seed fictional demo trailblazers the first time a game's board is viewed.
  await seedGameStatsIfEmpty(gameId, demoStatsForGame(gameId)).catch(() => {})

  const allStats = (await getGameLeaderboard(gameId).catch(() => [])).filter((u) => u.totalPulls > 0)

  const noun = game.pullNoun
  const boards: Board[] = [
    {
      key: "lucky",
      label: "Luck score",
      icon: Trophy,
      sort: (a, b) => b.luckyScore - a.luckyScore,
      format: (u) => `${u.luckyScore} pts`,
      hint: "Higher means earlier average five-stars",
    },
    {
      key: "five",
      label: "Five-stars",
      icon: Star,
      sort: (a, b) => b.fiveStars - a.fiveStars,
      format: (u) => `${u.fiveStars} ★`,
      hint: "Total five-stars pulled",
    },
    {
      key: "pulls",
      label: `Total ${noun.toLowerCase()}s`,
      icon: Layers,
      sort: (a, b) => b.totalPulls - a.totalPulls,
      format: (u) => `${u.totalPulls.toLocaleString()} ${noun.toLowerCase()}s`,
      hint: "Most dedicated players",
    },
    {
      key: "winrate",
      label: "50/50 win rate",
      icon: Sparkles,
      sort: (a, b) => b.win5050Rate - a.win5050Rate,
      format: (u) => `${Math.round(u.win5050Rate * 100)}%`,
      hint: "Best rate-up win percentage",
    },
  ]

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={!!user.isSupporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
          >
            <Trophy className="size-6" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Global Leaderboard</h1>
            <p className="text-muted-foreground">
              {allStats.length.toLocaleString()} ranked players · {game.name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="lucky">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            {boards.map((b) => (
              <TabsTrigger key={b.key} value={b.key} className="gap-1.5">
                <b.icon className="size-3.5" />
                <span className="hidden sm:inline">{b.label}</span>
                <span className="sm:hidden">{b.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {boards.map((board) => {
            const ranked = allStats.slice().sort(board.sort).slice(0, 50)
            return (
              <TabsContent key={board.key} value={board.key}>
                <Card className="border-border/60 bg-card/70 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">{board.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{board.hint}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5">
                    {ranked.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No ranked players yet. Record some {noun.toLowerCase()}s to claim the top spot.
                      </p>
                    )}
                    {ranked.map((u, i) => {
                      const isMe = u.email === user.email
                      const row = (
                        <>
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold",
                              i === 0 && "bg-primary text-primary-foreground",
                              i === 1 && "bg-accent text-accent-foreground",
                              i === 2 && "bg-chart-2/30 text-chart-2",
                              i > 2 && "bg-secondary text-muted-foreground",
                            )}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {u.displayName}
                              {isMe && <span className="ml-2 text-xs text-primary">(you)</span>}
                            </p>
                            {u.uid && <p className="truncate text-xs text-muted-foreground">UID {u.uid}</p>}
                          </div>
                          <Badge variant="outline" className="border-primary/30 font-mono text-primary">
                            {board.format(u)}
                          </Badge>
                        </>
                      )
                      const className = cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        isMe ? "border-primary/40 bg-primary/10" : "border-transparent bg-secondary/40",
                        u.uid && "hover:bg-secondary/70",
                      )
                      return u.uid ? (
                        <Link key={u.email} href={`/u/${gameId}/${u.uid}`} className={className}>
                          {row}
                        </Link>
                      ) : (
                        <div key={u.email} className={className}>
                          {row}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
      </div>
    </AppShell>
  )
}
