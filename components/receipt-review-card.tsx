"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { approveReceipt, rejectReceipt } from "@/app/actions/supporter"
import type { ReceiptSubmission } from "@/lib/types"
import { Check, X, ExternalLink, FileText } from "lucide-react"

function StatusBadge({ status }: { status: ReceiptSubmission["status"] }) {
  if (status === "approved") return <Badge className="bg-chart-2/20 text-chart-2">Approved</Badge>
  if (status === "rejected") return <Badge className="bg-destructive/20 text-destructive">Rejected</Badge>
  return <Badge className="bg-primary/20 text-primary">Pending</Badge>
}

export function ReceiptReviewCard({ receipt }: { receipt: ReceiptSubmission }) {
  const [pending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const router = useRouter()

  const isImage = receipt.contentType.startsWith("image/")
  const fileUrl = `/api/receipt?submittedAt=${receipt.submittedAt}&id=${receipt.id}`

  function handleApprove() {
    startTransition(async () => {
      const res = await approveReceipt(receipt.submittedAt, receipt.id)
      if (res?.success) {
        toast.success(res.success)
        router.refresh()
      } else {
        toast.error(res?.error || "Something went wrong.")
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectReceipt(receipt.submittedAt, receipt.id, reason.trim())
      if (res?.success) {
        toast.success(res.success)
        setRejecting(false)
        setReason("")
        router.refresh()
      } else {
        toast.error(res?.error || "Something went wrong.")
      }
    })
  }

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        {/* Preview */}
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-secondary/40"
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl || "/placeholder.svg"} alt={`Receipt from ${receipt.displayName}`} className="size-full object-cover" />
          ) : (
            <FileText className="size-8 text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
            <ExternalLink className="size-5" />
          </span>
        </a>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-sm font-semibold">{receipt.displayName}</p>
            <StatusBadge status={receipt.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{receipt.email}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Via <span className="text-foreground">{receipt.provider}</span>
            </span>
            {receipt.amount ? (
              <span>
                Amount <span className="text-foreground">{receipt.amount}</span>
              </span>
            ) : null}
            <span>{new Date(receipt.submittedAt).toLocaleString()}</span>
          </div>
          {receipt.note ? <p className="text-xs text-muted-foreground">&ldquo;{receipt.note}&rdquo;</p> : null}
          {receipt.status === "rejected" && receipt.reviewNote ? (
            <p className="text-xs text-destructive">Reason: {receipt.reviewNote}</p>
          ) : null}

          {receipt.status === "pending" ? (
            rejecting ? (
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={pending} onClick={handleReject}>
                    Confirm reject
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex gap-2">
                <Button size="sm" disabled={pending} onClick={handleApprove}>
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
                  <X className="size-4" />
                  Reject
                </Button>
              </div>
            )
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
