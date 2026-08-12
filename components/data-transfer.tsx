"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { importFromFile, type WarpActionState } from "@/app/actions/warps"
import { Paywall } from "@/components/paywall-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getGame, type GameId } from "@/lib/games"
import { Upload, Download, FileJson, FileSpreadsheet, Lock, Loader2, Info } from "lucide-react"

function ImportSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
      Import file
    </Button>
  )
}

export function DataTransfer({ gameId, isSupporter }: { gameId: GameId; isSupporter: boolean }) {
  const game = getGame(gameId)
  const canImport = game.importProvider !== "none"
  const formRef = useRef<HTMLFormElement>(null)
  const [fileName, setFileName] = useState("")
  const router = useRouter()
  const [state, action] = useActionState<WarpActionState, FormData>(importFromFile, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      formRef.current?.reset()
      setFileName("")
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const exportButtons = (
    <div className="flex flex-wrap gap-2">
      <Button
        render={<a href={`/api/export?game=${gameId}&format=uigf`} />}
        nativeButton={false}
        variant="secondary"
        size="sm"
      >
        <FileJson className="size-4" />
        UIGF v4.0 (.json)
      </Button>
      <Button
        render={<a href={`/api/export?game=${gameId}&format=csv`} />}
        nativeButton={false}
        variant="secondary"
        size="sm"
      >
        <FileSpreadsheet className="size-4" />
        Excel (.csv)
      </Button>
    </div>
  )

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="size-4 text-primary" />
          Import &amp; Export
        </CardTitle>
        <CardDescription>
          Sync with community tools using the open UIGF / SRGF standard.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Import */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Import history file</p>
          {canImport ? (
            <>
              <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="game" value={gameId} />
                <label className="flex-1">
                  <span className="sr-only">Choose UIGF or SRGF JSON file</span>
                  <input
                    type="file"
                    name="file"
                    accept=".json,application/json"
                    required
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
                  />
                </label>
                <ImportSubmit />
              </form>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Export a <span className="text-foreground">UIGF v4.0</span> or{" "}
                  <span className="text-foreground">SRGF</span> .json from tools like{" "}
                  <span className="text-foreground">star-rail-warp-export</span> or Snap.Hutao, then drop it here.
                  Duplicate pulls are skipped automatically.
                </span>
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {game.name} doesn&apos;t support file import — add {game.pullPlural.toLowerCase()} manually.
            </p>
          )}
        </div>

        {/* Export */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Export your data</p>
            {!isSupporter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Lock className="size-3" /> Supporter
              </span>
            )}
          </div>
          {isSupporter ? (
            exportButtons
          ) : (
            <Paywall>
              <Button variant="secondary" size="sm">
                <Lock className="size-4" />
                Unlock export
              </Button>
            </Paywall>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
