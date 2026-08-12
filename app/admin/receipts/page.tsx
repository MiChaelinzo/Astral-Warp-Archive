import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth"
import { listReceipts } from "@/lib/db"
import { resolvePageContext } from "@/lib/page-context"
import { AppShell } from "@/components/app-shell"
import { ReceiptReviewCard } from "@/components/receipt-review-card"
import { CardDescription } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"

export default async function AdminReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const admin = await getCurrentAdmin()
  if (!admin) redirect("/dashboard")

  const { gameId } = await resolvePageContext(searchParams)
  const receipts = await listReceipts()
  const pending = receipts.filter((r) => r.status === "pending")
  const reviewed = receipts.filter((r) => r.status !== "pending")

  return (
    <AppShell
      gameId={gameId}
      displayName={user.displayName}
      isSupporter={!!user.isSupporter}
      supporterStatus={user.supporterStatus}
      isAdmin={user.isAdmin}
    >
      <div className="starfield min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold">Receipt Review</h1>
              <CardDescription>Approve or reject Supporter payment receipts.</CardDescription>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold">
              Pending {pending.length > 0 ? <span className="text-primary">({pending.length})</span> : null}
            </h2>
            {pending.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                No receipts waiting for review.
              </p>
            ) : (
              pending.map((r) => <ReceiptReviewCard key={r.id} receipt={r} />)
            )}
          </section>

          {reviewed.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold text-muted-foreground">Reviewed</h2>
              {reviewed.map((r) => (
                <ReceiptReviewCard key={r.id} receipt={r} />
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
