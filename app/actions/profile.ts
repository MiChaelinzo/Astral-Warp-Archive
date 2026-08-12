"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { saveGameProfile, updateUserGameUid } from "@/lib/db"
import { fetchProfile, validateUid, ProfileError } from "@/lib/profile"
import { getGame, isGameId } from "@/lib/games"

export type SyncState = { error?: string; success?: string } | undefined

/**
 * Auto-import a player's public account for a given game (Mihomo for HSR,
 * Enka for Genshin/ZZZ), cache it in DynamoDB, and link the UID to their account.
 */
export async function syncProfile(_prev: SyncState, formData: FormData): Promise<SyncState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in." }

  const game = String(formData.get("game") || "")
  if (!isGameId(game)) return { error: "Invalid game." }
  const def = getGame(game)

  if (def.importProvider === "none") {
    return { error: `${def.name} has no public profile API — track pulls manually.` }
  }

  const uid = String(formData.get("uid") || "").trim()
  if (!validateUid(game, uid)) return { error: `Enter a valid ${def.uidLength}-digit ${def.short} UID.` }

  try {
    const profile = await fetchProfile(game, uid)
    await saveGameProfile(user.email, profile)
    await updateUserGameUid(user.email, game, uid)
    revalidatePath("/dashboard")
    return {
      success: `Synced ${profile.nickname} (Lv.${profile.level}) — ${profile.characters.length} characters imported.`,
    }
  } catch (err) {
    if (err instanceof ProfileError) return { error: err.message }
    return { error: "Could not import your profile. Please try again." }
  }
}
