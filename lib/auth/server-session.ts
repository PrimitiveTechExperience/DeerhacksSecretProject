import type { AuthSession } from "@/lib/auth/types"

const SESSION_COOKIE = "cc_session"

function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url")
}

function decodeSession(value: string | undefined): AuthSession {
  if (!value) return { user: null }
  try {
    const raw = Buffer.from(value, "base64url").toString("utf8")
    const parsed = JSON.parse(raw) as AuthSession
    return parsed?.user ? parsed : { user: null }
  } catch {
    return { user: null }
  }
}

export function readSessionFromCookie(cookieValue: string | undefined): AuthSession {
  return decodeSession(cookieValue)
}

export function writeSessionCookie(session: AuthSession) {
  return {
    name: SESSION_COOKIE,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  }
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

