import "server-only"
import type { GameProfile, ShowcaseCharacter } from "./types"
import { ProfileError } from "./profile-error"

const ENKA_UI = "https://enka.network/ui/"
const STORE = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/"

const UA = "AstralWarpArchive/1.0 (contact: support@astralwarp.app)"

/* ---------------- asset-map caching (in-memory, 6h) ---------------- */
type AnyMap = Record<string, any>
const cache = new Map<string, { data: AnyMap; at: number }>()
const SIX_HOURS = 6 * 60 * 60 * 1000

async function loadMap(path: string): Promise<AnyMap> {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < SIX_HOURS) return hit.data
  const res = await fetch(STORE + path, { next: { revalidate: 21600 } })
  if (!res.ok) throw new ProfileError("Could not load game asset data. Try again shortly.", 502)
  const data = (await res.json()) as AnyMap
  cache.set(path, { data, at: Date.now() })
  return data
}

async function enkaFetch(url: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", next: { revalidate: 300 } })
  } catch {
    throw new ProfileError("Could not reach the Enka profile service. Try again.", 502)
  }
  if (res.status === 404) {
    throw new ProfileError("No player found with that UID. Check the number and region.", 404)
  }
  if (res.status === 424) {
    throw new ProfileError("That account exists but has no public character showcase enabled.", 424)
  }
  if (res.status === 429) {
    throw new ProfileError("The profile service is rate-limited right now. Try again shortly.", 429)
  }
  if (!res.ok) {
    throw new ProfileError("The profile service is busy right now. Try again shortly.", res.status)
  }
  return res.json()
}

/* ====================== GENSHIN IMPACT ====================== */

const GENSHIN_ELEMENT_COLOR: Record<string, string> = {
  Fire: "#ef7a35",
  Water: "#3d9bd6",
  Wind: "#4cc2a0",
  Electric: "#a256c9",
  Grass: "#6fb12c",
  Ice: "#4cc4d6",
  Rock: "#d9a32a",
}

export async function fetchGenshinProfile(uid: string): Promise<GameProfile> {
  const clean = uid.trim()
  const [data, chars, loc] = await Promise.all([
    enkaFetch(`https://enka.network/api/uid/${clean}`),
    loadMap("characters.json"),
    loadMap("loc.json"),
  ])

  const info = data.playerInfo
  if (!info) throw new ProfileError("That UID has no public profile data.", 404)

  const en: Record<string, string> = loc.en || {}
  const detailed: any[] = data.avatarInfoList || []

  const characters: ShowcaseCharacter[] = detailed.map((a) => {
    const meta = chars[String(a.avatarId)] || {}
    const name = en[String(meta.NameTextMapHash)] || "Traveler"
    const side: string = meta.SideIconName || ""
    const iconBase = side.replace("_Side", "")
    const gacha = iconBase.replace("UI_AvatarIcon_", "UI_Gacha_AvatarImg_")
    const element: string = meta.Element || ""
    const level = Number(a.propMap?.["4001"]?.val ?? a.propMap?.["4001"]?.ival ?? 0)
    const constellation = (a.talentIdList || []).length
    return {
      id: String(a.avatarId),
      name,
      rarity: meta.QualityType === "QUALITY_PURPLE" ? 4 : 5,
      level,
      rank: constellation,
      icon: iconBase ? `${ENKA_UI}${iconBase}.png` : "",
      portrait: gacha ? `${ENKA_UI}${gacha}.png` : "",
      element,
      elementColor: GENSHIN_ELEMENT_COLOR[element] || "#888",
      elementIcon: "",
      path: element,
      pathIcon: "",
    }
  })

  const pfpMeta = chars[String(info.profilePicture?.avatarId)] || {}
  const pfpSide: string = pfpMeta.SideIconName || ""
  const avatarIcon = pfpSide ? `${ENKA_UI}${pfpSide.replace("_Side", "")}.png` : ""

  return {
    gameId: "genshin",
    uid: clean,
    nickname: info.nickname || "Traveler",
    level: info.level || 0,
    worldLevel: info.worldLevel || 0,
    signature: info.signature || "",
    avatarIcon,
    friendCount: 0,
    stats: [
      { label: "Adventure Rank", value: info.level || 0 },
      { label: "World Level", value: info.worldLevel || 0 },
      { label: "Achievements", value: info.finishAchievementNum || 0 },
      { label: "Abyss", value: info.towerFloorIndex ? `${info.towerFloorIndex}-${info.towerLevelIndex || 0}` : "—" },
      { label: "Showcase", value: characters.length },
    ],
    characters,
    fetchedAt: Date.now(),
  }
}

/* ====================== ZENLESS ZONE ZERO ====================== */

const ZZZ_ELEMENT_COLOR: Record<string, string> = {
  Physical: "#d9d04a",
  Fire: "#ef5a3a",
  Ice: "#5ec6e8",
  Electric: "#b070e0",
  Ether: "#e85aa8",
}

export async function fetchZzzProfile(uid: string): Promise<GameProfile> {
  const clean = uid.trim()
  const [data, avatars] = await Promise.all([
    enkaFetch(`https://enka.network/api/zzz/uid/${clean}`),
    loadMap("zzz/avatars.json"),
  ])

  // ZZZ payload nests under PlayerInfo / SocialDetail
  const social = data.PlayerInfo?.SocialDetail || data.SocialDetail || {}
  const profileDetail = social.ProfileDetail || data.PlayerInfo?.ProfileDetail || {}
  const showcase = data.PlayerInfo?.ShowcaseDetail?.AvatarList || []

  if (!profileDetail && !showcase.length) {
    throw new ProfileError("That UID has no public profile data.", 404)
  }

  const characters: ShowcaseCharacter[] = showcase.map((a: any) => {
    const meta = avatars[String(a.Id)] || {}
    const elements: string[] = meta.ElementTypes || []
    const element = elements[0] || ""
    const colors = meta.Colors || {}
    const img = meta.Image ? `https://enka.network${meta.Image}` : ""
    const circle = meta.CircleIcon ? `https://enka.network${meta.CircleIcon}` : img
    // strip internal prefix from the name key for a clean fallback
    const rawName: string = meta.Name || `Agent ${a.Id}`
    const name = rawName.replace(/^Avatar_(Female|Male)_Size\d+_/, "")
    return {
      id: String(a.Id),
      name,
      rarity: meta.Rarity === 4 ? 4 : meta.Rarity === 3 ? 3 : 5,
      level: a.Level || 0,
      rank: a.TalentLevel || 0, // mindscape cinema level
      icon: circle,
      portrait: img,
      element,
      elementColor: colors.Accent || ZZZ_ELEMENT_COLOR[element] || "#888",
      elementIcon: "",
      path: meta.ProfessionType || "",
      pathIcon: "",
    }
  })

  const level = profileDetail.Level || 0
  return {
    gameId: "zzz",
    uid: clean,
    nickname: profileDetail.Nickname || "Proxy",
    level,
    worldLevel: 0,
    signature: social.Desc || "",
    avatarIcon: "",
    friendCount: 0,
    stats: [
      { label: "Inter-Knot Lv.", value: level },
      { label: "Agents Shown", value: characters.length },
    ],
    characters,
    fetchedAt: Date.now(),
  }
}
