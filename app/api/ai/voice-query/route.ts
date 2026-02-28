import { NextResponse } from "next/server"
import { generateGeminiContent } from "@/lib/ai/gemini"
import { transcribeSpeechWithElevenLabs, hasElevenLabsApiKey } from "@/lib/ai/elevenlabs"

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
  const baseContext =
    context === "coach_panel"
      ? "You are helping a user inside the simulator understand their continuum robot configuration."
      : context === "progressive_hint"
        ? "You are providing a concise, step-by-step hint for a specific learning level."
        : "You are answering a question about continuum robot coaching."

  const payloadText = payload ? `Context:\n${JSON.stringify(payload, null, 2)}` : ""

  return `${baseContext}

Transcribed user question:
"${transcript}"

${payloadText}

Respond in under 140 words, using LaTeX for math symbols (e.g., $\\kappa_1$). Focus on actionable coaching.`
}
