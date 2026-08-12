"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { syncProfile, type SyncState } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { GameProfile } from "@/lib/types"
import { getGame, type GameId } from "@/lib/games"
import { RefreshCw, Hash, Info } from "lucide-react"

export function GameProfileCard({
  gameId,
  profile,
  currentUid,
}: {
  gameId: GameId
  profile: GameProfile | null
  currentUid: string
}) {
  const game = getGame(gameId)
  const [state, action, pending] = useActionState<SyncState, FormData>(syncProfile, undefined)
  const [uid, setUid] = useState(currentUid || profile?.uid || "")

  useEffect(() => {
    // keep field in sync when switching games
    setUid(currentUid || profile?.uid || "")
  }, [currentUid, profile])

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    if (state?.error) toast.error(state.error)
  }, [state])

  // Honkai Impact 3rd has no public profile API
  if (game.importProvider === "none") {
    return (
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Info className="size-4" />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold">Manual tracking</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {game.name} doesn&apos;t expose a public profile API, so account import isn&apos;t available. Record your{" "}
              {game.pullNoun.toLowerCase()}s manually to track pity and your luck score.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur">
      <CardContent className="p-0">
        {/* sync bar */}
        <form
          action={action}
          className="flex flex-wrap items-end gap-3 border-b border-border/60 bg-secondary/30 p-4"
        >
          <input type="hidden" name="game" value={gameId} />
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="uid" className="mb-1 block text-xs font-medium text-muted-foreground">
              {game.name} UID
            </label>
            <Input
              id="uid"
              name="uid"
              inputMode="numeric"
              pattern="\d*"
              maxLength={game.uidLength}
              value={uid}
              onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
              placeholder={`e.g. ${game.uidPlaceholder}`}
            />
          </div>
          <Button type="submit" disabled={pending} style={{ backgroundColor: game.accent, color: "#0c0e1a" }}>
            <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
            {pending ? "Syncing..." : profile ? "Re-sync" : "Auto-import"}
          </Button>
        </form>

        {profile ? (
          <div className="p-4">
            <div className="flex items-center gap-4">
              {profile.avatarIcon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarIcon || "/placeholder.svg"}
                  alt={`${profile.nickname}'s avatar`}
                  crossOrigin="anonymous"
                  className="size-16 rounded-full border-2 bg-secondary object-cover"
                  style={{ borderColor: game.accent }}
                />
              ) : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading text-lg font-bold">{profile.nickname}</h3>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
                  >
                    Lv. {profile.level}
                  </span>
                  {profile.worldLevel > 0 && (
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {game.id === "genshin" ? "AR World" : "EQ"} {profile.worldLevel}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Hash className="size-3" />
                  {profile.uid}
                </p>
                {profile.signature ? (
                  <p className="mt-1 truncate text-sm italic text-muted-foreground">&ldquo;{profile.signature}&rdquo;</p>
                ) : null}
              </div>
            </div>

            {profile.stats.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {profile.stats.map((s) => (
                  <div key={s.label} className="rounded-lg bg-secondary/60 px-3 py-2">
                    <p className="font-heading text-sm font-bold" style={{ color: game.accent }}>
                      {s.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {profile.characters.length > 0 ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Showcase
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {profile.characters.map((c) => (
                    <div
                      key={c.id}
                      className="group relative overflow-hidden rounded-xl border border-border/60 bg-secondary/40"
                    >
                      <div
                        className="absolute inset-x-0 top-0 z-10 h-1"
                        style={{ backgroundColor: c.elementColor || game.accent }}
                        aria-hidden
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.portrait || c.icon || "/placeholder.svg"}
                        alt={c.name}
                        crossOrigin="anonymous"
                        loading="lazy"
                        className="h-36 w-full bg-secondary object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                      {c.pathIcon ? (
                        <div className="absolute right-1.5 top-2.5 flex items-center gap-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.pathIcon || "/placeholder.svg"}
                            alt={c.path}
                            crossOrigin="anonymous"
                            className="size-5 rounded-full bg-background/70 p-0.5"
                          />
                        </div>
                      ) : null}
                      <div className="p-2">
                        <p className="truncate font-heading text-sm font-semibold">{c.name}</p>
                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Lv. {c.level}</span>
                          {c.rank > 0 && (
                            <span
                              className="rounded px-1.5 font-semibold"
                              style={{ backgroundColor: `${game.accent}26`, color: game.accent }}
                            >
                              {game.id === "genshin" ? "C" : game.id === "zzz" ? "M" : "E"}
                              {c.rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Enter your in-game UID above to automatically import your account level, stats, and character showcase
              from HoYoverse.
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground/70">
              Note: only public profile data is available by UID. Private {game.pullNoun.toLowerCase()} history must be
              recorded manually for privacy reasons.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
