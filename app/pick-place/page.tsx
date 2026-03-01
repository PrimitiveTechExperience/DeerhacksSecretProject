"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButtons } from "@/components/auth/auth-buttons"
import { ControlPanel } from "@/components/simulator/control-panel"
import { CoachPanel } from "@/components/simulator/coach-panel"
import { UnityPickPlacePlaceholder } from "@/components/simulator/unity-pick-place-placeholder"
import { Slider } from "@/components/ui/slider"
import { getPickPlaceLevelById } from "@/lib/pick-place-levels"
import { markPickPlaceLevelCompleted } from "@/lib/pick-place-progress"
import { DEFAULT_PARAMS } from "@/lib/presets"
import type { RobotParams } from "@/lib/types"
import { UNITY2_BUILD_CONFIG } from "@/lib/unity2-webgl"
import { UNITY3_BUILD_CONFIG } from "@/lib/unity3-webgl"

export default function PickPlacePage() {
  const searchParams = useSearchParams()
  const levelId = Number(searchParams.get("level"))
  const [params, setParams] = useState<RobotParams>(DEFAULT_PARAMS)
  const [segmentColors, setSegmentColors] = useState({ s1: "#ff6d4d", s2: "#4dd8ff" })
  const [grip01, setGrip01] = useState(0)
  const level = useMemo(
    () => (Number.isFinite(levelId) ? getPickPlaceLevelById(levelId) : undefined),
    [levelId]
  )
  const pickPlaceBuildConfig = level?.id === 202 ? UNITY3_BUILD_CONFIG : UNITY2_BUILD_CONFIG
  const sceneLabel = level?.id === 202 ? "unity3" : "unity2"

  const handleMarkComplete = () => {
    if (!level) return
    markPickPlaceLevelCompleted(level.id)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-card/50 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
            <Link href="/learn">
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="font-display text-sm font-bold text-foreground">
            {level ? `Pick & Place Level ${level.id}: ${level.title}` : "Pick & Place Demo"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="ml-2 border-l border-border/60 pl-3">
            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row">
        <aside className="w-full shrink-0 overflow-y-auto lg:w-72 xl:w-80">
          <div className="flex h-full flex-col gap-3">
            <ControlPanel
              params={params}
              segmentCount={2}
              segmentColors={segmentColors}
              onParamsChange={setParams}
              onSegmentColorChange={(segment, color) => setSegmentColors((prev) => ({ ...prev, [segment]: color }))}
              extraSegments={[]}
              maxSegments={2}
              isLocked={true}
              onAddSegment={() => {}}
              onRemoveSegment={() => {}}
              onExtraSegmentChange={() => {}}
            />
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="font-display text-sm font-semibold text-foreground">Claw Control</p>
              <p className="mt-1 text-xs text-muted-foreground">Drive gripper open/close for pickup behavior.</p>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[grip01]}
                onValueChange={([value]) => setGrip01(value ?? 0)}
                className="mt-3 w-full"
              />
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">grip01 = {grip01.toFixed(2)}</p>
            </div>
          </div>
        </aside>

        <div className="min-h-[320px] flex-1">
          <UnityPickPlacePlaceholder
            params={params}
            grip01={grip01}
            segmentColors={segmentColors}
            buildConfig={pickPlaceBuildConfig}
            sceneLabel={sceneLabel}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto lg:w-72 xl:w-80">
          <section className="rounded-xl border border-border/50 bg-card p-4">
            <p className="font-display text-sm font-semibold text-foreground">Level Goal</p>
            {level ? (
              <>
                <p className="mt-1 text-xs text-muted-foreground">{level.goal}</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Concept</p>
                    <p className="mt-1 text-sm text-foreground">{level.concept}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Challenge</p>
                    <p className="mt-1 text-sm text-foreground">{level.challenge}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    Demo Scene: {sceneLabel}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    No auto-check yet. Complete the task, then mark it manually.
                  </p>
                  <Button onClick={handleMarkComplete} className="btn-smooth w-full">
                    Mark Complete
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Open this page from the Pick & Place roadmap to load level details.
              </p>
            )}
          </section>

          <CoachPanel params={params} levelId={level?.id} />
        </aside>
      </main>
    </div>
  )
}
