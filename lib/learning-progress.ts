const STORAGE_KEY = "continuum_learning_progress_v1"

export interface LearningProgress {
  completedLevels: number[]
}

const EMPTY_PROGRESS: LearningProgress = {
  completedLevels: [],
}

export function getLearningProgress(): LearningProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as LearningProgress
    if (!Array.isArray(parsed.completedLevels)) return EMPTY_PROGRESS
    return {
      completedLevels: parsed.completedLevels
        .filter((id) => Number.isFinite(id))
        .map((id) => Number(id)),
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

export function saveLearningProgress(progress: LearningProgress) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function markLevelCompleted(levelId: number): LearningProgress {
  const current = getLearningProgress()
  if (current.completedLevels.includes(levelId)) return current
  const next = {
    completedLevels: [...current.completedLevels, levelId].sort((a, b) => a - b),
  }
  saveLearningProgress(next)
  return next
}
