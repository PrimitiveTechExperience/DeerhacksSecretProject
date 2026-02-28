import { NextRequest, NextResponse } from "next/server"
import { AUTH_PROVIDER } from "@/lib/auth/config"
import { writeSessionCookie } from "@/lib/auth/server-session"
import { buildAuth0AuthorizeUrl, createAuth0State, getAuth0Env, writeAuth0StateCookie } from "@/lib/auth/auth0-server"

export async function GET(request: NextRequest) {
  if (AUTH_PROVIDER !== "auth0") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const env = getAuth0Env()
  if (!env) {
    return NextResponse.json(
      { error: "Auth0 env missing. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_BASE_URL." },
      { status: 500 }
    )
  }

  const state = createAuth0State()
  const authorizeUrl = buildAuth0AuthorizeUrl({ env, state })
  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(writeAuth0StateCookie(state))
  return response
}

export async function POST(request: NextRequest) {
  if (AUTH_PROVIDER === "auth0") {
    return NextResponse.json(
      { error: "Auth0 mode enabled. Use GET /api/auth/login for redirect flow." },
      { status: 400 }
    )
  }

  const body = await request.json()
  const email = String(body?.email ?? "").trim().toLowerCase()
  const password = String(body?.password ?? "")

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  const session = {
    user: {
      id: `local_${email}`,
      email,
      name: email.split("@")[0] || "User",
      provider: "local" as const,
    },
  }

  const response = NextResponse.json(session)
  response.cookies.set(writeSessionCookie(session))
  return response
}
