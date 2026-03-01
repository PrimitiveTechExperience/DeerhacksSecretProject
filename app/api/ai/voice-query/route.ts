import { NextResponse } from "next/server"
import { generateGeminiContent } from "@/lib/ai/gemini"
import { transcribeSpeechWithElevenLabs, hasElevenLabsApiKey } from "@/lib/ai/elevenlabs"
import { getLevelById } from "@/lib/levels"
import { getPickPlaceLevelById } from "@/lib/pick-place-levels"

type VoiceContext = "coach_panel" | "progressive_hint" | "general"

export async function POST(request: Request) {
  if (!hasElevenLabsApiKey()) {
    return NextResponse.json(
      { ok: false, error: "ElevenLabs API key is missing." },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const audio = formData.get("audio")
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ ok: false, error: "Audio file is required." }, { status: 400 })
    }

    const context = parseContext(formData.get("context"))
    const payloadRaw = formData.get("contextPayload")
    const contextPayload =
      typeof payloadRaw === "string"
        ? parseJson(payloadRaw)
        : undefined

    const audioBuffer = await audio.arrayBuffer()
    const transcript = await transcribeSpeechWithElevenLabs(audioBuffer, audio.type || "audio/webm")

    if (!transcript) {
      return NextResponse.json({ ok: false, error: "Transcription failed." }, { status: 500 })
    }

    const prompt = buildPrompt(context, transcript, contextPayload)
    const answer = await generateGeminiContent({
      parts: [{ text: prompt }],
      temperature: 0.35,
      maxOutputTokens: 400,
    })

    if (!answer) {
      return NextResponse.json({ ok: false, error: "Gemini did not return a response." }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      transcript,
      answer: answer.trim(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice processing failed."
    console.error("Voice query error:", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

function parseContext(value: FormDataEntryValue | null): VoiceContext {
  if (value === "coach_panel" || value === "progressive_hint") return value
  return "general"
}

function parseJson(value: string | null): unknown {
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function buildPrompt(context: VoiceContext, transcript: string, payload: unknown): string {
  const payloadObj = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : undefined
  const levelIdRaw = payloadObj?.levelId
  const levelId =
    typeof levelIdRaw === "number"
      ? levelIdRaw
      : typeof levelIdRaw === "string"
        ? Number(levelIdRaw)
        : undefined
  const level = Number.isFinite(levelId)
    ? getLevelById(Number(levelId)) ?? getPickPlaceLevelById(Number(levelId))
    : undefined

  const baseContext =
    context === "coach_panel"
      ? "You are helping a user inside the simulator understand their continuum robot configuration."
      : context === "progressive_hint"
        ? "You are providing a concise, step-by-step hint for a specific continuum robotics learning level."
        : "You are answering a question about continuum robot coaching."

  const levelContextText =
    context === "progressive_hint" && level
      ? `Level context:
- id: ${level.id}
- title: ${level.title}
- concept: ${level.concept}
- goal: ${level.goal}
- challenge: ${level.challenge}
- rules: ${JSON.stringify(level.rules)}`
      : ""

  const payloadText = payload ? `Context:\n${JSON.stringify(payload, null, 2)}` : ""

  const contextPolicy =
    context === "progressive_hint"
      ? `Strict policy:
- Your answer MUST be specific to this continuum robotics level.
- Reference level terms directly (e.g., $\\kappa$, $\\phi$, $L$, target, obstacle, singularity) when relevant.
- Do NOT give generic school-math pattern advice (e.g., "input/output pattern") unless the level explicitly asks for that.
- If the user asks "how do I solve this level", answer with concrete parameter actions tied to this level's goal/challenge.`
      : ""

  return `${baseContext}

Transcribed user question:
"${transcript}"

${levelContextText}

${payloadText}

${contextPolicy}

Respond in under 160 words, using LaTeX for math symbols (e.g., $\\kappa_1$). Focus on actionable continuum-robot coaching.`
}
