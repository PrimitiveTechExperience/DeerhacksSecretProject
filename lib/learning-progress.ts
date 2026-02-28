const STORAGE_KEY = "continuum_learning_progress_v1"

export interface LearningProgress {
  completedLevels: number[]
  completedTheoryLevels: number[]
}

const EMPTY_PROGRESS: LearningProgress = {
  completedLevels: [],
  completedTheoryLevels: [],
}

export function getLearningProgress(): LearningProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as Partial<LearningProgress>
    const completedLevels = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : []
    const completedTheoryLevels = Array.isArray(parsed.completedTheoryLevels) ? parsed.completedTheoryLevels : []
    return {
      completedLevels: completedLevels
        .filter((id) => Number.isFinite(id))
        .map((id) => Number(id)),
      completedTheoryLevels: completedTheoryLevels
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
    completedTheoryLevels: current.completedTheoryLevels,
  }
  saveLearningProgress(next)
  return next
}

export function markTheoryLevelCompleted(levelId: number): LearningProgress {
  const current = getLearningProgress()
  if (current.completedTheoryLevels.includes(levelId)) return current
  const next = {
    completedLevels: current.completedLevels,
    completedTheoryLevels: [...current.completedTheoryLevels, levelId].sort((a, b) => a - b),
  }
  saveLearningProgress(next)
  return next
}
