"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Paywall } from "@/components/paywall-dialog"
import { disableSupporter } from "@/app/actions/supporter"
import type { SupporterStatus as Status } from "@/lib/types"
import { Heart, Sparkles, Check, Clock, X } from "lucide-react"

export function SupporterStatus({
  isSupporter,
  supporterStatus = "none",
  supporterSince,
}: {
  isSupporter: boolean
  supporterStatus?: Status
  supporterSince?: number
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDisable() {
    startTransition(async () => {
      const res = await disableSupporter()
      if (res?.success) {
        toast.success(res.success)
        router.refresh()
      } else {
        toast.error(res?.error || "Something went wrong.")
      }
    })
  }

  const isPending = !isSupporter && supporterStatus === "pending"
  const isRejected = !isSupporter && supporterStatus === "rejected"

  return (
    <Card className="border-primary/30 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Supporter
        </CardTitle>
        <CardDescription>
          {isSupporter
            ? "Thank you — every premium tool is unlocked on your account."
            : isPending
              ? "Your receipt is being reviewed. Premium unlocks automatically once it's approved."
              : "Upload a donation receipt to unlock the Calculator, Forecast, Todo List, Timeline, and full data export."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isSupporter ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-chart-2/20 text-chart-2">
                <Check className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Active Supporter</p>
                {supporterSince ? (
                  <p className="text-xs text-muted-foreground">
                    Since {new Date(supporterSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                ) : null}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="self-start text-muted-foreground" disabled={pending} onClick={handleDisable}>
              Remove Supporter status
            </Button>
          </>
        ) : isPending ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Receipt under review</p>
              <p className="text-xs text-muted-foreground">We&apos;ll unlock premium as soon as an admin approves it.</p>
            </div>
          </div>
        ) : (
          <>
            {isRejected ? (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                  <X className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Previous receipt was declined</p>
                  <p className="text-xs text-muted-foreground">You can submit a new receipt below.</p>
                </div>
              </div>
            ) : null}
            <Paywall status={supporterStatus}>
              <Button>
                <Heart className="size-4" />
                {isRejected ? "Submit a new receipt" : "Become a Supporter"}
              </Button>
            </Paywall>
          </>
        )}
      </CardContent>
    </Card>
  )
}
