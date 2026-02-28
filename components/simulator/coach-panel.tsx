"use client"

import { useState, useRef, useCallback } from "react"
import {
  Sparkles,
  Volume2,
  Loader2,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  ChevronDown,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { EquationRenderer } from "./equation-renderer"
import type { RobotParams, CoachResponse } from "@/lib/types"

interface CoachPanelProps {
  params: RobotParams
}

export function CoachPanel({ params }: CoachPanelProps) {
  const [response, setResponse] = useState<CoachResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [narrating, setNarrating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceStyle, setVoiceStyle] = useState<"friendly" | "technical">("friendly")
  const [error, setError] = useState<string | null>(null)
  const [mathExpanded, setMathExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleExplain = useCallback(async () => {
    setLoading(true)
    setError(null)
    setMathExpanded(false)
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, voiceStyle }),
      })
      if (!res.ok) throw new Error("Failed to get coaching response")
      const data: CoachResponse = await res.json()
      setResponse(data)
    } catch {
      setError("Could not reach the AI coach. Check your API key configuration.")
    } finally {
      setLoading(false)
    }
  }, [params, voiceStyle])

  const handleNarrate = useCallback(async () => {
    if (!response?.short_voice_script) return
    setNarrating(true)
    try {
      const res = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response.short_voice_script }),
      })
      if (!res.ok) throw new Error("Failed to generate narration")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        setIsPlaying(true)
      }
    } catch {
      setError("Could not generate narration. Check your ElevenLabs API key.")
    } finally {
      setNarrating(false)
    }
  }, [response])

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
      setIsPlaying(true)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-border/50 bg-card p-5">
      <div>
        <h2 className="font-display text-sm font-bold tracking-wide text-foreground">
          AI Coach
        </h2>
        <p className="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          Gemini + ElevenLabs
        </p>
      </div>

      {/* Voice style toggle */}
      <div className="flex gap-2">
        <Button
          variant={voiceStyle === "friendly" ? "default" : "outline"}
          size="sm"
          className="flex-1 font-mono text-xs"
          onClick={() => setVoiceStyle("friendly")}
        >
          Friendly
        </Button>
        <Button
          variant={voiceStyle === "technical" ? "default" : "outline"}
          size="sm"
          className="flex-1 font-mono text-xs"
          onClick={() => setVoiceStyle("technical")}
        >
          Technical
        </Button>
      </div>

      {/* Explain button */}
      <Button
        onClick={handleExplain}
        disabled={loading}
        className="glow-sm gap-2 font-display font-semibold"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {loading ? "Analyzing..." : "Explain Configuration"}
      </Button>

      <Separator className="bg-border/50" />

      {/* Response area */}
      <div className="flex flex-1 flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!loading && !response && !error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="crosshair relative flex size-14 items-center justify-center rounded-xl bg-primary/5">
              <Sparkles className="size-6 text-primary/40" />
            </div>
            <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
              Adjust the robot parameters, then click
              Explain to get AI coaching feedback.
            </p>
          </div>
        )}

        {!loading && response && (
          <div className="flex flex-col gap-4">
            {/* Title */}
            <h3 className="font-display text-sm font-bold text-foreground">
              {response.title}
            </h3>

            {/* What Changed */}
            {response.what_changed.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  What Changed
                </span>
                <ul className="flex flex-col gap-1.5">
                  {response.what_changed.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <EquationRenderer content={item} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* How It Moves */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                How It Moves
              </span>
              <EquationRenderer content={response.how_it_moves} />
            </div>

            {/* Math Deep Dive - Collapsible */}
            {response.math_deep_dive && (
              <div className="flex flex-col rounded-lg border border-primary/15 bg-primary/[0.02] overflow-hidden">
                <button
                  onClick={() => setMathExpanded(!mathExpanded)}
                  className="group flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-primary/5"
                  aria-expanded={mathExpanded}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <BookOpen className="size-3 text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-display text-xs font-semibold text-foreground">
                      Math Deep Dive
                    </span>
                    <span className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                      Equations &amp; Derivations
                    </span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      mathExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mathExpanded && (
                  <div className="border-t border-primary/10 px-3 py-4">
                    <EquationRenderer content={response.math_deep_dive} />
                  </div>
                )}
              </div>
            )}

            {/* Tip */}
            <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <EquationRenderer content={response.one_tip} />
              </div>
            </div>

            {/* Safety note */}
            {response.safety_note && (
              <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <EquationRenderer content={response.safety_note} />
                </div>
              </div>
            )}

            <Separator className="bg-border/50" />

            {/* Narrate controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Voice Narration
                </span>
                {isPlaying && (
                  <Badge variant="outline" className="border-primary/30 text-[10px] text-primary">
                    Playing
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleNarrate}
                  disabled={narrating}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 font-mono text-xs"
                >
                  {narrating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="size-3.5" />
                  )}
                  {narrating ? "Generating..." : "Narrate"}
                </Button>
                {audioRef.current?.src && (
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    size="sm"
                    className="px-2.5"
                  >
                    {isPlaying ? (
                      <Pause className="size-3.5" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />
    </div>
  )
}
