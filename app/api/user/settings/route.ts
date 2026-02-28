import { NextResponse } from "next/server"
import { ensureSqliteInitialized } from "@/lib/db"
import type { SavePolicy, ThemePreference, UserSettings } from "@/lib/db/repository"
import { getSessionUser } from "@/lib/auth/server-user"

const VALID_POLICIES: SavePolicy[] = ["manual_only", "auto_interval", "on_level_complete", "on_exit"]
const VALID_THEMES: ThemePreference[] = ["light", "dark", "system"]

function unauthorized() {
  return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function defaultSettings(userId: string): UserSettings {
  return {
    userId,
    savePolicy: "manual_only",
    autoSaveSeconds: 0,
    saveChatHistory: true,
    saveSimulatorState: true,
    theme: "system",
  }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const repo = await ensureSqliteInitialized()
  const settings = (await repo.getUserSettings(user.id)) ?? defaultSettings(user.id)
  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return badRequest("Invalid JSON body.")
  }

  const repo = await ensureSqliteInitialized()
  const current = (await repo.getUserSettings(user.id)) ?? defaultSettings(user.id)
  const next: UserSettings = { ...current }

  if (payload.savePolicy !== undefined) {
    const policy = String(payload.savePolicy) as SavePolicy
    if (!VALID_POLICIES.includes(policy)) {
      return badRequest("Invalid savePolicy.")
    }
    next.savePolicy = policy
  }

  if (payload.autoSaveSeconds !== undefined) {
    const seconds = Math.max(0, Math.floor(Number(payload.autoSaveSeconds)))
    if (!Number.isFinite(seconds)) {
      return badRequest("autoSaveSeconds must be a number.")
    }
    next.autoSaveSeconds = seconds
  }

  if (payload.saveChatHistory !== undefined) {
    next.saveChatHistory = Boolean(payload.saveChatHistory)
  }

  if (payload.saveSimulatorState !== undefined) {
    next.saveSimulatorState = Boolean(payload.saveSimulatorState)
  }

  if (payload.theme !== undefined) {
    const theme = String(payload.theme) as ThemePreference
    if (!VALID_THEMES.includes(theme)) {
      return badRequest("theme must be light, dark, or system.")
    }
    next.theme = theme
  }

  await repo.upsertUserSettings(next)
  return NextResponse.json({ settings: next })
}
