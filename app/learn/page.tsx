"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { LEARNING_LEVELS, isLevelUnlocked, worldProgress, type LevelConfig } from "@/lib/levels"
import { getLearningProgress } from "@/lib/learning-progress"
import { LearningMapBoard } from "@/components/learn/learning-map-board"

interface HintResponse {
  hint: string[]
  what_to_change: string
  short_voice_line: string
}

export default function LearnPage() {
  const [completed, setCompleted] = useState<number[]>([])
  const [selected, setSelected] = useState<LevelConfig | null>(null)
  const [hint, setHint] = useState<HintResponse | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  useEffect(() => {
    const progress = getLearningProgress()
    setCompleted(progress.completedLevels)
  }, [])

  const world1 = worldProgress(1, completed)
  const world2 = worldProgress(2, completed)
  const currentLevelId = LEARNING_LEVELS.find(
    (level) => !completed.includes(level.id) && isLevelUnlocked(level, completed)
  )?.id

  const openLevel = (level: LevelConfig) => {
    if (!isLevelUnlocked(level, completed) && !completed.includes(level.id)) return
    setSelected(level)
    setHint(null)
  }

  const fetchHint = async () => {
    if (!selected) return
    setLoadingHint(true)
    try {
      const res = await fetch("/api/coach/level-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: selected.id }),
      })
      const data = (await res.json()) as HintResponse
      setHint(data)
    } catch {
      setHint({
        hint: ["Adjust one parameter at a time, then run Check in simulator."],
        what_to_change: selected.challenge,
        short_voice_line: "Use smaller changes and verify after each adjustment.",
      })
    } finally {
      setLoadingHint(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
              <Link href="/">
                <ArrowLeft className="size-3.5" />
                Back
              </Link>
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="font-display text-sm font-semibold">Learning Map</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-semibold">World 1: Basics</span>
              <Badge variant="secondary" className="font-mono text-[10px]">{world1.done}/{world1.total}</Badge>
            </div>
            <Progress value={(world1.done / world1.total) * 100} />
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-semibold">World 2: Shape Control</span>
              <Badge variant="secondary" className="font-mono text-[10px]">{world2.done}/{world2.total}</Badge>
            </div>
            <Progress value={(world2.done / world2.total) * 100} />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-border/50 bg-card">
          <LearningMapBoard
            levels={LEARNING_LEVELS}
            completed={completed}
            currentLevelId={currentLevelId}
            onOpenLevel={openLevel}
          />
        </section>
      </main>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl border-border/50">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Level {selected.id}: {selected.title}
                </DialogTitle>
                <DialogDescription>{selected.challenge}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Concept</p>
                  <p className="mt-1">{selected.concept}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Goal</p>
                  <p className="mt-1">{selected.goal}</p>
                </div>
                {hint && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-primary">
                      <Sparkles className="size-3" />
                      Coach Hint
                    </p>
                    <ul className="space-y-1 text-sm">
                      {hint.hint.map((line, idx) => (
                        <li key={idx}>- {line}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">{hint.what_to_change}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                <Button variant="outline" onClick={fetchHint} disabled={loadingHint}>
                  {loadingHint ? "Thinking..." : "Coach help"}
                </Button>
                <Button asChild className="glow-sm">
                  <Link href={`/app?level=${selected.id}`}>Try it in simulator</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
