"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Pause, Play, Sparkles, Volume2 } from "lucide-react"
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
import { PICK_PLACE_LEVELS, type PickPlaceLevelConfig } from "@/lib/pick-place-levels"
import { getPickPlaceCompletedLevels, markPickPlaceLevelCompleted } from "@/lib/pick-place-progress"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/components/auth/auth-provider"

interface HintResponse {
  hint: string[]
  what_to_change: string
  short_voice_line: string
}

interface HintNarrationState {
  loading: boolean
  audioSrc?: string
  isPlaying: boolean
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
  const { user } = useAuth()
  const [track, setTrack] = useState<"practical" | "theory" | "pickplace">("practical")
  const [completed, setCompleted] = useState<number[]>([])
  const [completedTheory, setCompletedTheory] = useState<number[]>([])
  const [completedPickPlace, setCompletedPickPlace] = useState<number[]>([])
  const [selected, setSelected] = useState<LevelConfig | null>(null)
  const [selectedTheory, setSelectedTheory] = useState<TheoryLevel | null>(null)
  const [selectedPickPlace, setSelectedPickPlace] = useState<PickPlaceLevelConfig | null>(null)
  const [hint, setHint] = useState<HintResponse | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)
  const [theoryAttempt, setTheoryAttempt] = useState("")
  const [theoryHelpLoading, setTheoryHelpLoading] = useState(false)
  const [theoryChatOpen, setTheoryChatOpen] = useState(false)
  const [theoryChatMessages, setTheoryChatMessages] = useState<TheoryChatMessage[]>([])
  const [theoryChatInput, setTheoryChatInput] = useState("")
  const [theoryChatFiles, setTheoryChatFiles] = useState<File[]>([])
  const [showTheoryWarning, setShowTheoryWarning] = useState(false)
  const [hintNarration, setHintNarration] = useState<HintNarrationState>({
    loading: false,
    audioSrc: undefined,
    isPlaying: false,
  })
  const [hintNarrationError, setHintNarrationError] = useState<string | null>(null)
  const hintAudioRef = useRef<HTMLAudioElement | null>(null)
  const [hintVolume, setHintVolume] = useState(0.8)

  const resetHintNarration = useCallback(() => {
    if (hintAudioRef.current) {
      hintAudioRef.current.pause()
      hintAudioRef.current.currentTime = 0
      hintAudioRef.current = null
    }
    setHintNarration({ loading: false, audioSrc: undefined, isPlaying: false })
    setHintNarrationError(null)
  }, [])

  useEffect(() => {
    let mounted = true
    setCompleted([])
    setCompletedTheory([])
    setCompletedPickPlace(getPickPlaceCompletedLevels())

    if (!user) {
      return () => {
        mounted = false
      }
    }

    void (async () => {
      const progress = await getLearningProgress()
      if (!mounted) return
      setCompleted(progress.completedLevels)
      setCompletedTheory(progress.completedTheoryLevels)
    })()
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    const hidden = window.localStorage.getItem(THEORY_WARNING_KEY) === "1"
    setShowTheoryWarning(!hidden)
  }, [])

  useEffect(() => {
    return () => {
      resetHintNarration()
    }
  }, [resetHintNarration])

  useEffect(() => {
    if (!hint) {
      resetHintNarration()
    }
  }, [hint, resetHintNarration])

  useEffect(() => {
    if (hintAudioRef.current) {
      hintAudioRef.current.volume = hintVolume
    }
  }, [hintVolume])

  const world1 = worldProgress(1, completed)
  const world2 = worldProgress(2, completed)
  const world3 = worldProgressTheory(3, completedTheory)
  const world4 = worldProgressTheory(4, completedTheory)
  const pickPlaceDone = PICK_PLACE_LEVELS.filter((level) => completedPickPlace.includes(level.id)).length
  const pickPlaceTotal = PICK_PLACE_LEVELS.length

  const currentLevelId = LEARNING_LEVELS.find(
    (level) => !completed.includes(level.id) && isLevelUnlocked(level, completed)
  )?.id

  const currentTheoryLevelId = THEORY_LEVELS.find(
    (level) => !completedTheory.includes(level.id) && level.requires.every((id) => completedTheory.includes(id))
  )?.id
  const currentPickPlaceLevelId = PICK_PLACE_LEVELS.find(
    (level) => !completedPickPlace.includes(level.id) && level.requires.every((id) => completedPickPlace.includes(id))
  )?.id

  const openPracticalLevel = (levelId: number) => {
    const level = LEARNING_LEVELS.find((item) => item.id === levelId)
    if (!level) return
    if (!isLevelUnlocked(level, completed) && !completed.includes(level.id)) return
    setSelected(level)
    resetHintNarration()
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

  const openPickPlaceLevel = (levelId: number) => {
    const level = PICK_PLACE_LEVELS.find((item) => item.id === levelId)
    if (!level) return
    const unlocked = level.requires.every((id) => completedPickPlace.includes(id))
    if (!unlocked && !completedPickPlace.includes(level.id)) return
    setSelectedPickPlace(level)
  }

  const fetchPracticalHint = async () => {
    if (!selected) return
    resetHintNarration()
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

  const handleHintNarration = useCallback(async () => {
    if (!hint) return
    const sections = [
      hint.short_voice_line?.trim() ?? "",
      hint.hint.join(". ").trim(),
      hint.what_to_change.trim(),
    ].filter((part) => part.length > 0)
    if (sections.length === 0) return

    if (hintAudioRef.current) {
      hintAudioRef.current.pause()
      hintAudioRef.current.currentTime = 0
    }

    setHintNarration({ loading: true, audioSrc: undefined, isPlaying: false })
    setHintNarrationError(null)

    try {
      const res = await fetch("/api/ai/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usage: "voice_narration",
          payload: { text: sections.join(". ") },
        }),
      })
      const json = await res.json()

      if (!res.ok || !json?.ok || !json?.implemented) {
        throw new Error(json?.error || "Narration usage is unavailable.")
      }

      const audioBase64 = json?.data?.audio_base64
      if (typeof audioBase64 !== "string" || audioBase64.length === 0) {
        throw new Error("Narration audio was empty.")
      }
      const mimeType = typeof json?.data?.mime_type === "string" ? json.data.mime_type : "audio/mpeg"

      setHintNarration({
        loading: false,
        audioSrc: `data:${mimeType};base64,${audioBase64}`,
        isPlaying: false,
      })
    } catch (error) {
      console.error("Coach hint narration failed:", error)
      setHintNarration((prev) => ({ ...prev, loading: false }))
      setHintNarrationError("Could not generate narration. Check your AI configuration.")
    }
  }, [hint])

  const toggleHintPlayback = useCallback(() => {
    const audio = hintAudioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.currentTime = 0
      void audio.play().catch((err) => console.error("Coach hint playback blocked:", err))
    } else {
      audio.pause()
    }
  }, [])

  const handleHintAudioState = useCallback((isPlaying: boolean) => {
    setHintNarration((prev) => ({ ...prev, isPlaying }))
  }, [])

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

  const completeTheoryLevel = async () => {
    if (!selectedTheory) return
    const progress = await markTheoryLevelCompleted(selectedTheory.id)
    setCompletedTheory(progress.completedTheoryLevels)
  }

  const completePickPlaceLevel = (levelId: number) => {
    const next = markPickPlaceLevelCompleted(levelId)
    setCompletedPickPlace(next)
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
          <Button
            variant={track === "pickplace" ? "default" : "outline"}
            onClick={() => setTrack("pickplace")}
            className="font-display"
          >
            Pick & Place Track
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
                  <span className="font-display text-sm font-semibold">World 2: Redundancy & Singularities</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">{world2.done}/{world2.total}</Badge>
                </div>
                <Progress value={(world2.done / world2.total) * 100} />
              </div>
            </>
          ) : track === "theory" ? (
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
          ) : (
            <div className="rounded-xl border border-border/50 bg-card p-4 sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-sm font-semibold">World 5: Pick & Place Demo</span>
                <Badge variant="secondary" className="font-mono text-[10px]">{pickPlaceDone}/{pickPlaceTotal}</Badge>
              </div>
              <Progress value={pickPlaceTotal > 0 ? (pickPlaceDone / pickPlaceTotal) * 100 : 0} />
            </div>
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
          ) : track === "theory" ? (
            <LearningMapBoard
              levels={THEORY_LEVELS}
              completed={completedTheory}
              currentLevelId={currentTheoryLevelId}
              onOpenLevel={openTheoryLevel}
            />
          ) : (
            <LearningMapBoard
              levels={PICK_PLACE_LEVELS}
              completed={completedPickPlace}
              currentLevelId={currentPickPlaceLevelId}
              onOpenLevel={openPickPlaceLevel}
            />
          )}
        </section>
      </main>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
            setHint(null)
            resetHintNarration()
          }
        }}
      >
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
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Concept</p>
                  <p className="mt-1">{selected.concept}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Goal</p>
                  <p className="mt-1">{selected.goal}</p>
                </div>
                {hint && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-primary">
                        <Sparkles className="size-3" />
                        Coach Hint
                      </p>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={handleHintNarration}
                          disabled={hintNarration.loading}
                          aria-label="Narrate coach hint"
                        >
                          {hintNarration.loading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Volume2 className="size-3.5" />
                          )}
                        </Button>
                        {hintNarration.audioSrc && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary"
                            onClick={toggleHintPlayback}
                            aria-label={hintNarration.isPlaying ? "Pause narration" : "Play narration"}
                          >
                            {hintNarration.isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span className="uppercase tracking-wide">Voice Volume</span>
                        <span>{Math.round(hintVolume * 100)}%</span>
                      </div>
                      <Slider
                        value={[Math.round(hintVolume * 100)]}
                        max={100}
                        step={5}
                        onValueChange={(value) => {
                          const next = Math.min(1, Math.max(0, (value[0] ?? 0) / 100))
                          setHintVolume(next)
                          if (hintAudioRef.current) {
                            hintAudioRef.current.volume = next
                          }
                        }}
                      />
                    </div>
                    <ul className="space-y-1 text-sm">
                      {hint.hint.map((line, idx) => (
                        <li key={idx}>
                          <EquationRenderer content={line} showFrame={false} size="sm" />
                        </li>
                      ))}
                    </ul>
                    {hint.short_voice_line && (
                      <div className="mt-2 text-xs italic text-muted-foreground">
                        <EquationRenderer content={hint.short_voice_line} showFrame={false} size="sm" />
                      </div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      <EquationRenderer content={hint.what_to_change} showFrame={false} size="sm" />
                    </div>
                    {hintNarrationError && (
                      <p className="mt-2 text-xs text-destructive">{hintNarrationError}</p>
                    )}
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
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Lesson</p>
                  <div className="mt-1">
                    <EquationRenderer content={selectedTheory.lesson} showFrame={false} size="md" />
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Problem</p>
                  <div className="mt-1">
                    <EquationRenderer content={selectedTheory.problem} showFrame={false} size="md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Your attempt</p>
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
                      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-primary">
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
                          <p className="mb-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">{msg.role}</p>
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
                <Button onClick={() => void completeTheoryLevel()} className="glow-sm btn-smooth">
                  Mark Complete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedPickPlace)} onOpenChange={(open) => !open && setSelectedPickPlace(null)}>
        <DialogContent className="max-w-xl border-border/50">
          {selectedPickPlace && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Pick & Place Level {selectedPickPlace.id}: {selectedPickPlace.title}
                </DialogTitle>
                <DialogDescription>{selectedPickPlace.challenge}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Concept</p>
                  <p className="mt-1">{selectedPickPlace.concept}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
                  <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Goal</p>
                  <p className="mt-1">{selectedPickPlace.goal}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  There is no automatic checker for this demo yet. Complete the task in simulator, then mark this level done manually.
                </p>
              </div>

              <DialogFooter className="sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => completePickPlaceLevel(selectedPickPlace.id)}
                  className="btn-smooth"
                >
                  Mark Complete
                </Button>
                <Button asChild className="glow-sm btn-smooth">
                  <Link href={`/pick-place?level=${selectedPickPlace.id}`}>Try it in simulator</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {hintNarration.audioSrc && (
        <audio
          ref={(node) => {
            hintAudioRef.current = node
            if (node) {
              node.volume = hintVolume
            }
          }}
          src={hintNarration.audioSrc}
          onPlay={() => handleHintAudioState(true)}
          onPause={() => handleHintAudioState(false)}
          onEnded={() => handleHintAudioState(false)}
          className="hidden"
        />
      )}
    </div>
  )
}
