import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getGameWarpRecords } from "@/lib/db"
import { buildUigfExport, buildCsvExport } from "@/lib/uigf"
import { isGameId, type GameId } from "@/lib/games"

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const game = searchParams.get("game") || ""
  const format = (searchParams.get("format") || "uigf").toLowerCase()
  if (!isGameId(game)) return NextResponse.json({ error: "Invalid game" }, { status: 400 })

  const records = await getGameWarpRecords(user.email, game as GameId)
  const uid = user.uids?.[game as GameId] || (game === "hsr" ? user.uid : "") || "0"
  const stamp = new Date().toISOString().slice(0, 10)

  if (format === "csv") {
    const csv = buildCsvExport(game as GameId, records)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="astral-${game}-${stamp}.csv"`,
      },
    })
  }

  if (format === "uigf") {
    let json: object
    try {
      json = buildUigfExport(game as GameId, uid, records)
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Export failed" }, { status: 400 })
    }
    return new NextResponse(JSON.stringify(json, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="astral-${game}-uigf-${stamp}.json"`,
      },
    })
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 })
}
