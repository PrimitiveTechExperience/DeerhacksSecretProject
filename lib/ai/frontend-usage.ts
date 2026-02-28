export const FRONTEND_AI_USAGES = [
  "coach_explain_configuration",
  "coach_level_hint",
  "coach_theory_solution_review",
  "voice_narration",
] as const

export type FrontendAiUsage = (typeof FRONTEND_AI_USAGES)[number]

export interface FrontendAiUsageRequest {
  usage: FrontendAiUsage
  payload: Record<string, unknown>
}

export interface FrontendAiUsageResult {
  ok: boolean
  usage: FrontendAiUsage | "unknown"
  implemented: boolean
  data?: Record<string, unknown>
  error?: string
}
