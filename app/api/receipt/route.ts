import { type NextRequest, NextResponse } from "next/server"
import { get, put } from "@vercel/blob"
import { nanoid } from "nanoid"
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth"
import { createReceipt, setSupporter } from "@/lib/db"
import type { ReceiptSubmission } from "@/lib/types"

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]

// A user submits a payment receipt to claim Supporter. Uploading is done via a
// route handler (not a Server Action) so large files aren't capped at 1 MB.
// This does NOT grant access — it creates a pending submission for admin review.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  if (user.supporterStatus === "approved") return NextResponse.json({ error: "You're already a Supporter." }, { status: 400 })
  if (user.supporterStatus === "pending")
    return NextResponse.json({ error: "You already have a receipt awaiting review." }, { status: 400 })

  const formData = await request.formData()
  const file = formData.get("receipt")
  const provider = String(formData.get("provider") ?? "").trim() || "Other"
  const amount = String(formData.get("amount") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()

  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Please attach your receipt file." }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is too large (max 8 MB)." }, { status: 400 })
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Use a PNG, JPG, WebP, GIF, or PDF file." }, { status: 400 })

  const id = nanoid(12)
  const submittedAt = Date.now()
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ""

  let pathname: string
  try {
    const blob = await put(`receipts/${user.email}/${id}${ext}`, file, {
      access: "private",
      addRandomSuffix: true,
    })
    pathname = blob.pathname
  } catch (err) {
    console.log("[v0] receipt upload failed:", err)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }

  const receipt: ReceiptSubmission = {
    id,
    email: user.email,
    displayName: user.displayName,
    pathname,
    filename: file.name,
    contentType: file.type,
    provider,
    amount: amount || undefined,
    note: note || undefined,
    status: "pending",
    submittedAt,
  }

  await createReceipt(receipt)
  await setSupporter(user.email, false, "pending")

  return NextResponse.json({ success: "Receipt submitted! We'll review it and unlock Supporter once verified." })
}

// Serves a private receipt blob, but only to authenticated admins.
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!pathname) return NextResponse.json({ error: "Missing pathname" }, { status: 400 })

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })
    if (!result) return new NextResponse("Not found", { status: 404 })

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (err) {
    console.log("[v0] receipt serve failed:", err)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
