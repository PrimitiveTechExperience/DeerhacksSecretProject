import { Buffer } from "node:buffer"
import { NextResponse } from "next/server"
import { POST as explainConfiguration } from "@/app/api/coach/route"
import { POST as levelHint } from "@/app/api/coach/level-hint/route"
import { POST as theoryReview } from "@/app/api/coach/theory-chat/route"
import { POST as narrate } from "@/app/api/narrate/route"
import {
  FRONTEND_AI_USAGES,
  type FrontendAiUsage,
  type FrontendAiUsageRequest,
  type FrontendAiUsageResult,
} from "@/lib/ai/frontend-usage"
import { generateGeminiContent, hasGeminiApiKey } from "@/lib/ai/gemini"

const USAGE_SET = new Set<FrontendAiUsage>(FRONTEND_AI_USAGES)
console.log("HI BACK");
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FrontendAiUsageRequest
    if (!isFrontendAiUsage(body?.usage)) {
      return NextResponse.json(
        {
          ok: false,
          usage: "unknown",
          implemented: false,
          error: "Invalid or missing usage field.",
        },
        { status: 400 }
      )
    }

    const result = await runFrontendAiUsage(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    console.error("AI usage request error:", error)
    return NextResponse.json(
      {
        ok: false,
        usage: "unknown",
        implemented: false,
        error: "Invalid request body for AI usage.",
      },
      { status: 400 }
    )
  }
}

async function runFrontendAiUsage(request: FrontendAiUsageRequest): Promise<FrontendAiUsageResult> {
  switch (request.usage) {
    case "coach_explain_configuration":
      return proxyJsonRoute(request.usage, explainConfiguration, request.payload)
    case "coach_level_hint":
      return proxyJsonRoute(request.usage, levelHint, request.payload)
    case "coach_theory_solution_review":
      return proxyTheoryChat(request.usage, request.payload)
    case "voice_narration":
      return proxyNarration(request.usage, request.payload)
    default:
      return {
        ok: false,
        usage: request.usage,
        implemented: false,
        error: "Unsupported AI usage.",
      }
  }
}

type RouteHandler = (request: Request) => Promise<Response>

async function proxyJsonRoute(
  usage: FrontendAiUsage,
  handler: RouteHandler,
  payload: Record<string, unknown>
): Promise<FrontendAiUsageResult> {
  const response = await handler(
    new Request("http://internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  )

  const data = await tryParseJson(response)
  if (response.ok) {
    return {
      ok: true,
      usage,
      implemented: true,
      data: (data as Record<string, unknown>) ?? {},
    }
  }

  return {
    ok: false,
    usage,
    implemented: true,
    error: extractErrorMessage(data),
    data: typeof data === "object" && data !== null ? (data as Record<string, unknown>) : undefined,
  }
}

async function proxyTheoryChat(
  usage: FrontendAiUsage,
  payload: Record<string, unknown>
): Promise<FrontendAiUsageResult> {
  const form = new FormData()

  if (payload.levelId !== undefined) form.append("levelId", String(payload.levelId))
  if (payload.answer !== undefined) form.append("answer", String(payload.answer ?? ""))
  if (payload.message !== undefined) form.append("message", String(payload.message ?? ""))

  const historyValue =
    typeof payload.history === "string" ? payload.history : JSON.stringify(payload.history ?? [])
  form.append("history", historyValue)

  if (Array.isArray(payload.files)) {
    payload.files.forEach((file, index) => {
      if (!file || typeof file.data !== "string") return
      const buffer = Buffer.from(file.data, file.encoding === "base64" ? "base64" : undefined)
      const type = typeof file.type === "string" ? file.type : "application/octet-stream"
      const name = typeof file.name === "string" ? file.name : `upload-${index + 1}`
      const blob = new Blob([buffer], { type })
      form.append("files", blob, name)
    })
  }

  const response = await theoryReview(
    new Request("http://internal", {
      method: "POST",
      body: form,
    })
  )

  const data = await tryParseJson(response)
  if (response.ok) {
    return {
      ok: true,
      usage,
      implemented: true,
      data: (data as Record<string, unknown>) ?? {},
    }
  }

  return {
    ok: false,
    usage,
    implemented: true,
    error: extractErrorMessage(data),
    data: typeof data === "object" && data !== null ? (data as Record<string, unknown>) : undefined,
  }
}

async function proxyNarration(
  usage: FrontendAiUsage,
  payload: Record<string, unknown>
): Promise<FrontendAiUsageResult> {
  const text = typeof payload.text === "string" ? payload.text.trim() : ""
  if (!text) {
    return {
      ok: false,
      usage,
      implemented: true,
      error: "Missing text field for narration.",
    }
  }

  const normalizedText = await prepareSpeechFriendlyText(text)

  const response = await narrate(
    new Request("http://internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizedText }),
    })
  )

  if (!response.ok) {
    const data = await tryParseJson(response)
    return {
      ok: false,
      usage,
      implemented: true,
      error: extractErrorMessage(data),
    }
  }

  const audioBuffer = await response.arrayBuffer()
  const mimeType = response.headers.get("Content-Type") ?? "audio/mpeg"
  const audioBase64 = Buffer.from(audioBuffer).toString("base64")

  return {
    ok: true,
    usage,
    implemented: true,
    data: {
      audio_base64: audioBase64,
      mime_type: mimeType,
    },
  }
}

async function prepareSpeechFriendlyText(original: string): Promise<string> {
  if (!hasGeminiApiKey()) return original

  const prompt = `Rewrite the following coach output so that it is easy for a text-to-speech voice to read aloud.
- Replace LaTeX or math notation with spoken descriptions (e.g., "$\\kappa$" -> "kappa").
- Break dense math into short sentences.
- Preserve the technical meaning but keep it conversational and under 120 words if possible.
- Do not include markdown code fences or LaTeX delimiters.

COACH OUTPUT:
${original}`

  try {
    const result = await generateGeminiContent({
      parts: [{ text: prompt }],
      temperature: 0.3,
      maxOutputTokens: 300,
    })
    if (typeof result === "string" && result.trim().length > 0) {
      return result.trim()
    }
  } catch (error) {
    console.error("prepareSpeechFriendlyText error:", error)
  }
  return original
}

async function tryParseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type") ?? ""
  if (!contentType.includes("application/json")) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function extractErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error
  }
  return "AI request failed."
}

function isFrontendAiUsage(value: unknown): value is FrontendAiUsage {
  return typeof value === "string" && USAGE_SET.has(value as FrontendAiUsage)
}

