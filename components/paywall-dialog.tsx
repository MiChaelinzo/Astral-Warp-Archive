"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PAYPAL_URL, PREMIUM_FEATURES } from "@/lib/premium"
import type { SupporterStatus } from "@/lib/types"
import { Heart, ExternalLink, Check, Sparkles, Loader2, Upload, Clock } from "lucide-react"

const PROVIDERS = ["PayPal", "Ko-fi", "Buy Me a Coffee", "Stripe", "Other"]

export function Paywall({
  children,
  defaultOpen = false,
  status = "none",
}: {
  children?: React.ReactNode
  defaultOpen?: boolean
  status?: SupporterStatus
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get("receipt") as File | null
    if (!file || file.size === 0) {
      toast.error("Please choose a receipt file.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File is too large (max 8 MB).")
      return
    }
    setPending(true)
    try {
      const res = await fetch("/api/receipt", { method: "POST", body: formData })
      const data = (await res.json().catch(() => ({}))) as { success?: string; error?: string }
      if (!res.ok || data.error) {
        toast.error(data.error || "Upload failed. Please try again.")
        return
      }
      toast.success(data.success || "Receipt submitted for review.")
      form.reset()
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Upload failed. Please check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  const isPending = status === "pending"

  return (
    <>
      {children && (
        <span onClick={() => setOpen(true)} className="contents">
          {children}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="size-6" />
            </div>
            <DialogTitle className="text-center font-heading text-xl">Become a Supporter</DialogTitle>
            <DialogDescription className="text-center text-pretty">
              Astral Warp Archive is built and run by one developer. Donate any amount, then upload your receipt — we
              verify it and unlock every premium tool for good.
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div className="my-2 flex flex-col items-center gap-3 rounded-lg border border-chart-4/40 bg-chart-4/10 px-4 py-6 text-center">
              <Clock className="size-8 text-chart-4" />
              <div>
                <p className="text-sm font-semibold">Receipt under review</p>
                <p className="text-xs text-muted-foreground">
                  Thanks! We&apos;ve got your receipt and will unlock Supporter as soon as it&apos;s verified.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ul className="my-2 flex flex-col gap-2.5">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium leading-tight">{f.title}</p>
                      <p className="text-xs leading-snug text-muted-foreground">{f.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Button
                render={<a href={PAYPAL_URL} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                className="w-full"
              >
                <Heart className="size-4" />
                Step 1 — Donate via PayPal
                <ExternalLink className="size-3.5 opacity-70" />
              </Button>

              <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3">
                <p className="text-sm font-medium">Step 2 — Upload your receipt</p>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="receipt">Receipt file</Label>
                  <Input
                    id="receipt"
                    name="receipt"
                    type="file"
                    required
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    className="file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, GIF, or PDF · max 8 MB</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="provider">Paid with</Label>
                    <select
                      id="provider"
                      name="provider"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      defaultValue="PayPal"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" placeholder="e.g. $5.00" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea id="note" name="note" rows={2} placeholder="Transaction ID or anything that helps us verify." />
                </div>

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {pending ? "Submitting…" : "Submit receipt for review"}
                </Button>
                <p className="text-center text-[11px] leading-snug text-muted-foreground">
                  Your receipt is stored privately and only visible to admins for verification.
                </p>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
