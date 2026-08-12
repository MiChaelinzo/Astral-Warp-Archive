import "server-only"
import type { GameProfile, ShowcaseCharacter } from "./types"
import { ProfileError } from "./profile-error"

const CDN = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/"

function asset(path: string | undefined): string {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return CDN + path.replace(/^\/+/, "")
}

/**
 * Fetch a player's PUBLIC Honkai: Star Rail profile from the Mihomo API.
 * Uses only the in-game UID (no auth). Cannot access private warp history.
 */
export async function fetchHsrProfile(uid: string): Promise<GameProfile> {
  const clean = uid.trim()

  let res: Response
  try {
    res = await fetch(`https://api.mihomo.me/sr_info_parsed/${clean}?lang=en`, {
      headers: { "User-Agent": "AstralWarpArchive/1.0" },
      next: { revalidate: 300 },
    })
  } catch {
    throw new ProfileError("Could not reach the HoYoverse profile service. Try again.", 502)
  }

  if (res.status === 404) {
    throw new ProfileError("No player found with that UID. Check the number and region.", 404)
  }
  if (!res.ok) {
    throw new ProfileError("The profile service is busy right now. Try again shortly.", res.status)
  }

  const data = (await res.json()) as MihomoResponse
  if (!data?.player?.uid) {
    throw new ProfileError("That UID has no public profile data.", 404)
  }

  const p = data.player
  const characters: ShowcaseCharacter[] = (data.characters || []).map((c) => ({
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    level: c.level,
    rank: c.rank ?? 0,
    icon: asset(c.icon),
    portrait: asset(c.portrait || c.preview),
    element: c.element?.name ?? "",
    elementColor: c.element?.color ?? "#888",
    elementIcon: asset(c.element?.icon),
    path: c.path?.name ?? "",
    pathIcon: asset(c.path?.icon),
  }))

  const s = p.space_info
  return {
    gameId: "hsr",
    uid: p.uid,
    nickname: p.nickname ?? "Trailblazer",
    level: p.level ?? 0,
    worldLevel: p.world_level ?? 0,
    signature: p.signature ?? "",
    avatarIcon: asset(p.avatar?.icon),
    friendCount: p.friend_count ?? 0,
    stats: [
      { label: "Achievements", value: s?.achievement_count ?? 0 },
      { label: "Characters", value: s?.avatar_count ?? 0 },
      { label: "Light Cones", value: s?.light_cone_count ?? 0 },
      { label: "Relics", value: s?.relic_count ?? 0 },
      { label: "Books", value: s?.book_count ?? 0 },
    ],
    characters,
    fetchedAt: Date.now(),
  }
}

/* ---- minimal shape of the upstream response we rely on ---- */
interface MihomoResponse {
  player?: {
    uid: string
    nickname?: string
    level?: number
    world_level?: number
    friend_count?: number
    signature?: string
    avatar?: { icon?: string }
    space_info?: {
      universe_level?: number
      avatar_count?: number
      light_cone_count?: number
      relic_count?: number
      achievement_count?: number
      book_count?: number
    }
  }
  characters?: Array<{
    id: string
    name: string
    rarity: number
    level: number
    rank?: number
    icon?: string
    preview?: string
    portrait?: string
    element?: { name?: string; color?: string; icon?: string }
    path?: { name?: string; icon?: string }
  }>
}
