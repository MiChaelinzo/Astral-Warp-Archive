import "server-only"
import type { GameProfile } from "./types"
import { getGame, type GameId } from "./games"
import { fetchHsrProfile } from "./mihomo"
import { fetchGenshinProfile, fetchZzzProfile } from "./enka"
import { ProfileError, isValidUidFor } from "./profile-error"

export { ProfileError }

export function validateUid(game: GameId, uid: string): boolean {
  return isValidUidFor(uid, getGame(game).uidLength)
}

/**
 * Import a player's PUBLIC profile for a given game.
 * Routes to the correct provider (Mihomo for HSR, Enka for Genshin/ZZZ).
 * HI3 has no public API and is manual-only.
 */
export async function fetchProfile(game: GameId, uid: string): Promise<GameProfile> {
  const def = getGame(game)
  if (!validateUid(game, uid)) {
    throw new ProfileError(`Enter a valid ${def.uidLength}-digit ${def.short} UID.`, 400)
  }
  switch (def.importProvider) {
    case "mihomo":
      return fetchHsrProfile(uid)
    case "enka-genshin":
      return fetchGenshinProfile(uid)
    case "enka-zzz":
      return fetchZzzProfile(uid)
    default:
      throw new ProfileError(`${def.name} does not support public profile import.`, 400)
  }
}
