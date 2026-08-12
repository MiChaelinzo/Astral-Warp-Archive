import "server-only"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { createSession, getSession, deleteSession, getUserByEmail } from "./db"
import type { PublicUser, User } from "./types"

const COOKIE_NAME = "astral_session"
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30 // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function startSession(userId: string): Promise<void> {
  const token = nanoid(32)
  const expiresAt = Date.now() + SESSION_TTL
  await createSession(token, userId, expiresAt)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL / 1000,
  })
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token) await deleteSession(token)
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const session = await getSession(token)
  if (!session) return null
  const user = await getUserByEmail(session.userId)
  if (!user) return null
  return toPublic(user)
}

export function toPublic(user: User): PublicUser {
  return {
    email: user.email,
    displayName: user.displayName,
    uid: user.uid,
    uids: user.uids ?? {},
    isSupporter: user.isSupporter ?? false,
    supporterStatus: user.supporterStatus ?? (user.isSupporter ? "approved" : "none"),
    supporterSince: user.supporterSince,
    isAdmin: isAdminEmail(user.email),
    createdAt: user.createdAt,
  }
}

// Admins are configured via the ADMIN_EMAILS env var (comma-separated).
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(email.trim().toLowerCase())
}

// Returns the current user only if they are an admin, else null.
export async function getCurrentAdmin(): Promise<PublicUser | null> {
  const user = await getCurrentUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}
