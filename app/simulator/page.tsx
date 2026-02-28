"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ControlPanel } from "@/components/simulator/control-panel"
import { UnityPlaceholder } from "@/components/simulator/unity-placeholder"
import { CoachPanel } from "@/components/simulator/coach-panel"
import { DEFAULT_PARAMS } from "@/lib/presets"
import type { RobotParams } from "@/lib/types"

export default function SimulatorPage() {
  const [params, setParams] = useState<RobotParams>(DEFAULT_PARAMS)

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-card/50 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="size-4 text-primary"
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
            <span className="font-display text-sm font-bold text-foreground">
              Simulator
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main simulator layout */}
      <main className="flex flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row">
        {/* Left: Control Panel */}
        <aside className="w-full shrink-0 overflow-y-auto lg:w-72 xl:w-80">
          <ControlPanel params={params} onParamsChange={setParams} />
        </aside>

        {/* Center: Unity Placeholder */}
        <div className="min-h-[300px] flex-1">
          <UnityPlaceholder params={params} />
        </div>

        {/* Right: Coach Panel */}
        <aside className="w-full shrink-0 overflow-y-auto lg:w-72 xl:w-80">
          <CoachPanel params={params} />
        </aside>
      </main>
    </div>
  )
}
