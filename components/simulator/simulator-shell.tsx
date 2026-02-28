"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButtons } from "@/components/auth/auth-buttons"
import { useAuth } from "@/components/auth/auth-provider"
import { ControlPanel } from "@/components/simulator/control-panel"
import { UnityPlaceholder } from "@/components/simulator/unity-placeholder"
import { CoachPanel } from "@/components/simulator/coach-panel"
import { DEFAULT_PARAMS } from "@/lib/presets"
import type { RobotParams } from "@/lib/types"
import { evaluateLevel, getLevelById } from "@/lib/levels"
import { getLearningProgress, markLevelCompleted } from "@/lib/learning-progress"

const DEFAULT_SEGMENT_COLORS = {
  s1: "#ff6d4d",
  s2: "#4dd8ff",
}
const MAX_EXPLORER_SEGMENTS = 6

type ExtraSegment = {
  kappa: number
  phiDeg: number
  length: number
  color: string
}

export function SimulatorShell() {
  const searchParams = useSearchParams()
  const [params, setParams] = useState<RobotParams>(DEFAULT_PARAMS)
  const [segmentColors, setSegmentColors] = useState(DEFAULT_SEGMENT_COLORS)
  const [explorerSegmentCount, setExplorerSegmentCount] = useState(1)
  const [extraSegments, setExtraSegments] = useState<ExtraSegment[]>([])
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [checkMessage, setCheckMessage] = useState<string>("")
  const [checkPassed, setCheckPassed] = useState(false)
  const { user } = useAuth()

  const levelId = Number(searchParams.get("level"))
  const activeLevel = useMemo(() => (Number.isFinite(levelId) ? getLevelById(levelId) : undefined), [levelId])

  useEffect(() => {
    let mounted = true
    setCompletedLevels([])

    if (!user) {
      return () => {
        mounted = false
      }
    }

    void (async () => {
      const progress = await getLearningProgress()
      if (mounted) {
        setCompletedLevels(progress.completedLevels)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (activeLevel) {
      setParams(activeLevel.initialParams)
      setSegmentColors(DEFAULT_SEGMENT_COLORS)
      setExplorerSegmentCount(1)
      setExtraSegments([])
      setCheckMessage("")
      setCheckPassed(false)
    } else {
      setParams(DEFAULT_PARAMS)
      setSegmentColors(DEFAULT_SEGMENT_COLORS)
      setExplorerSegmentCount(1)
      setExtraSegments([])
    }
  }, [activeLevel])

  useEffect(() => {
    if (activeLevel) return
    const targetExtraCount = Math.max(0, explorerSegmentCount - 2)
    setExtraSegments((prev) => {
      if (prev.length === targetExtraCount) return prev
      if (prev.length > targetExtraCount) return prev.slice(0, targetExtraCount)

      const next = [...prev]
      while (next.length < targetExtraCount) {
        next.push({
          kappa: 0,
          phiDeg: 0,
          length: 0.55,
          color: "#ffb347",
        })
      }
      return next
    })
  }, [activeLevel, explorerSegmentCount])

  const effectiveSegmentCount = activeLevel ? 2 : explorerSegmentCount

  const addExplorerSegment = () => {
    if (activeLevel) return
    setExplorerSegmentCount((current) => Math.min(MAX_EXPLORER_SEGMENTS, current + 1))
  }

  const removeExplorerSegment = () => {
    if (activeLevel) return
    setExplorerSegmentCount((current) => Math.max(1, current - 1))
  }

  const handleCheck = async () => {
    if (!activeLevel) return
    const result = evaluateLevel(activeLevel, params)
    if (result.passed) {
      const progress = await markLevelCompleted(activeLevel.id)
      setCompletedLevels(progress.completedLevels)
      setCheckMessage(`Level ${activeLevel.id} complete. Next level unlocked.`)
      setCheckPassed(true)
      return
    }

    const failed = result.checks.filter((check) => !check.passed).map((check) => check.label)
    setCheckMessage(`Not passed yet. Fix: ${failed.join(", ")}.`)
    setCheckPassed(false)
  }

  const isCompleted = activeLevel ? completedLevels.includes(activeLevel.id) : false

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-card/50 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
            <Link href={activeLevel ? "/learn" : "/"}>
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
              {activeLevel ? `Level ${activeLevel.id}: ${activeLevel.title}` : "Simulator"}
            </span>
          </div>
          {isCompleted && (
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <CheckCircle2 className="size-3" />
              Completed
            </Badge>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/learn">
              <Map className="size-3.5" />
              Learning Map
            </Link>
          </Button>
          <ThemeToggle />
          <div className="ml-2 border-l border-border/60 pl-3">
            <AuthButtons />
          </div>
        </div>
      </header>

      {activeLevel && (
        <section className="border-b border-border/40 bg-card/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Goal:</span> {activeLevel.goal}
            </p>
            <Button onClick={() => void handleCheck()} size="sm" className="glow-sm font-mono text-xs">
              Check
            </Button>
            {activeLevel.target && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                Target ({activeLevel.target.x.toFixed(2)}, {activeLevel.target.y.toFixed(2)}, {activeLevel.target.z.toFixed(2)})
              </Badge>
            )}
            {activeLevel.obstacles?.length ? (
              <Badge variant="secondary" className="font-mono text-[10px]">
                Obstacles: {activeLevel.obstacles.length}
              </Badge>
            ) : null}
            {checkMessage && (
              <span className={`text-xs ${checkPassed ? "text-primary" : "text-muted-foreground"}`}>{checkMessage}</span>
            )}
          </div>
        </section>
      )}

      <main className="flex flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row">
        <aside className="w-full shrink-0 overflow-y-auto lg:w-72 xl:w-80">
          <ControlPanel
            params={params}
            segmentCount={effectiveSegmentCount}
            segmentColors={segmentColors}
            onParamsChange={setParams}
            onSegmentColorChange={(segment, color) =>
              setSegmentColors((prev) => ({ ...prev, [segment]: color }))
            }
            extraSegments={extraSegments}
            maxSegments={MAX_EXPLORER_SEGMENTS}
            isLocked={Boolean(activeLevel)}
            onAddSegment={addExplorerSegment}
            onRemoveSegment={removeExplorerSegment}
            onExtraSegmentChange={(index, key, value) =>
              setExtraSegments((prev) => {
                const next = [...prev]
                const segment = next[index]
                if (!segment) return prev
                if (key === "color" && typeof value === "string") {
                  next[index] = { ...segment, color: value }
                  return next
                }
                if (key === "kappa" && typeof value === "number") {
                  next[index] = { ...segment, kappa: value }
                  return next
                }
                if (key === "phiDeg" && typeof value === "number") {
                  next[index] = { ...segment, phiDeg: value }
                  return next
                }
                if (key === "length" && typeof value === "number") {
                  next[index] = { ...segment, length: value }
                  return next
                }
                return next
              })
            }
          />
        </aside>

        <div className="min-h-[300px] flex-1">
          <UnityPlaceholder
            params={params}
            segmentCount={effectiveSegmentCount}
            segmentColors={segmentColors}
            extraSegments={extraSegments}
            target={activeLevel?.target}
            obstacles={activeLevel?.obstacles}
          />
        </div>

        <aside className="w-full shrink-0 overflow-y-auto lg:w-72 xl:w-80">
          <CoachPanel params={params} levelId={activeLevel?.id} />
        </aside>
      </main>
    </div>
  )
}
