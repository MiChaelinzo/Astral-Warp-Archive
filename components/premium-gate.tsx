import { Paywall } from "@/components/paywall-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PREMIUM_FEATURES, SUPPORTER_PERK_BLURB } from "@/lib/premium"
import { Lock, Sparkles, Check } from "lucide-react"

/**
 * Server component gate for Supporter-only pages. Renders children when the
 * user is a Supporter, otherwise a locked preview with the donation paywall.
 */
export function PremiumGate({
  isSupporter,
  title,
  children,
}: {
  isSupporter: boolean
  title: string
  children: React.ReactNode
}) {
  if (isSupporter) return <>{children}</>

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-primary/30 bg-card/70 backdrop-blur">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lock className="size-7" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="flex items-center justify-center gap-2 font-heading text-xl font-bold">
              <Sparkles className="size-5 text-primary" />
              {title} is a Supporter feature
            </h2>
            <p className="mx-auto max-w-md text-pretty text-sm text-muted-foreground">{SUPPORTER_PERK_BLURB}</p>
          </div>

          <ul className="mx-auto grid w-full max-w-md gap-2 text-left sm:grid-cols-2">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.title} className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2">
                <Check className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">{f.title}</span>
              </li>
            ))}
          </ul>

          <Paywall>
            <Button size="lg">
              <Sparkles className="size-4" />
              Unlock all features
            </Button>
          </Paywall>
        </CardContent>
      </Card>
    </div>
  )
}
