import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getGameProfile } from "@/lib/db"
import { getGame } from "@/lib/games"
import { resolvePageContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { SupporterStatus } from "@/components/supporter-status"
import { DataTransfer } from "@/components/data-transfer"
import { DangerZone } from "@/components/danger-zone"
import { GameProfileCard } from "@/components/game-profile-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { logOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, LogOut, User } from "lucide-react"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { gameId } = await resolvePageContext(searchParams)
  const game = getGame(gameId)
  const supporter = !!user.isSupporter
  const currentUid = user.uids?.[gameId] || (gameId === "hsr" ? user.uid : "") || ""
  const profile = await getGameProfile(user.email, gameId)

  return (
    <AppShell gameId={gameId} displayName={user.displayName} isSupporter={supporter} supporterStatus={user.supporterStatus} isAdmin={user.isAdmin}>
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-foreground">
              <SettingsIcon className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
              <p className="text-muted-foreground">Manage your account, data, and Supporter status</p>
            </div>
          </div>

          {/* Account */}
          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <form action={logOut}>
                <Button type="submit" variant="secondary">
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Supporter */}
          <SupporterStatus isSupporter={supporter} supporterStatus={user.supporterStatus} supporterSince={user.supporterSince} />

          {/* Profile / UID sync */}
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="font-heading text-lg font-semibold">{game.name} profile</h2>
              <CardDescription>Link your in-game UID to auto-import your account showcase.</CardDescription>
            </div>
            <GameProfileCard gameId={gameId} profile={profile} currentUid={currentUid} />
          </div>

          {/* Import / Export */}
          <DataTransfer gameId={gameId} isSupporter={supporter} />

          {/* Danger zone — reset pulls / account */}
          <DangerZone gameId={gameId} gameName={game.name} />
        </div>
      </div>
    </AppShell>
  )
}
