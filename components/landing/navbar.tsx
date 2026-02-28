"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButtons } from "@/components/auth/auth-buttons"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-colors hover:text-primary"
        >
          {/* Custom robot arm icon */}
          <svg
            viewBox="0 0 24 24"
            className="size-6 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 20 C12 16, 10 14, 7 10" />
            <path d="M7 10 C5 7, 4 5, 6 3" />
            <circle cx="6" cy="3" r="1.5" fill="currentColor" />
            <circle cx="7" cy="10" r="1" fill="currentColor" />
            <rect x="10" y="19" width="4" height="3" rx="0.5" />
          </svg>
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            continuum<span className="text-primary">coach</span>
          </span>
        </Link>

        <div className="ml-auto flex flex-1 items-center justify-end gap-3">
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <a href="#features">Features</a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <a href="#how-it-works">How It Works</a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Link href="/intro">Intro</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Link href="/learn">Learning Map</Link>
            </Button>
            <ThemeToggle />
            <Button asChild size="sm" className="glow-sm font-display font-semibold">
              <Link href="/simulator">Launch Sim</Link>
            </Button>
          </div>
          <div className="ml-2 border-l border-border/60 pl-3">
            <AuthButtons />
          </div>
        </div>
      </nav>
    </header>
  )
}
