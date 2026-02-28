import { NextResponse } from "next/server"
import { getTheoryLevelById } from "@/lib/theory-levels"

interface TheoryHelpResponse {
  guidance: string
  steps: string[]
  solution?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const levelId = Number(body?.levelId)
    const mode = body?.mode === "solution" ? "solution" : "hint"
    const attempt = typeof body?.attempt === "string" ? body.attempt : ""
    const level = getTheoryLevelById(levelId)

    if (!level) {
      return NextResponse.json(
        { guidance: "Select a valid theory level.", steps: ["Open an unlocked theory node first."] },
        { status: 404 }
      )
    }

    const fallback: TheoryHelpResponse =
      mode === "solution"
        ? {
            guidance: "Structured solution outline",
            steps: [
              "List known variables and equations from the level lesson.",
              "Substitute values step-by-step and keep units consistent.",
              "Interpret the result in physical robot behavior terms.",
            ],
            solution: `Level ${level.id}: ${level.problem}\n\nStart from the lesson equation, compute intermediate terms, then state what that means for shape/control.`,
          }
        : {
            guidance: "Try this next:",
            steps: [
              "Identify the one core equation in the lesson.",
              "Apply it to the variables in the problem.",
              "Finish with a physical interpretation sentence.",
            ],
          }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json(fallback)

    const prompt = `You are an expert continuum robotics theory tutor.
Mode: ${mode}
Level title: ${level.title}
Concept: ${level.concept}
Lesson: ${level.lesson}
Problem: ${level.problem}
Student attempt: ${attempt || "(none provided)"}

Return only valid JSON in this schema:
{
  "guidance": "one short paragraph",
  "steps": ["step 1", "step 2", "step 3"],
  "solution": "full worked solution in markdown with LaTeX (only for solution mode; otherwise null)"
}
`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: mode === "solution" ? 0.4 : 0.6, maxOutputTokens: 1200 },
        }),
      }
    )

    if (!res.ok) return NextResponse.json(fallback)

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return NextResponse.json(fallback)

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(cleaned) as TheoryHelpResponse

    if (!parsed || !Array.isArray(parsed.steps) || typeof parsed.guidance !== "string") {
      return NextResponse.json(fallback)
    }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(
      { guidance: "Could not generate help right now.", steps: ["Try again in a moment."] },
      { status: 500 }
    )
  }
}

