"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { logOut } from "@/app/actions/auth"
import { Paywall } from "@/components/paywall-dialog"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { GAME_LIST, getGame, type GameId } from "@/lib/games"
import type { SupporterStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  Sparkles,
  Zap,
  Calculator,
  CalendarClock,
  CalendarHeart,
  ListChecks,
  Database,
  GanttChartSquare,
  Trophy,
  Settings,
  LogOut,
  Menu,
  Lock,
  Heart,
  ShieldCheck,
  TrainFront,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  premium?: boolean
}

export function AppShell({
  children,
  gameId,
  displayName,
  isSupporter,
  supporterStatus = "none",
  isAdmin = false,
}: {
  children: React.ReactNode
  gameId: GameId
  displayName: string
  isSupporter: boolean
  supporterStatus?: SupporterStatus
  isAdmin?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const game = (searchParams.get("game") as GameId) || gameId
  const gameDef = getGame(game)
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/characters", label: "Character", icon: Users },
    { href: "/counter", label: `${gameDef.pullNoun} Counter`, icon: Sparkles },
    { href: "/events", label: "Events", icon: CalendarHeart },
    { href: "/quick-log", label: "Quick Log", icon: Zap },
    { href: "/calculator", label: "Calculator", icon: Calculator, premium: true },
    { href: "/forecast", label: "Forecast", icon: CalendarClock, premium: true },
    { href: "/todo", label: "Todo List", icon: ListChecks, premium: true },
    { href: "/database", label: "Database", icon: Database },
    { href: "/timeline", label: "Timeline", icon: GanttChartSquare, premium: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ href: "/admin/receipts", label: "Receipts", icon: ShieldCheck }] : []),
  ]

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href
          const href = `${item.href}?game=${game}`
          const locked = item.premium && !isSupporter
          const inner = (
            <>
              <item.icon className={cn("size-5 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
              <span className="flex-1 text-left">{item.label}</span>
              {locked && <Lock className="size-3.5 text-muted-foreground" />}
            </>
          )
          const base =
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full"
          if (locked) {
            return (
              <Paywall key={item.href} status={supporterStatus}>
                <button className={cn(base, "text-foreground/80 hover:bg-secondary/60")}>{inner}</button>
              </Paywall>
            )
          }
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                base,
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-secondary/60",
              )}
            >
              {inner}
            </Link>
          )
        })}
      </nav>
    )
  }

  function GamePills({ onNavigate }: { onNavigate?: () => void }) {
    // switch game but stay on the current page
    const base = pathname || "/dashboard"
    return (
      <div className="flex flex-wrap gap-1.5">
        {GAME_LIST.map((g) => {
          const isActive = g.id === game
          return (
            <Link
              key={g.id}
              href={`${base}?game=${g.id}`}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              title={g.name}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border transition-colors",
                isActive
                  ? "border-transparent text-background"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground",
              )}
              style={isActive ? { backgroundColor: g.accent } : undefined}
            >
              <g.icon className="size-4" />
            </Link>
          )
        })}
      </div>
    )
  }

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col gap-5 p-4">
      <Link href={`/dashboard?game=${game}`} onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TrainFront className="size-5" />
        </span>
        <span className="font-heading text-base font-semibold leading-tight tracking-tight">
          Astral Warp
          <br />
          <span className="text-muted-foreground">Archive</span>
        </span>
      </Link>

      <div className="flex flex-col gap-2">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Game</p>
        <GamePills onNavigate={onNavigate} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        {isSupporter ? (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
            <Heart className="size-4 fill-current" />
            Supporter
          </div>
        ) : (
          <Paywall status={supporterStatus}>
            <button className="flex w-full items-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
              {supporterStatus === "pending" ? (
                <>
                  <Heart className="size-4" />
                  Receipt under review
                </>
              ) : (
                <>
                  <Heart className="size-4" />
                  Become a Supporter
                </>
              )}
            </button>
          </Paywall>
        )}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="truncate text-sm text-muted-foreground" title={displayName}>
            {displayName}
          </span>
          <form action={logOut}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur lg:block">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href={`/dashboard?game=${game}`} className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrainFront className="size-4" />
          </span>
          <span className="font-heading text-sm font-semibold">Astral Warp Archive</span>
        </Link>
        <div className="w-9" />
      </header>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
