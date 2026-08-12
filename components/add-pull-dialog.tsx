"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { recordPull, importPulls, importFromUrl, type WarpActionState } from "@/app/actions/warps"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getGame, type GameId } from "@/lib/games"
import { Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  )
}

export function AddPullDialog({ gameId }: { gameId: GameId }) {
  const game = getGame(gameId)
  const noun = game.pullNoun
  const plural = game.pullPlural
  const supportsUrlImport = game.importProvider !== "none"
  const [open, setOpen] = useState(false)
  const [banner, setBanner] = useState<string>(game.banners[0].id)
  const [rarity, setRarity] = useState<3 | 4 | 5>(5)
  const formRef = useRef<HTMLFormElement>(null)
  const bulkRef = useRef<HTMLFormElement>(null)
  const urlRef = useRef<HTMLFormElement>(null)

  const [singleState, singleAction] = useActionState<WarpActionState, FormData>(recordPull, undefined)
  const [bulkState, bulkAction] = useActionState<WarpActionState, FormData>(importPulls, undefined)
  const [urlState, urlAction] = useActionState<WarpActionState, FormData>(importFromUrl, undefined)

  // reset selected banner when the game changes
  useEffect(() => {
    setBanner(game.banners[0].id)
  }, [game])

  useEffect(() => {
    if (singleState?.success) {
      toast.success(singleState.success)
      formRef.current?.reset()
      setRarity(5)
      setOpen(false)
    } else if (singleState?.error) {
      toast.error(singleState.error)
    }
  }, [singleState])

  useEffect(() => {
    if (bulkState?.success) {
      toast.success(bulkState.success)
      bulkRef.current?.reset()
      setOpen(false)
    } else if (bulkState?.error) {
      toast.error(bulkState.error)
    }
  }, [bulkState])

  useEffect(() => {
    if (urlState?.success) {
      toast.success(urlState.success)
      urlRef.current?.reset()
      setOpen(false)
    } else if (urlState?.error) {
      toast.error(urlState.error)
    }
  }, [urlState])

  const bannerDef = game.banners.find((b) => b.id === banner) ?? game.banners[0]
  const isLimited = bannerDef.limited

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Record {noun.toLowerCase()}
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Record a {noun.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {game.name} — log a single {noun.toLowerCase()} or paste a batch of results.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={supportsUrlImport ? "url" : "single"} className="mt-2">
          <TabsList className={cn("grid w-full", supportsUrlImport ? "grid-cols-3" : "grid-cols-2")}>
            {supportsUrlImport && <TabsTrigger value="url">From URL</TabsTrigger>}
            <TabsTrigger value="single">Single</TabsTrigger>
            <TabsTrigger value="bulk">Bulk</TabsTrigger>
          </TabsList>

          {/* Full-history import from pasted game URL */}
          {supportsUrlImport && (
            <TabsContent value="url">
              <form ref={urlRef} action={urlAction} className="flex flex-col gap-4">
                <input type="hidden" name="game" value={gameId} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="url">In-game history URL</Label>
                  <Textarea
                    id="url"
                    name="url"
                    rows={4}
                    placeholder={`Paste the full ${noun.toLowerCase()} history link copied from your game client...`}
                    className="font-mono text-xs"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This imports your <span className="text-foreground">entire</span> {plural.toLowerCase()} history
                    across all banners. The link contains a temporary key that we use only for this import and never
                    store. Links expire after about a day, so grab a fresh one if it fails.
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">How to get the link</p>
                  Open the in-game {noun.toLowerCase()} history page, then use a cache-URL helper (PowerShell script or
                  a tool like Star Rail Warp Export / paimon.moe) to copy the authenticated URL, and paste it above.
                </div>
                <Submit label={`Import full history`} />
              </form>
            </TabsContent>
          )}

          {/* Single pull */}
          <TabsContent value="single">
            <div className="mb-3 flex flex-col gap-2">
              <Label>Banner</Label>
              <Select value={banner} onValueChange={(v) => setBanner(v ?? game.banners[0].id)}>
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
            <form ref={formRef} action={singleAction} className="flex flex-col gap-4">
              <input type="hidden" name="game" value={gameId} />
              <input type="hidden" name="banner" value={banner} />
              <input type="hidden" name="rarity" value={rarity} />

              <div className="flex flex-col gap-2">
                <Label>Rarity</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([5, 4, 3] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRarity(r)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        rarity === r
                          ? r === 5
                            ? "border-primary bg-primary/15 text-primary"
                            : r === 4
                              ? "border-chart-2 bg-chart-2/15 text-chart-2"
                              : "border-border bg-secondary text-foreground"
                          : "border-border/60 text-muted-foreground hover:bg-secondary/60",
                      )}
                    >
                      {r}★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="e.g. Acheron" required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="character">
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="weapon">{game.id === "zzz" ? "W-Engine" : game.id === "genshin" ? "Weapon" : "Light Cone"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rarity === 5 && isLimited && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="won5050">50/50 result</Label>
                  <Select name="won5050" defaultValue="win">
                    <SelectTrigger id="won5050">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">Won (got rate-up)</SelectItem>
                      <SelectItem value="lose">Lost (off-banner)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Submit label={`Add ${noun.toLowerCase()}`} />
            </form>
          </TabsContent>

          {/* Bulk import */}
          <TabsContent value="bulk">
            <div className="mb-3 flex flex-col gap-2">
              <Label>Banner</Label>
              <Select value={banner} onValueChange={(v) => setBanner(v ?? game.banners[0].id)}>
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
            <form ref={bulkRef} action={bulkAction} className="flex flex-col gap-4">
              <input type="hidden" name="game" value={gameId} />
              <input type="hidden" name="banner" value={banner} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="bulk">Paste {plural.toLowerCase()}</Label>
                <Textarea
                  id="bulk"
                  name="bulk"
                  rows={7}
                  placeholder={"One per line, oldest first:\n3 Cloudflame Slash\n4 Pela\n5 Acheron win"}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Format: {"<rarity> <name> [win|lose]"}. Add win/lose on limited five-stars to track 50/50.
                </p>
              </div>
              <Submit label={`Import ${plural.toLowerCase()}`} />
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
