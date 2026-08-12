import { redirect } from "next/navigation"
import { getCurrentUser } from "./auth"
import { getGame, isGameId, type GameId, type GameDef } from "./games"
import type { PublicUser } from "./types"

export interface GameContext {
  user: PublicUser
  gameId: GameId
  game: GameDef
  uid: string
}

/**
 * Shared loader for every authed in-app page: resolves the signed-in user and
 * the active game from the ?game= query param (defaulting to HSR).
 */
export async function requireGameContext(
  searchParams: Promise<{ game?: string }>,
): Promise<GameContext> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const sp = await searchParams
  const gameId: GameId = isGameId(sp.game || "") ? (sp.game as GameId) : "hsr"
  const game = getGame(gameId)
  const uid = user.uids?.[gameId] || (gameId === "hsr" ? user.uid : "") || ""
  return { user, gameId, game, uid }
}

/**
 * Lightweight resolver for pages that handle their own auth: returns only the
 * active gameId from the ?game= query param (defaulting to HSR).
 */
export async function resolvePageContext(
  searchParams: Promise<{ game?: string }>,
): Promise<{ gameId: GameId }> {
  const sp = await searchParams
  const gameId: GameId = isGameId(sp.game || "") ? (sp.game as GameId) : "hsr"
  return { gameId }
}
