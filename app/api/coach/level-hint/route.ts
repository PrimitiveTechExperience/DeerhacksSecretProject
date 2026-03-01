import { Buffer } from "node:buffer"
import { NextResponse } from "next/server"
import type { RobotParams } from "@/lib/types"
import { getLevelById } from "@/lib/levels"
import { getPickPlaceLevelById } from "@/lib/pick-place-levels"
import { generateGeminiContent, hasGeminiApiKey, parseGeminiJson } from "@/lib/ai/gemini"
import { hasElevenLabsApiKey, synthesizeSpeechWithElevenLabs } from "@/lib/ai/elevenlabs"

interface LevelHintResponse {
  hint: string[]
  what_to_change: string
  short_voice_line: string
  voice_audio_base64?: string
  voice_mime_type?: string
}

function fallbackHint(levelId: number): LevelHintResponse {
  const level = getLevelById(levelId) ?? getPickPlaceLevelById(levelId)
  if (!level) {
    return {
      hint: ["Open an unlocked level first."],
      what_to_change: "Select a valid level on the learning map.",
      short_voice_line: "Choose a level and I will help you tune the robot.",
    }
  }

  return {
    hint: [
      `Start from the level's initial setup, then adjust one parameter at a time.`,
      `After each change, compare your tip with the target and keep checking constraints.`,
    ],
    what_to_change: level.challenge,
    short_voice_line: `Focus on ${level.title}. Move one control at a time and verify with Check.`,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const levelId = Number(body?.levelId)
    const currentParams = body?.currentParams as RobotParams | undefined
    const level = getLevelById(levelId) ?? getPickPlaceLevelById(levelId)

    if (!level) {
      return NextResponse.json(fallbackHint(levelId), { status: 404 })
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json(fallbackHint(levelId))
    }

    const prompt = `You are an expert robotics coach.
Give a short actionable hint for one level. When you reference math symbols, parameters, or Greek letters, format them with LaTeX (e.g., "$\\kappa_1$", "$L_2$") so the frontend can render them properly.
Keep advice specific to the level's domain (continuum control or pick-and-place manipulation).
Level:
- id: ${level.id}
- title: ${level.title}
- concept: ${level.concept}
- goal: ${level.goal}
- challenge: ${level.challenge}

Current parameters:
${JSON.stringify(currentParams ?? level.initialParams)}

Respond in valid JSON only:
{
  "hint": ["Step 1", "Step 2"],
  "what_to_change": "one sentence on which controls to adjust (include LaTeX where helpful)",
  "short_voice_line": "one short spoken coaching line (may also contain LaTeX)"
}

No markdown.`

    let text: string | null = null
    try {
      text = await generateGeminiContent({
        parts: [{ text: prompt }],
        temperature: 0.4,
        maxOutputTokens: 400,
      })
    } catch (error) {
      console.error("Gemini level hint error:", error)
    }

    if (!text) {
      return NextResponse.json(fallbackHint(levelId))
    }

    const parsed = parseGeminiJson<LevelHintResponse>(text)
    if (!parsed) {
      console.warn("Gemini level hint response invalid JSON.")
      return NextResponse.json(fallbackHint(levelId))
    }
    if (!Array.isArray(parsed.hint) || typeof parsed.what_to_change !== "string") {
      return NextResponse.json(fallbackHint(levelId))
    }

    if (hasElevenLabsApiKey()) {
      try {
        const script = [
          `Level ${level.id}: ${level.title}`,
          `Steps: ${parsed.hint.join(". ")}`,
          `Focus: ${parsed.what_to_change}`,
          parsed.short_voice_line,
        ]
          .filter(Boolean)
          .join(". ")
        const buffer = await synthesizeSpeechWithElevenLabs({ text: script })
        if (buffer) {
          parsed.voice_audio_base64 = Buffer.from(buffer).toString("base64")
          parsed.voice_mime_type = "audio/mpeg"
        }
      } catch (error) {
        console.error("Level hint TTS error:", error)
      }
    }

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(fallbackHint(0))
  }
}
