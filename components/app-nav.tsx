"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrainFront, LayoutDashboard, Trophy, LogOut } from "lucide-react"

export function AppNav({ displayName }: { displayName: string }) {
  const pathname = usePathname()
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrainFront className="size-4" />
          </span>
          <span className="hidden font-heading text-base font-semibold tracking-tight sm:inline">
            Astral Warp Archive
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Button
                key={l.href}
                render={<Link href={l.href} />}
                nativeButton={false}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className={cn(active && "text-foreground")}
              >
                <l.icon className="size-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground md:inline">{displayName}</span>
          <form action={logOut}>
            <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
