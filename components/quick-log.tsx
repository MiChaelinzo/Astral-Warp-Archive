"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { recordPull, type WarpActionState } from "@/app/actions/warps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getGame, type GameId } from "@/lib/games"
import { cn } from "@/lib/utils"
import { Loader2, Check } from "lucide-react"

interface BannerPity {
  bannerType: string
  currentPity: number
}

function SubmitButton({ accent }: { accent: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full text-base font-semibold"
      style={{ backgroundColor: accent, color: "#0c0e1a" }}
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
      Log it
    </Button>
  )
}

/**
 * Thumb-friendly single-pull logger built for mobile / installed-PWA use.
 * Reuses the same `recordPull` server action as the desktop dialog, but with
 * large tap targets and the current pity for the selected banner shown inline.
 */
export function QuickLog({ gameId, bannerPity }: { gameId: GameId; bannerPity: BannerPity[] }) {
  const game = getGame(gameId)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const [banner, setBanner] = useState<string>(game.banners[0].id)
  const [rarity, setRarity] = useState<3 | 4 | 5>(5)
  const [type, setType] = useState<"character" | "weapon">("character")
  const [won5050, setWon5050] = useState<"win" | "lose">("win")

  const [state, action] = useActionState<WarpActionState, FormData>(recordPull, undefined)

  useEffect(() => {
    setBanner(game.banners[0].id)
  }, [game])

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      formRef.current?.reset()
      setRarity(5)
      setType("character")
      setWon5050("win")
      nameRef.current?.focus()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const bannerDef = game.banners.find((b) => b.id === banner) ?? game.banners[0]
  const isLimited = bannerDef.limited
  const pity = bannerPity.find((b) => b.bannerType === banner)?.currentPity ?? 0
  const sinceSoft = bannerDef.softPity ? Math.max(0, bannerDef.softPity - pity) : null
  const weaponLabel = game.id === "zzz" ? "W-Engine" : game.id === "genshin" || game.id === "wuwa" ? "Weapon" : "Light Cone"

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      <input type="hidden" name="game" value={gameId} />
      <input type="hidden" name="banner" value={banner} />
      <input type="hidden" name="rarity" value={rarity} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="won5050" value={won5050} />

      {/* Banner selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Banner</Label>
        <div className="grid grid-cols-1 gap-2">
          {game.banners.map((b) => {
            const bPity = bannerPity.find((x) => x.bannerType === b.id)?.currentPity ?? 0
            const active = banner === b.id
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBanner(b.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                  active ? "border-2" : "border-border/60 hover:bg-secondary/60",
                )}
                style={active ? { borderColor: game.accent, backgroundColor: `${game.accent}1a` } : undefined}
              >
                <span className="font-medium">{b.name}</span>
                <span className="text-sm text-muted-foreground">{bPity} pity</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Current pity readout for the selected banner */}
      <div
        className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm"
        aria-live="polite"
      >
        <span className="text-muted-foreground">Current pity on {bannerDef.short}: </span>
        <span className="font-semibold text-foreground">{pity}</span>
        {sinceSoft !== null && (
          <span className="text-muted-foreground">
            {" "}
            · {sinceSoft > 0 ? `${sinceSoft} to soft pity` : "in soft pity range"}
          </span>
        )}
      </div>

      {/* Rarity */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Rarity</Label>
        <div className="grid grid-cols-3 gap-2">
          {([5, 4, 3] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRarity(r)}
              className={cn(
                "rounded-xl border py-4 text-base font-semibold transition-colors",
                rarity === r
                  ? r === 5
                    ? "border-2 border-primary bg-primary/15 text-primary"
                    : r === 4
                      ? "border-2 border-chart-2 bg-chart-2/15 text-chart-2"
                      : "border-2 border-border bg-secondary text-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {r}★
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["character", "weapon"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-xl border py-3 text-base font-medium transition-colors",
                type === t ? "border-2" : "border-border/60 text-muted-foreground hover:bg-secondary/60",
              )}
              style={type === t ? { borderColor: game.accent, backgroundColor: `${game.accent}1a` } : undefined}
            >
              {t === "character" ? "Character" : weaponLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-sm">
          Name
        </Label>
        <Input
          ref={nameRef}
          id="name"
          name="name"
          placeholder="e.g. Acheron"
          className="h-12 text-base"
          autoComplete="off"
          required
        />
      </div>

      {/* 50/50 result — only for limited five-stars */}
      {rarity === 5 && isLimited && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm">50/50 result</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["win", "lose"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWon5050(w)}
                className={cn(
                  "rounded-xl border py-3 text-base font-medium transition-colors",
                  won5050 === w
                    ? w === "win"
                      ? "border-2 border-primary bg-primary/15 text-primary"
                      : "border-2 border-destructive bg-destructive/15 text-destructive"
                    : "border-border/60 text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {w === "win" ? "Won (rate-up)" : "Lost (off-banner)"}
              </button>
            ))}
          </div>
        </div>
      )}

      <SubmitButton accent={game.accent} />
    </form>
  )
}
