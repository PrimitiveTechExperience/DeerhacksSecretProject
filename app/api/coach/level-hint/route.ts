import { NextResponse } from "next/server"
import type { RobotParams } from "@/lib/types"
import { getLevelById } from "@/lib/levels"

interface LevelHintResponse {
  hint: string[]
  what_to_change: string
  short_voice_line: string
}

function fallbackHint(levelId: number): LevelHintResponse {
  const level = getLevelById(levelId)
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
    const level = getLevelById(levelId)

    if (!level) {
      return NextResponse.json(fallbackHint(levelId), { status: 404 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(fallbackHint(levelId))
    }

    const prompt = `You are an expert continuum robotics coach.
Give a short actionable hint for one level.

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
  "what_to_change": "one sentence on which controls to adjust",
  "short_voice_line": "one short spoken coaching line"
}

No markdown.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 400,
          },
        }),
      }
    )

    if (!res.ok) {
      return NextResponse.json(fallbackHint(levelId))
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json(fallbackHint(levelId))
    }

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(cleaned) as LevelHintResponse
    if (!Array.isArray(parsed.hint) || typeof parsed.what_to_change !== "string") {
      return NextResponse.json(fallbackHint(levelId))
    }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(fallbackHint(0))
  }
}
