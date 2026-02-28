import type { AuthAdapter, AuthSession } from "@/lib/auth/types"
import { AUTH_PROVIDER } from "@/lib/auth/config"

async function jsonOrThrow(res: Response): Promise<AuthSession> {
  const data = (await res.json()) as AuthSession
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? "Auth request failed"
    throw new Error(message)
  }
  return data
}

const localAdapter: AuthAdapter = {
  async getSession() {
    const res = await fetch("/api/auth/session", { cache: "no-store" })
    return jsonOrThrow(res)
  },
  async login(email, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return jsonOrThrow(res)
  },
  async signup(name, email, password) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    return jsonOrThrow(res)
  },
  async logout() {
    const res = await fetch("/api/auth/logout", { method: "POST" })
    if (!res.ok) throw new Error("Logout failed")
  },
}

const auth0Adapter: AuthAdapter = {
  async getSession() {
    return localAdapter.getSession()
  },
  async login() {
    if (typeof window !== "undefined") {
      window.location.assign("/api/auth/login")
    }
    return { user: null }
  },
  async signup() {
    if (typeof window !== "undefined") {
      window.location.assign("/api/auth/signup")
    }
    return { user: null }
  },
  async logout() {
    if (typeof window !== "undefined") {
      window.location.assign("/api/auth/logout")
      return
    }
  },
}

export const authClient: AuthAdapter = AUTH_PROVIDER === "auth0" ? auth0Adapter : localAdapter
