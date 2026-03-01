"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  Mic,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EquationRenderer } from "./equation-renderer";
import type { RobotParams, CoachResponse } from "@/lib/types";
import { Slider } from "@/components/ui/slider";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    OfflineAudioContext?: typeof AudioContext;
    webkitOfflineAudioContext?: typeof AudioContext;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface CoachPanelProps {
  params: RobotParams;
  levelId?: number;
}

interface SectionVoiceState {
  audioSrc?: string | null;
  generating?: boolean;
  isPlaying?: boolean;
}

interface LevelHintResponse {
  hint: string[];
  what_to_change: string;
  short_voice_line: string;
  voice_audio_base64?: string;
  voice_mime_type?: string;
}

const EXPLANATION_SECTION_KEYS = [
  "coach_title",
  "coach_changes",
  "coach_motion",
  "coach_math",
  "coach_tip",
  "coach_safety",
] as const;

const HINT_SECTION_KEYS = ["hint_steps", "hint_change", "hint_voice"] as const;

type SectionKey =
  | (typeof EXPLANATION_SECTION_KEYS)[number]
  | (typeof HINT_SECTION_KEYS)[number];

type VoiceTarget = "coach_panel" | "progressive_hint";

interface VoiceQueryState {
  loading: boolean;
  transcript?: string;
  answer?: string;
  error?: string | null;
}

