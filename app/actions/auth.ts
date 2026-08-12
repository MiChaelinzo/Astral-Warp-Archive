"use server"

import { redirect } from "next/navigation"
import { createUser, getUserByEmail, saveUserStats, saveGameProfile } from "@/lib/db"
import { hashPassword, verifyPassword, startSession, endSession } from "@/lib/auth"
import { buildUserStats } from "@/lib/warp-stats"
import { fetchProfile, validateUid } from "@/lib/profile"
import { GAME_IDS } from "@/lib/games"

export type AuthState = { error?: string } | undefined

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const displayName = String(formData.get("displayName") || "").trim()
  const uid = String(formData.get("uid") || "").trim()

  if (!isValidEmail(email)) return { error: "Please enter a valid email address." }
  if (password.length < 6) return { error: "Password must be at least 6 characters." }
  if (displayName.length < 2) return { error: "Display name must be at least 2 characters." }

  const existing = await getUserByEmail(email)
  if (existing) return { error: "An account with this email already exists." }

  const passwordHash = await hashPassword(password)
  const id = `USER#${email}`
  try {
    await createUser({
      id,
      email,
      passwordHash,
      displayName,
      uid,
      uids: uid ? { hsr: uid } : {},
      createdAt: Date.now(),
    })
    // seed an empty public stats row per game so the trailblazer shows up in every directory
    await Promise.all(GAME_IDS.map((g) => saveUserStats(buildUserStats(email, g, displayName, g === "hsr" ? uid : "", []))))
    // if a valid HSR UID was provided, auto-import their public profile (best-effort)
    if (validateUid("hsr", uid)) {
      try {
        const profile = await fetchProfile("hsr", uid)
        await saveGameProfile(email, profile)
      } catch {
        // non-fatal: the player can sync manually from the dashboard later
      }
    }
  } catch {
    return { error: "Could not create account. Please try again." }
  }

  await startSession(email)
  redirect("/dashboard")
}

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")

  if (!isValidEmail(email) || !password) return { error: "Invalid email or password." }

  const user = await getUserByEmail(email)
  if (!user) return { error: "Invalid email or password." }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return { error: "Invalid email or password." }

  await startSession(email)
  redirect("/dashboard")
}

export async function logOut(): Promise<void> {
  await endSession()
  redirect("/login")
}
