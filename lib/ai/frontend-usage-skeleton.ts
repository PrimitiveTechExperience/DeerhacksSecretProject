/**
 * Centralized skeleton for all frontend AI usages currently in the app.
 * This provides one backend contract you can later wire to real providers.
 */

export type FrontendAiUsage =
  | "coach_explain_configuration"
  | "coach_level_hint"
  | "coach_theory_solution_review"
  | "voice_narration"

export interface FrontendAiUsageRequest {
  usage: FrontendAiUsage
  payload: Record<string, unknown>
}

export interface FrontendAiUsageResult {
  ok: boolean
  usage: FrontendAiUsage
  implemented: boolean
  data?: Record<string, unknown>
  error?: string
}

export async function runFrontendAiUsageSkeleton(
  request: FrontendAiUsageRequest
): Promise<FrontendAiUsageResult> {
  switch (request.usage) {
    case "coach_explain_configuration":
      return skeleton(
        request.usage,
        {
          title: "TODO: explain configuration",
          what_changed: [],
          how_it_moves: "",
          math_deep_dive: "",
          one_tip: "",
          safety_note: null,
          short_voice_script: "",
        },
        "Wire this to your LLM call for /api/coach."
      )

    case "coach_level_hint":
      return skeleton(
        request.usage,
        {
          hint: [],
          what_to_change: "",
          short_voice_line: "",
        },
        "Wire this to your level-hint model call for /api/coach/level-hint."
      )

    case "coach_theory_solution_review":
      return skeleton(
        request.usage,
        {
          reply: "",
        },
        "Wire this to your multimodal theory-review call for /api/coach/theory-chat."
      )

    case "voice_narration":
      return skeleton(
        request.usage,
        {
          audio_base64: "",
          mime_type: "audio/mpeg",
        },
        "Wire this to your TTS provider call for /api/narrate."
      )

    default:
      return {
        ok: false,
        usage: request.usage,
        implemented: false,
        error: "Unsupported usage",
      }
  }
}

function skeleton(
  usage: FrontendAiUsage,
  data: Record<string, unknown>,
  note: string
): FrontendAiUsageResult {
  return {
    ok: true,
    usage,
    implemented: false,
    data: {
      ...data,
      _todo: note,
    },
  }
}

