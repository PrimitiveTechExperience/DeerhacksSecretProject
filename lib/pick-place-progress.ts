const PICK_PLACE_PROGRESS_KEY = "continulearn_pick_place_progress_v1"

export function getPickPlaceCompletedLevels(): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(PICK_PLACE_PROGRESS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b)
  } catch {
    return []
  }
}

export function markPickPlaceLevelCompleted(levelId: number): number[] {
  const existing = getPickPlaceCompletedLevels()
  if (existing.includes(levelId)) return existing
  const next = [...existing, levelId].sort((a, b) => a - b)
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PICK_PLACE_PROGRESS_KEY, JSON.stringify(next))
  }
  return next
}
