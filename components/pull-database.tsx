"use client"

import { useMemo, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getGame, type GameId } from "@/lib/games"
import { cn } from "@/lib/utils"
import { Search, Star, Trash2, Loader2 } from "lucide-react"
import { deletePull } from "@/app/actions/warps"

export interface DbRow {
  id: string
  name: string
  rarity: 3 | 4 | 5
  banner: string
  bannerLabel: string
  pity?: number
  pulledAt: number
}

const RARITY_FILTERS = [
  { label: "All", value: 0 },
  { label: "5★", value: 5 },
  { label: "4★", value: 4 },
  { label: "3★", value: 3 },
] as const

export function PullDatabase({ gameId, rows }: { gameId: GameId; rows: DbRow[] }) {
  const game = getGame(gameId)
  const [query, setQuery] = useState("")
  const [rarity, setRarity] = useState<number>(0)
  const [banner, setBanner] = useState<string>("all")
  const [dupesOnly, setDupesOnly] = useState(false)
  const [limit, setLimit] = useState(100)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const banners = useMemo(() => {
    const set = new Map<string, string>()
    for (const r of rows) set.set(r.banner, r.bannerLabel)
    return Array.from(set.entries())
  }, [rows])

  // A pull is a "potential duplicate" if another row shares the same name,
  // rarity and banner. (You may legitimately own multiples — this only flags
  // them so you can review and remove accidental double-entries.)
  const dupKeys = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      const k = `${r.banner}|${r.rarity}|${r.name.toLowerCase()}`
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    return counts
  }, [rows])

  const isDup = (r: DbRow) => (dupKeys.get(`${r.banner}|${r.rarity}|${r.name.toLowerCase()}`) ?? 0) > 1
  const dupCount = useMemo(() => rows.filter(isDup).length, [rows, dupKeys])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (rarity && r.rarity !== rarity) return false
      if (banner !== "all" && r.banner !== banner) return false
      if (dupesOnly && !isDup(r)) return false
      if (q && !r.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, query, rarity, banner, dupesOnly, dupKeys])

  const shown = filtered.slice(0, limit)

  function handleDelete(r: DbRow) {
    if (!confirm(`Delete this ${r.rarity}★ ${r.name}? This can't be undone.`)) return
    const fd = new FormData()
    fd.set("game", gameId)
    fd.set("banner", r.banner)
    fd.set("pullId", r.id)
    setBusyId(r.id)
    startTransition(async () => {
      await deletePull(undefined, fd)
      setBusyId(null)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="pl-9"
            aria-label="Search pulls by name"
          />
        </div>
        <div className="flex gap-1.5">
          {RARITY_FILTERS.map((f) => (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={rarity === f.value ? "default" : "secondary"}
              onClick={() => setRarity(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={banner === "all" ? "default" : "secondary"}
            onClick={() => setBanner("all")}
          >
            All banners
          </Button>
          {banners.map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={banner === id ? "default" : "secondary"}
              onClick={() => setBanner(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length.toLocaleString()} {filtered.length === 1 ? "result" : "results"}
        </p>
        {dupCount > 0 && (
          <Button
            type="button"
            size="sm"
            variant={dupesOnly ? "default" : "secondary"}
            onClick={() => setDupesOnly((v) => !v)}
          >
            {dupesOnly ? "Showing potential duplicates" : `Find duplicates (${dupCount})`}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Rarity</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Banner</th>
              <th className="px-3 py-2 text-right font-medium">Pity</th>
              <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Date</th>
              <th className="px-3 py-2 text-right font-medium">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr
                key={r.id}
                className={cn(
                  "border-t border-border/40",
                  r.rarity === 5 && "bg-primary/5",
                  busyId === r.id && "opacity-40",
                )}
              >
                <td className="px-3 py-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    {r.rarity === 5 && <Star className="size-3 shrink-0 fill-primary text-primary" />}
                    {r.name}
                    {dupesOnly && isDup(r) && (
                      <Badge variant="outline" className="border-destructive/40 text-xs text-destructive">
                        dup?
                      </Badge>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono",
                      r.rarity === 5 && "border-primary/40 text-primary",
                      r.rarity === 4 && "border-chart-2/40 text-chart-2",
                      r.rarity === 3 && "border-border text-muted-foreground",
                    )}
                  >
                    {r.rarity}★
                  </Badge>
                </td>
                <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{r.bannerLabel}</td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                  {r.rarity === 5 && r.pity ? r.pity : "—"}
                </td>
                <td className="hidden px-3 py-2 text-right text-muted-foreground md:table-cell">
                  {r.pulledAt ? new Date(r.pulledAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(r)}
                    disabled={pending && busyId === r.id}
                    aria-label={`Delete ${r.rarity} star ${r.name}`}
                  >
                    {busyId === r.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  No {game.pullPlural.toLowerCase()} match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > limit && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" onClick={() => setLimit((l) => l + 200)}>
            Load more ({(filtered.length - limit).toLocaleString()} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
