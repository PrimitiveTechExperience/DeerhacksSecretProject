import { NextRequest, NextResponse } from "next/server"
import { AUTH_PROVIDER } from "@/lib/auth/config"
import { clearSessionCookie } from "@/lib/auth/server-session"
import { buildAuth0LogoutUrl, getAuth0Env } from "@/lib/auth/auth0-server"

export async function GET(request: NextRequest) {
  const baseResponse = NextResponse.redirect(new URL("/", request.url))
  baseResponse.cookies.set(clearSessionCookie())

  if (AUTH_PROVIDER !== "auth0") return baseResponse

  const env = getAuth0Env()
  if (!env) return baseResponse

  const response = NextResponse.redirect(buildAuth0LogoutUrl(env))
  response.cookies.set(clearSessionCookie())
  return response
}

export async function POST(request: NextRequest) {
  if (AUTH_PROVIDER === "auth0") {
    return NextResponse.json(
      { error: "Auth0 mode enabled. Use GET /api/auth/logout for redirect flow." },
      { status: 400 }
    )
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(clearSessionCookie())
  return response
}

