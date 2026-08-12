"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth"
import { getReceipt, setSupporter, updateReceiptStatus } from "@/lib/db"

export type SupporterState = { error?: string; success?: string } | undefined

// Lets a Supporter voluntarily remove their own status.
export async function disableSupporter(): Promise<SupporterState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }
  await setSupporter(user.email, false, "none")
  revalidatePath("/", "layout")
  return { success: "Supporter status removed." }
}

// Note: receipt uploads are handled by the POST route at /api/receipt (route
// handlers have no 1 MB body cap, unlike Server Actions).

// Admin approves a receipt: unlocks Supporter for the submitter.
export async function approveReceipt(submittedAt: number, id: string): Promise<SupporterState> {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Not authorized." }
  const receipt = await getReceipt(submittedAt, id)
  if (!receipt) return { error: "Receipt not found." }
  await updateReceiptStatus(submittedAt, id, "approved", admin.email)
  await setSupporter(receipt.email, true, "approved")
  revalidatePath("/admin/receipts")
  revalidatePath("/", "layout")
  return { success: `Approved — ${receipt.displayName} is now a Supporter.` }
}

// Admin rejects a receipt with an optional reason. The user may resubmit.
export async function rejectReceipt(submittedAt: number, id: string, reason: string): Promise<SupporterState> {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Not authorized." }
  const receipt = await getReceipt(submittedAt, id)
  if (!receipt) return { error: "Receipt not found." }
  await updateReceiptStatus(submittedAt, id, "rejected", admin.email, reason)
  await setSupporter(receipt.email, false, "rejected")
  revalidatePath("/admin/receipts")
  revalidatePath("/", "layout")
  return { success: `Rejected ${receipt.displayName}'s submission.` }
}
