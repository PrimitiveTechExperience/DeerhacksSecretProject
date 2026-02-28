"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth/auth-provider"

interface SettingsResponse {
  settings?: {
    theme?: string
  }
}

export function UserThemeSync() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function syncTheme() {
      try {
        const res = await fetch("/api/user/settings", { cache: "no-store" })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as SettingsResponse
        const theme = data.settings?.theme
        if (
          !theme ||
          cancelled ||
          (theme !== "light" && theme !== "dark" && theme !== "system")
        ) {
          return
        }
        setTheme(theme)
      } catch {
        // Ignore network/auth errors; local preference stays in place.
      }
    }

    if (user) {
      if (lastUserId.current !== user.id) {
        lastUserId.current = user.id
        void syncTheme()
      }
    } else {
      lastUserId.current = null
    }

    return () => {
      cancelled = true
    }
  }, [user, setTheme])

  return null
}