export function CoachPanel({ params, levelId }: CoachPanelProps) {
  const [response, setResponse] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<"friendly" | "technical">(
    "friendly",
  );
  const [narrationVolume, setNarrationVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [mathExpanded, setMathExpanded] = useState(false);

  const [progressiveHint, setProgressiveHint] =
    useState<LevelHintResponse | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const [sectionVoices, setSectionVoices] = useState<
    Record<string, SectionVoiceState>
  >({});
  const sectionAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const pcmLengthRef = useRef(0);
  const recordingSampleRateRef = useRef(16000);
  const cancelUploadRef = useRef(false);
  const voiceRecordingStartedAt = useRef<number | null>(null);

  const [voiceRecordingTarget, setVoiceRecordingTarget] =
    useState<VoiceTarget | null>(null);
  const [voiceQueryState, setVoiceQueryState] = useState<
    Record<VoiceTarget, VoiceQueryState>
  >({
    coach_panel: { loading: false, error: null },
    progressive_hint: { loading: false, error: null },
  });

  const cleanupAudioGraph = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      void ctx.close().catch(() => undefined);
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const clearSectionVoices = useCallback((keys?: string[]) => {
    setSectionVoices((prev) => {
      if (!keys) {
        Object.keys(prev).forEach((key) => {
          sectionAudioRefs.current[key]?.pause();
          delete sectionAudioRefs.current[key];
        });
        return {};
      }

      if (keys.length === 0) return prev;
      const next = { ...prev };
      keys.forEach((key) => {
        if (next[key]) {
          sectionAudioRefs.current[key]?.pause();
          delete sectionAudioRefs.current[key];
          delete next[key];
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      clearSectionVoices();
      cancelUploadRef.current = true;
      cleanupAudioGraph();
    };
  }, [clearSectionVoices, cleanupAudioGraph]);

  useEffect(() => {
    if (levelId === undefined) {
      setProgressiveHint(null);
      setHintError(null);
    }
    clearSectionVoices([...HINT_SECTION_KEYS]);
  }, [levelId, clearSectionVoices]);

  const handleExplain = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMathExpanded(false);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, voiceStyle }),
      });
      if (!res.ok) throw new Error("Failed to get coaching response");
      const data: CoachResponse = await res.json();
      setResponse(data);
      clearSectionVoices([...EXPLANATION_SECTION_KEYS]);
    } catch {
      setError(
        "Could not reach the AI coach. Check your API key configuration.",
      );
    } finally {
      setLoading(false);
    }
  }, [params, voiceStyle, clearSectionVoices]);

  const handleSectionNarrate = useCallback(
    async (sectionKey: SectionKey, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setSectionVoices((prev) => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], generating: true },
      }));

      try {
        const res = await fetch("/api/ai/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usage: "voice_narration",
            payload: { text: trimmed },
          }),
        });
        const json = await res.json();

        if (!res.ok || !json?.ok || !json?.implemented) {
          throw new Error(json?.error || "Narration usage not available.");
        }

        const audioBase64 = json?.data?.audio_base64;
        if (typeof audioBase64 !== "string" || !audioBase64.length) {
          throw new Error("Narration audio was empty.");
        }

        const mimeType =
          typeof json?.data?.mime_type === "string"
            ? json.data.mime_type
            : "audio/mpeg";
        const audioSrc = `data:${mimeType};base64,${audioBase64}`;

        setSectionVoices((prev) => ({
          ...prev,
          [sectionKey]: { ...prev[sectionKey], generating: false, audioSrc },
        }));
      } catch (err) {
        console.error("Narration failed:", err);
        setSectionVoices((prev) => ({
          ...prev,
          [sectionKey]: { ...prev[sectionKey], generating: false },
        }));
        setError(
          "Could not generate narration. Check your ElevenLabs API key.",
        );
      }
    },
    [],
  );

  const toggleSectionPlayback = useCallback((sectionKey: SectionKey) => {
    const audio = sectionAudioRefs.current[sectionKey];
    if (!audio) return;

    if (audio.paused) {
      audio.currentTime = 0;
      void audio
        .play()
        .catch((err) => console.error("Audio playback blocked:", err));
    } else {
      audio.pause();
    }
  }, []);

  const handleAudioPlayState = useCallback(
    (sectionKey: SectionKey, isPlaying: boolean) => {
      setSectionVoices((prev) => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], isPlaying },
      }));
    },
    [],
  );

  const renderNarrationControls = (
    sectionKey: SectionKey,
    text?: string | null,
  ) => {
    const normalized = text?.replace(/\s+/g, " ").trim();
    if (!normalized) return null;

    const voiceState = sectionVoices[sectionKey];
    return (
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => handleSectionNarrate(sectionKey, normalized)}
          disabled={voiceState?.generating}
        >
          {voiceState?.generating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Volume2 className="size-3.5" />
          )}
        </Button>
        {voiceState?.audioSrc && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => toggleSectionPlayback(sectionKey)}
          >
            {voiceState?.isPlaying ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </Button>
        )}
      </div>
    );
  };

  const registerAudioRef = useCallback(
    (sectionKey: SectionKey, node: HTMLAudioElement | null) => {
      if (node) {
        node.volume = narrationVolume;
        sectionAudioRefs.current[sectionKey] = node;
      } else {
        delete sectionAudioRefs.current[sectionKey];
      }
    },
    [narrationVolume],
  );

  useEffect(() => {
    Object.values(sectionAudioRefs.current).forEach((audio) => {
      if (audio) audio.volume = narrationVolume;
    });
  }, [narrationVolume]);

  const uploadVoiceBlob = useCallback(
    async (blob: Blob, target: VoiceTarget) => {
      setVoiceQueryState((prev) => ({
        ...prev,
        [target]: { ...prev[target], loading: true, error: null },
      }));

      try {
        const form = new FormData();
        const extension = blob.type.includes("wav") ? "wav" : "webm";
        form.append("audio", blob, `voice-input.${extension}`);
        form.append("context", target);
        const payload: Record<string, unknown> = {};
        if (typeof levelId === "number") {
          payload.levelId = levelId;
        }
        if (target === "coach_panel") {
          payload.params = params;
        }
        form.append("contextPayload", JSON.stringify(payload));

        const res = await fetch("/api/ai/voice-query", {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as {
          ok: boolean;
          transcript?: string;
          answer?: string;
          error?: string;
        };
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Voice request failed.");
        }

        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            loading: false,
            error: null,
            transcript: data.transcript,
            answer: data.answer,
          },
        }));
      } catch (error) {
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            ...prev[target],
            loading: false,
            error:
              error instanceof Error ? error.message : "Voice request failed.",
          },
        }));
      }
    },
    [levelId, params],
  );

  const stopVoiceRecording = useCallback(
    (cancelUpload = false) => {
      cancelUploadRef.current = cancelUpload;
      const target = voiceRecordingTarget;

      cleanupAudioGraph();
      setVoiceRecordingTarget(null);

      const elapsedMs =
        voiceRecordingStartedAt.current !== null
          ? performance.now() - voiceRecordingStartedAt.current
          : null;
      voiceRecordingStartedAt.current = null;

      if (!target) {
        pcmChunksRef.current = [];
        pcmLengthRef.current = 0;
        cancelUploadRef.current = false;
        return;
      }

      if (cancelUploadRef.current) {
        cancelUploadRef.current = false;
        pcmChunksRef.current = [];
        pcmLengthRef.current = 0;
        return;
      }

      if (elapsedMs !== null && elapsedMs < 600) {
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            ...prev[target],
            loading: false,
            error:
              "Recording too short. Hold the button and speak for at least a second.",
          },
        }));
        pcmChunksRef.current = [];
        pcmLengthRef.current = 0;
        return;
      }

      if (pcmLengthRef.current === 0) {
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            ...prev[target],
            loading: false,
            error: "No audio captured.",
          },
        }));
        return;
      }

      const merged = mergePcmChunks(pcmChunksRef.current, pcmLengthRef.current);
      pcmChunksRef.current = [];
      pcmLengthRef.current = 0;

      const normalized = normalizePcmSamples(merged);
      const wavBuffer = encodeWavFromFloat32(
        normalized,
        recordingSampleRateRef.current || 16000,
      );
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      void uploadVoiceBlob(wavBlob, target);
    },
    [cleanupAudioGraph, uploadVoiceBlob, voiceRecordingTarget],
  );

  const startVoiceRecording = useCallback(
    async (target: VoiceTarget) => {
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            ...prev[target],
            error: "Microphone not supported in this browser.",
          },
        }));
        return;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            ...prev[target],
            error: "Web Audio API is unavailable in this browser.",
          },
        }));
        return;
      }

      try {
        if (voiceRecordingTarget) {
          stopVoiceRecording(true);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        const audioCtx = new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;
        recordingSampleRateRef.current = audioCtx.sampleRate;

        const sourceNode = audioCtx.createMediaStreamSource(stream);
        sourceNodeRef.current = sourceNode;

        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorNodeRef.current = processor;
        pcmChunksRef.current = [];
        pcmLengthRef.current = 0;
        cancelUploadRef.current = false;

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          pcmChunksRef.current.push(new Float32Array(input));
          pcmLengthRef.current += input.length;
        };

        sourceNode.connect(processor);
        processor.connect(audioCtx.destination);

        setVoiceRecordingTarget(target);
        voiceRecordingStartedAt.current = performance.now();
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            loading: false,
            error: null,
            transcript: undefined,
            answer: undefined,
          },
        }));
      } catch (error) {
        cleanupAudioGraph();
        setVoiceRecordingTarget(null);
        setVoiceQueryState((prev) => ({
          ...prev,
          [target]: {
            ...prev[target],
            error:
              error instanceof Error
                ? error.message
                : "Could not access microphone.",
          },
        }));
      }
    },
    [cleanupAudioGraph, stopVoiceRecording, voiceRecordingTarget],
  );

  const handleVoiceButton = useCallback(
    (target: VoiceTarget) => {
      if (voiceRecordingTarget === target) {
        stopVoiceRecording();
      } else {
        void startVoiceRecording(target);
      }
    },
    [startVoiceRecording, stopVoiceRecording, voiceRecordingTarget],
  );

  const handleHint = useCallback(async () => {
    if (!levelId) {
      setHintError("Select a level to unlock progressive hints.");
      return;
    }

    setHintError(null);
    setHintLoading(true);
    try {
      const res = await fetch("/api/coach/level-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId, currentParams: params }),
      });
      if (!res.ok) throw new Error("Failed to get hint");

      const data = (await res.json()) as LevelHintResponse;
      clearSectionVoices([...HINT_SECTION_KEYS]);
      setProgressiveHint(data);

      if (data.voice_audio_base64) {
        const audioSrc = `data:${data.voice_mime_type ?? "audio/mpeg"};base64,${data.voice_audio_base64}`;
        setSectionVoices((prev) => ({
          ...prev,
          hint_voice: { audioSrc, generating: false, isPlaying: false },
        }));
      }
    } catch {
      setHintError("Could not retrieve a progressive hint. Try again.");
    } finally {
      setHintLoading(false);
    }
  }, [levelId, params, clearSectionVoices]);

  const renderSectionAudioElements = () => {
    return Object.entries(sectionVoices).map(([key, state]) =>
      state.audioSrc ? (
        <audio
          key={key}
          ref={(node) => registerAudioRef(key as SectionKey, node)}
          src={state.audioSrc || undefined}
          onPlay={() => handleAudioPlayState(key as SectionKey, true)}
          onPause={() => handleAudioPlayState(key as SectionKey, false)}
          onEnded={() => handleAudioPlayState(key as SectionKey, false)}
          className="hidden"
        />
      ) : null,
    );
  };

  const renderHintSection = () => (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="font-display text-[18px] font-semibold text-foreground">
            Progressive Hint
          </p>
          <p className="text-xs text-muted-foreground">
            {levelId
              ? `Level ${levelId}`
              : "Select a level on the learning map to enable hints."}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleHint}
          disabled={!levelId || hintLoading}
          className="ml-auto gap-2 font-mono text-xs"
        >
          {hintLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Lightbulb className="size-3.5" />
          )}
          {hintLoading ? "Coaching..." : "Get Hint"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 font-mono text-xs"
          onClick={() => handleVoiceButton("progressive_hint")}
          disabled={!levelId}
        >
          {voiceRecordingTarget === "progressive_hint" ? (
            <>
              <Square className="size-3.5" />
              Stop Voice
            </>
          ) : (
            <>
              <Mic className="size-3.5" />
              Voice Hint
            </>
          )}
        </Button>
      </div>
      {hintError && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {hintError}
        </div>
      )}

      {progressiveHint && (
        <div className="mt-4 space-y-3 text-xs text-foreground">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Hint Steps
            </span>
            {renderNarrationControls(
              "hint_steps",
              progressiveHint.hint.join(". "),
            )}
          </div>
          <ul className="list-disc space-y-1 pl-4">
            {progressiveHint.hint.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              What to Adjust
            </span>
            {renderNarrationControls(
              "hint_change",
              progressiveHint.what_to_change,
            )}
          </div>
          <p>{progressiveHint.what_to_change}</p>
          {progressiveHint.short_voice_line && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Coaching Line
                </span>
                {renderNarrationControls(
                  "hint_voice",
                  progressiveHint.short_voice_line,
                )}
              </div>
              <p className="italic text-muted-foreground">
                {progressiveHint.short_voice_line}
              </p>
            </>
          )}
        </div>
      )}
      {(voiceQueryState.progressive_hint.loading ||
        voiceQueryState.progressive_hint.answer ||
        voiceQueryState.progressive_hint.error ||
        voiceRecordingTarget === "progressive_hint") && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
              Voice Hint
            </span>
            {voiceRecordingTarget === "progressive_hint" && (
              <span className="text-[10px] text-primary">Recording...</span>
            )}
            {voiceQueryState.progressive_hint.loading && (
              <Loader2 className="size-3 animate-spin text-primary" />
            )}
          </div>
          {voiceQueryState.progressive_hint.error && (
            <p className="text-destructive">
              {voiceQueryState.progressive_hint.error}
            </p>
          )}
          {voiceQueryState.progressive_hint.transcript && (
            <p className="text-muted-foreground">
              <span className="font-semibold">You:</span>{" "}
              {voiceQueryState.progressive_hint.transcript}
            </p>
          )}
          {voiceQueryState.progressive_hint.answer && (
            <div className="mt-1">
              <EquationRenderer
                content={voiceQueryState.progressive_hint.answer}
                showFrame={false}
                size="sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-border/50 bg-card p-5">
      <div>
        <h2 className="font-display text-[18px] font-bold tracking-wide text-foreground">
          AI Coach
        </h2>
        <p className="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          Gemini + ElevenLabs
        </p>
      </div>

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

      <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="uppercase tracking-wide">Voice Volume</span>
          <span>{Math.round(narrationVolume * 100)}%</span>
        </div>
        <Slider
          value={[Math.round(narrationVolume * 100)]}
          max={100}
          step={5}
          onValueChange={(value) => {
            const next = Math.min(1, Math.max(0, (value[0] ?? 0) / 100));
            setNarrationVolume(next);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
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
        <Button
          type="button"
          variant="outline"
          className="gap-2 font-mono text-xs"
          onClick={() => handleVoiceButton("coach_panel")}
        >
          {voiceRecordingTarget === "coach_panel" ? (
            <>
              <Square className="size-3.5" />
              Stop Voice
            </>
          ) : (
            <>
              <Mic className="size-3.5" />
              Voice Question
            </>
          )}
        </Button>
      </div>

      {(voiceQueryState.coach_panel.loading ||
        voiceQueryState.coach_panel.answer ||
        voiceQueryState.coach_panel.error ||
        voiceRecordingTarget === "coach_panel") && (
        <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Voice Coaching
            </span>
            {voiceRecordingTarget === "coach_panel" && (
              <span className="text-[10px] text-primary">Recording...</span>
            )}
            {voiceQueryState.coach_panel.loading && (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
          </div>
          {voiceQueryState.coach_panel.error && (
            <p className="text-destructive">
              {voiceQueryState.coach_panel.error}
            </p>
          )}
          {voiceQueryState.coach_panel.transcript && (
            <p className="mb-1 text-muted-foreground">
              <span className="font-semibold">You:</span>{" "}
              {voiceQueryState.coach_panel.transcript}
            </p>
          )}
          {voiceQueryState.coach_panel.answer && (
            <EquationRenderer
              content={voiceQueryState.coach_panel.answer}
              showFrame={false}
              size="sm"
            />
          )}
        </div>
      )}

      <Separator className="bg-border/50" />

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
              Adjust the robot parameters, then click Explain to get AI coaching
              feedback.
            </p>
          </div>
        )}

        {!loading && response && (
          <div className="max-h-[46vh] overflow-y-auto pr-1">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-foreground">
                  {response.title}
                </h3>
                {renderNarrationControls(
                  "coach_title",
                  response.short_voice_script ||
                    `${response.title}. ${response.how_it_moves}`,
                )}
              </div>

              {response.what_changed.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      What Changed
                    </span>
                    {renderNarrationControls(
                      "coach_changes",
                      response.what_changed.join(". "),
                    )}
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {response.what_changed.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <EquationRenderer content={item} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    How It Moves
                  </span>
                  {renderNarrationControls(
                    "coach_motion",
                    response.how_it_moves,
                  )}
                </div>
                <EquationRenderer content={response.how_it_moves} />
              </div>

              {response.math_deep_dive && (
                <div className="flex flex-col overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.02]">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                        <BookOpen className="size-3 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-display text-xs font-semibold text-foreground">
                          Math Deep Dive
                        </span>
                        <span className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                          Equations &amp; Derivations
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      {renderNarrationControls(
                        "coach_math",
                        response.math_deep_dive,
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => setMathExpanded((prev) => !prev)}
                        aria-label="Toggle math details"
                      >
                        <ChevronDown
                          className={`size-4 transition-transform duration-200 ${mathExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                  {mathExpanded && (
                    <div className="border-t border-primary/10 px-3 py-4">
                      <EquationRenderer content={response.math_deep_dive} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      Try This Next
                    </span>
                    {renderNarrationControls("coach_tip", response.one_tip)}
                  </div>
                  <EquationRenderer content={response.one_tip} />
                </div>
              </div>

              {response.safety_note && (
                <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                        Safety Note
                      </span>
                      {renderNarrationControls(
                        "coach_safety",
                        response.safety_note,
                      )}
                    </div>
                    <EquationRenderer content={response.safety_note} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-border/50" />

      {renderHintSection()}

      {renderSectionAudioElements()}
    </div>
  );
}

function mergePcmChunks(
  chunks: Float32Array[],
  totalLength: number,
): Float32Array {
  if (chunks.length === 1 && chunks[0].length === totalLength) {
    return chunks[0];
  }

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function normalizePcmSamples(samples: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }

  if (peak === 0 || peak >= 0.95) {
    return samples;
  }

  const gain = 0.95 / peak;
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = Math.max(-1, Math.min(1, samples[i] * gain));
  }
  return samples;
}

function encodeWavFromFloat32(
  samples: Float32Array,
  sampleRate: number,
): ArrayBuffer {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
    offset += value.length;
  };

  const writeUint32 = (value: number) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };

  const writeUint16 = (value: number) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };

  let offset = 0;
  writeString("RIFF");
  writeUint32(36 + dataLength);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16);
  writeUint16(1);
  writeUint16(1);
  writeUint32(Math.round(sampleRate));
  writeUint32(Math.round(sampleRate) * bytesPerSample);
  writeUint16(bytesPerSample);
  writeUint16(16);
  writeString("data");
  writeUint32(dataLength);

  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return buffer;
}
