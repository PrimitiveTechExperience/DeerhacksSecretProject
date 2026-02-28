"use client"

import Link from "next/link"
import { LogOut, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"

export function AuthButtons() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="text-xs" disabled>
        Loading...
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild size="sm" className="font-display text-xs">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground">
        <UserRound className="size-3" />
        {user.name}
      </span>
      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => void logout()}>
        <LogOut className="size-3.5" />
        Logout
      </Button>
    </div>
  )
}

