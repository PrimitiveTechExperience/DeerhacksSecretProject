"use client"

import { useCallback } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

async function persistThemePreference(theme: "light" | "dark") {
  try {
    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    })
  } catch {
    // Silently ignore when the user is not authenticated or offline.
  }
}

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const handleToggle = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    void persistThemePreference(nextTheme)
  }, [resolvedTheme, setTheme])

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle} className="relative">
      <Sun className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
