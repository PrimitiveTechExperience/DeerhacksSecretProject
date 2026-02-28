import type { AuthSession } from "@/lib/auth/types"

const AUTH0_STATE_COOKIE = "cc_auth0_state"

interface Auth0Env {
  domain: string
  clientId: string
  clientSecret: string
  appBaseUrl: string
}

export function getAuth0Env(): Auth0Env | null {
  const domain = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_CLIENT_ID
  const clientSecret = process.env.AUTH0_CLIENT_SECRET
  const appBaseUrl = process.env.AUTH0_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!domain || !clientId || !clientSecret || !appBaseUrl) return null
  return { domain, clientId, clientSecret, appBaseUrl }
}

export function createAuth0State(): string {
  return `${crypto.randomUUID()}_${Date.now()}`
}

export function writeAuth0StateCookie(state: string) {
  return {
    name: AUTH0_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  }
}

export function clearAuth0StateCookie() {
  return {
    name: AUTH0_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  }
}

export function getAuth0StateCookieName() {
  return AUTH0_STATE_COOKIE
}

export function buildAuth0AuthorizeUrl(args: {
  env: Auth0Env
  state: string
  screenHint?: "signup"
}) {
  const redirectUri = `${args.env.appBaseUrl}/api/auth/callback`
  const url = new URL(`https://${args.env.domain}/authorize`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", args.env.clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", "openid profile email")
  url.searchParams.set("state", args.state)
  if (args.screenHint === "signup") {
    url.searchParams.set("screen_hint", "signup")
  }
  return url.toString()
}

export async function exchangeCodeForSession(env: Auth0Env, code: string): Promise<AuthSession | null> {
  const tokenRes = await fetch(`https://${env.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: env.clientId,
      client_secret: env.clientSecret,
      code,
      redirect_uri: `${env.appBaseUrl}/api/auth/callback`,
    }),
  })
  if (!tokenRes.ok) return null
  const tokenData = await tokenRes.json()
  const accessToken = tokenData?.access_token as string | undefined
  if (!accessToken) return null

  const userInfoRes = await fetch(`https://${env.domain}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!userInfoRes.ok) return null
  const userInfo = await userInfoRes.json()
  const sub = String(userInfo?.sub ?? "")
  const email = String(userInfo?.email ?? "")
  const name = String(userInfo?.name ?? email.split("@")[0] ?? "User")
  if (!sub || !email) return null

  return {
    user: {
      id: `auth0_${sub}`,
      email,
      name,
      provider: "auth0",
    },
  }
}

export function buildAuth0LogoutUrl(env: Auth0Env) {
  const url = new URL(`https://${env.domain}/v2/logout`)
  url.searchParams.set("client_id", env.clientId)
  url.searchParams.set("returnTo", `${env.appBaseUrl}/`)
  return url.toString()
}

