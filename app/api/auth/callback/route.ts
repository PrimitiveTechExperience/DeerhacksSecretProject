import { NextRequest, NextResponse } from "next/server"
import { AUTH_PROVIDER } from "@/lib/auth/config"
import { writeSessionCookie } from "@/lib/auth/server-session"
import {
  clearAuth0StateCookie,
  exchangeCodeForSession,
  getAuth0Env,
  getAuth0StateCookieName,
} from "@/lib/auth/auth0-server"
import { ensureSqliteInitialized } from "@/lib/db"

export async function GET(request: NextRequest) {
  if (AUTH_PROVIDER !== "auth0") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const env = getAuth0Env()
  if (!env) {
    return NextResponse.redirect(new URL("/login?error=auth0_env", request.url))
  }

  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const expectedState = request.cookies.get(getAuth0StateCookieName())?.value

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url))
  }

  const session = await exchangeCodeForSession(env, code)
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login?error=token_exchange", request.url))
  }

  const repo = await ensureSqliteInitialized()
  const providerSubject = session.user.id.startsWith("auth0_")
    ? session.user.id.slice("auth0_".length)
    : session.user.id
  await repo.upsertUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    authProvider: "auth0",
    providerSubject,
  })

  const response = NextResponse.redirect(new URL("/learn", request.url))
  response.cookies.set(writeSessionCookie(session))
  response.cookies.set(clearAuth0StateCookie())
  return response
}
