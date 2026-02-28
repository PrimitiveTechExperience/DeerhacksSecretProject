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
import { AuthButtons } from "@/components/auth/auth-buttons"
import { LEARNING_LEVELS, isLevelUnlocked, worldProgress, type LevelConfig } from "@/lib/levels"
import { getLearningProgress, markTheoryLevelCompleted } from "@/lib/learning-progress"
import { LearningMapBoard } from "@/components/learn/learning-map-board"
import { EquationRenderer } from "@/components/simulator/equation-renderer"
import { THEORY_LEVELS, type TheoryLevel, worldProgressTheory } from "@/lib/theory-levels"
import { Textarea } from "@/components/ui/textarea"

interface HintResponse {
  hint: string[]
  what_to_change: string
  short_voice_line: string
}

interface TheoryHelpResponse {
  reply: string
}

interface TheoryChatMessage {
  role: "user" | "assistant"
  content: string
}

export default function LearnPage() {
  const THEORY_WARNING_KEY = "continuum_theory_warning_hidden_v1"
  const [track, setTrack] = useState<"practical" | "theory">("practical")
  const [completed, setCompleted] = useState<number[]>([])
  const [completedTheory, setCompletedTheory] = useState<number[]>([])
  const [selected, setSelected] = useState<LevelConfig | null>(null)
  const [selectedTheory, setSelectedTheory] = useState<TheoryLevel | null>(null)
  const [hint, setHint] = useState<HintResponse | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)
  const [theoryAttempt, setTheoryAttempt] = useState("")
  const [theoryHelpLoading, setTheoryHelpLoading] = useState(false)
  const [theoryChatOpen, setTheoryChatOpen] = useState(false)
  const [theoryChatMessages, setTheoryChatMessages] = useState<TheoryChatMessage[]>([])
  const [theoryChatInput, setTheoryChatInput] = useState("")
  const [theoryChatFiles, setTheoryChatFiles] = useState<File[]>([])
  const [showTheoryWarning, setShowTheoryWarning] = useState(false)

  useEffect(() => {
    const progress = getLearningProgress()
    setCompleted(progress.completedLevels)
    setCompletedTheory(progress.completedTheoryLevels)
    const hidden = window.localStorage.getItem(THEORY_WARNING_KEY) === "1"
    setShowTheoryWarning(!hidden)
  }, [])

  const world1 = worldProgress(1, completed)
  const world2 = worldProgress(2, completed)
  const world3 = worldProgressTheory(3, completedTheory)
  const world4 = worldProgressTheory(4, completedTheory)

  const currentLevelId = LEARNING_LEVELS.find(
    (level) => !completed.includes(level.id) && isLevelUnlocked(level, completed)
  )?.id

  const currentTheoryLevelId = THEORY_LEVELS.find(
    (level) => !completedTheory.includes(level.id) && level.requires.every((id) => completedTheory.includes(id))
  )?.id

  const openPracticalLevel = (levelId: number) => {
    const level = LEARNING_LEVELS.find((item) => item.id === levelId)
    if (!level) return
    if (!isLevelUnlocked(level, completed) && !completed.includes(level.id)) return
    setSelected(level)
    setHint(null)
  }

  const openTheoryLevel = (levelId: number) => {
    const level = THEORY_LEVELS.find((item) => item.id === levelId)
    if (!level) return
    const unlocked = level.requires.every((id) => completedTheory.includes(id))
    if (!unlocked && !completedTheory.includes(level.id)) return
    setSelectedTheory(level)
    setTheoryAttempt("")
    setTheoryChatOpen(false)
    setTheoryChatMessages([])
    setTheoryChatInput("")
    setTheoryChatFiles([])
  }

  const fetchPracticalHint = async () => {
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

  const fetchTheoryHelp = async (message: string, files: File[] = []) => {
    if (!selectedTheory) return
    setTheoryHelpLoading(true)
    const userMessage = message || "Please review my current answer and identify mistakes."
    setTheoryChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    try {
      const form = new FormData()
      form.append("levelId", String(selectedTheory.id))
      form.append("answer", theoryAttempt)
      form.append("message", userMessage)
      form.append("history", JSON.stringify(theoryChatMessages.slice(-10)))
      for (const file of files) {
        form.append("files", file)
      }

      const res = await fetch("/api/coach/theory-chat", {
        method: "POST",
        body: form,
      })
      const data = (await res.json()) as TheoryHelpResponse
      setTheoryChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setTheoryChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I could not process your upload. Try again with a shorter message or clearer image." },
      ])
    } finally {
      setTheoryHelpLoading(false)
      setTheoryChatInput("")
      setTheoryChatFiles([])
    }
  }

  const openTheoryChat = async () => {
    setTheoryChatOpen(true)
    if (theoryChatMessages.length === 0) {
      await fetchTheoryHelp("Please review my current answer based on this problem.")
    }
  }

  const completeTheoryLevel = () => {
    if (!selectedTheory) return
    const progress = markTheoryLevelCompleted(selectedTheory.id)
    setCompletedTheory(progress.completedTheoryLevels)
  }

  const dismissTheoryWarning = (neverShowAgain: boolean) => {
    if (neverShowAgain) {
      window.localStorage.setItem(THEORY_WARNING_KEY, "1")
    }
    setShowTheoryWarning(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
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
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="ml-2 border-l border-border/60 pl-3">
              <AuthButtons />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="mb-4 flex gap-2">
          <Button
            variant={track === "practical" ? "default" : "outline"}
            onClick={() => setTrack("practical")}
            className="font-display"
          >
            Practical Track
          </Button>
          <Button
            variant={track === "theory" ? "default" : "outline"}
            onClick={() => setTrack("theory")}
            className="font-display"
          >
            Theory + Math Track
          </Button>
        </section>

        {track === "theory" && showTheoryWarning && (
          <section className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm text-foreground">
              Theory + Math Track assumes prior knowledge in linear algebra and Calculus III.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => dismissTheoryWarning(false)} className="btn-smooth">
                Dismiss
              </Button>
              <Button variant="secondary" size="sm" onClick={() => dismissTheoryWarning(true)} className="btn-smooth">
                Never show again
              </Button>
            </div>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          {track === "practical" ? (
            <>
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
            </>
          ) : (
            <>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">World 3: Theory Foundations</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">{world3.done}/{world3.total}</Badge>
                </div>
                <Progress value={(world3.done / world3.total) * 100} />
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">World 4: Advanced Math Control</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">{world4.done}/{world4.total}</Badge>
                </div>
                <Progress value={(world4.done / world4.total) * 100} />
              </div>
            </>
          )}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-border/50 bg-card">
          {track === "practical" ? (
            <LearningMapBoard
              levels={LEARNING_LEVELS}
              completed={completed}
              currentLevelId={currentLevelId}
              onOpenLevel={openPracticalLevel}
            />
          ) : (
            <LearningMapBoard
              levels={THEORY_LEVELS}
              completed={completedTheory}
              currentLevelId={currentTheoryLevelId}
              onOpenLevel={openTheoryLevel}
            />
          )}
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
                <Button variant="outline" onClick={fetchPracticalHint} disabled={loadingHint} className="btn-smooth">
                  {loadingHint ? "Thinking..." : "Coach help"}
                </Button>
                <Button asChild className="glow-sm btn-smooth">
                  <Link href={`/app?level=${selected.id}`}>Try it in simulator</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedTheory)} onOpenChange={(open) => !open && setSelectedTheory(null)}>
        <DialogContent className="max-w-2xl border-border/50">
          {selectedTheory && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Theory Level {selectedTheory.id}: {selectedTheory.title}
                </DialogTitle>
                <DialogDescription>{selectedTheory.concept}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Lesson</p>
                  <div className="mt-1">
                    <EquationRenderer content={selectedTheory.lesson} showFrame={false} size="md" />
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Problem</p>
                  <div className="mt-1">
                    <EquationRenderer content={selectedTheory.problem} showFrame={false} size="md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Your attempt</p>
                  <Textarea
                    value={theoryAttempt}
                    onChange={(event) => setTheoryAttempt(event.target.value)}
                    placeholder="Write your derivation, assumptions, and final answer..."
                    className="min-h-28"
                  />
                </div>

                {theoryChatOpen && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-primary">
                        <Sparkles className="size-3" />
                        Solution Review Chat
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-mono btn-smooth"
                        onClick={() => setTheoryChatOpen(false)}
                      >
                        Hide Chat
                      </Button>
                    </div>

                    <div className="mb-3 max-h-56 space-y-2 overflow-y-auto rounded-md border border-border/40 bg-card/60 p-2">
                      {theoryChatMessages.map((msg, idx) => (
                        <div
                          key={`${msg.role}-${idx}`}
                          className={`rounded-md p-2 text-sm ${
                            msg.role === "assistant" ? "border border-primary/20 bg-primary/5" : "border border-border/50 bg-muted/50"
                          }`}
                        >
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{msg.role}</p>
                          <EquationRenderer content={msg.content} showFrame={false} size="md" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        value={theoryChatInput}
                        onChange={(event) => setTheoryChatInput(event.target.value)}
                        placeholder="Ask follow-up questions or request a detailed check..."
                        className="min-h-20"
                      />
                      <input
                        type="file"
                        multiple
                        accept="image/*,.md,.tex,.txt,text/markdown,text/plain"
                        onChange={(event) => {
                          const selectedFiles = Array.from(event.target.files ?? [])
                          setTheoryChatFiles(selectedFiles)
                        }}
                        className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-xs"
                      />
                      {theoryChatFiles.length > 0 && (
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Attached: {theoryChatFiles.map((file) => file.name).join(", ")}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => fetchTheoryHelp(theoryChatInput, theoryChatFiles)}
                        disabled={theoryHelpLoading}
                        className="btn-smooth"
                      >
                        {theoryHelpLoading ? "Checking..." : "Send to AI"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                <div className="flex gap-2">
                  {theoryChatOpen ? (
                    <Button variant="outline" onClick={() => setTheoryChatOpen(false)} className="btn-smooth">
                      Hide Chat
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={openTheoryChat} disabled={theoryHelpLoading} className="btn-smooth">
                      {theoryHelpLoading ? "Starting..." : "AI Check Solution"}
                    </Button>
                  )}
                </div>
                <Button onClick={completeTheoryLevel} className="glow-sm btn-smooth">
                  Mark Complete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
