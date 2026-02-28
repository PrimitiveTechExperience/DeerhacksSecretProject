import { NextResponse } from "next/server"
import { runFrontendAiUsageSkeleton, type FrontendAiUsageRequest } from "@/lib/ai/frontend-usage-skeleton"

/**
 * Generic AI usage endpoint skeleton.
 * Frontend AI usages discovered in this codebase:
 * - /api/coach
 * - /api/coach/level-hint
 * - /api/coach/theory-chat
 * - /api/narrate
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FrontendAiUsageRequest
    const result = await runFrontendAiUsageSkeleton(body)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      {
        ok: false,
        implemented: false,
        error: "Invalid request body for AI usage skeleton.",
      },
      { status: 400 }
    )
  }
}

