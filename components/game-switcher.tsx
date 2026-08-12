"use client"

import Link from "next/link"
import { GAME_LIST, type GameId } from "@/lib/games"
import { cn } from "@/lib/utils"

export function GameSwitcher({ active }: { active: GameId }) {
  return (
    <div className="flex flex-wrap gap-2">
      {GAME_LIST.map((g) => {
        const isActive = g.id === active
        return (
          <Link
            key={g.id}
            href={`/dashboard?game=${g.id}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-transparent text-background"
                : "border-border/60 bg-card/60 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
            style={isActive ? { backgroundColor: g.accent } : undefined}
          >
            <g.icon className="size-4" />
            <span className="hidden sm:inline">{g.name}</span>
            <span className="sm:hidden">{g.short}</span>
          </Link>
        )
      })}
    </div>
  )
}
