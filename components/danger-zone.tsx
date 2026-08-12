"use client"

import { useState, useTransition } from "react"
import { resetGame, resetAccount } from "@/app/actions/warps"
import type { GameId } from "@/lib/games"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

export function DangerZone({ gameId, gameName }: { gameId: GameId; gameName: string }) {
  const [gameConfirm, setGameConfirm] = useState("")
  const [acctConfirm, setAcctConfirm] = useState("")
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<"game" | "account" | null>(null)

  function runReset(which: "game" | "account") {
    const fd = new FormData()
    fd.set("game", gameId)
    setMsg(null)
    setAction(which)
    startTransition(async () => {
      const res =
        which === "game"
          ? (fd.set("confirm", gameConfirm), await resetGame(undefined, fd))
          : (fd.set("confirm", acctConfirm), await resetAccount(undefined, fd))
      if (res?.error) setMsg({ kind: "err", text: res.error })
      else if (res?.success) {
        setMsg({ kind: "ok", text: res.success })
        setGameConfirm("")
        setAcctConfirm("")
      }
      setAction(null)
    })
  }

  return (
    <Card className="border-destructive/40 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="size-4" />
          Danger zone
        </CardTitle>
        <CardDescription>
          Clear your recorded pulls if you imported duplicates or want to start fresh. This removes pull history only —
          your login is kept. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {msg && (
          <p
            className={
              msg.kind === "ok"
                ? "rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
                : "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            }
            role="status"
          >
            {msg.text}
          </p>
        )}

        {/* Reset current game */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Reset {gameName} data</p>
          <p className="text-sm text-muted-foreground">
            Deletes every {gameName} banner&apos;s pull history and removes you from the {gameName} leaderboard. Type{" "}
            <code className="rounded bg-secondary px-1 font-mono text-xs">RESET</code> to confirm.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={gameConfirm}
              onChange={(e) => setGameConfirm(e.target.value)}
              placeholder="RESET"
              aria-label="Type RESET to confirm clearing this game"
              className="sm:max-w-[200px]"
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => runReset("game")}
              disabled={pending || gameConfirm.trim().toUpperCase() !== "RESET"}
            >
              {pending && action === "game" ? <Loader2 className="size-4 animate-spin" /> : null}
              Clear {gameName}
            </Button>
          </div>
        </div>

        <div className="h-px bg-border/60" />

        {/* Reset whole account */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Reset all games</p>
          <p className="text-sm text-muted-foreground">
            Wipes pull history across every game and all leaderboards. Type{" "}
            <code className="rounded bg-secondary px-1 font-mono text-xs">RESET EVERYTHING</code> to confirm.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={acctConfirm}
              onChange={(e) => setAcctConfirm(e.target.value)}
              placeholder="RESET EVERYTHING"
              aria-label="Type RESET EVERYTHING to confirm clearing all games"
              className="sm:max-w-[240px]"
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => runReset("account")}
              disabled={pending || acctConfirm.trim().toUpperCase() !== "RESET EVERYTHING"}
            >
              {pending && action === "account" ? <Loader2 className="size-4 animate-spin" /> : null}
              Reset everything
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
