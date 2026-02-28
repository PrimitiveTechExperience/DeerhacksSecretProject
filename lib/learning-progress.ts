const STORAGE_KEY = "continuum_learning_progress_v1"
const API_ROUTE = "/api/user/progress"

export interface LearningProgress {
  completedLevels: number[]
  completedTheoryLevels: number[]
}

const EMPTY_PROGRESS: LearningProgress = {
  completedLevels: [],
  completedTheoryLevels: [],
}

export function clearLearningProgressCache() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}

function readLocalProgress(): LearningProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as Partial<LearningProgress>
    const completedLevels = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : []
    const completedTheoryLevels = Array.isArray(parsed.completedTheoryLevels) ? parsed.completedTheoryLevels : []
    return {
      completedLevels: completedLevels.filter((id) => Number.isFinite(id)).map((id) => Number(id)),
      completedTheoryLevels: completedTheoryLevels.filter((id) => Number.isFinite(id)).map((id) => Number(id)),
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

function writeLocalProgress(progress: LearningProgress) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

function addLocalLevel(progress: LearningProgress, track: "practical" | "theory", levelId: number): LearningProgress {
  if (track === "practical") {
    if (progress.completedLevels.includes(levelId)) return progress
    const next = {
      completedLevels: [...progress.completedLevels, levelId].sort((a, b) => a - b),
      completedTheoryLevels: progress.completedTheoryLevels,
    }
    writeLocalProgress(next)
    return next
  }
  if (progress.completedTheoryLevels.includes(levelId)) return progress
  const next = {
    completedLevels: progress.completedLevels,
    completedTheoryLevels: [...progress.completedTheoryLevels, levelId].sort((a, b) => a - b),
  }
  writeLocalProgress(next)
  return next
}

async function fetchServerProgress(): Promise<LearningProgress | null> {
  try {
    const res = await fetch(API_ROUTE, { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<LearningProgress>
    if (
      Array.isArray(data.completedLevels) &&
      Array.isArray(data.completedTheoryLevels)
    ) {
      return {
        completedLevels: data.completedLevels.map((id) => Number(id)),
        completedTheoryLevels: data.completedTheoryLevels.map((id) => Number(id)),
      }
    }
  } catch {
    // Ignore network errors and fall back to local cache
  }
  return null
}

async function postProgressUpdate(track: "practical" | "theory", levelId: number): Promise<LearningProgress | null> {
  try {
    const res = await fetch(API_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track, levelId }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<LearningProgress>
    if (
      Array.isArray(data.completedLevels) &&
      Array.isArray(data.completedTheoryLevels)
    ) {
      return {
        completedLevels: data.completedLevels.map((id) => Number(id)),
        completedTheoryLevels: data.completedTheoryLevels.map((id) => Number(id)),
      }
    }
  } catch {
    // Ignore network/API failures and fall back to local cache
  }
  return null
}

export async function getLearningProgress(): Promise<LearningProgress> {
  const serverProgress = await fetchServerProgress()
  if (serverProgress) {
    writeLocalProgress(serverProgress)
    return serverProgress
  }
  return readLocalProgress()
}

export async function markLevelCompleted(levelId: number): Promise<LearningProgress> {
  const serverProgress = await postProgressUpdate("practical", levelId)
  if (serverProgress) {
    writeLocalProgress(serverProgress)
    return serverProgress
  }
  return addLocalLevel(readLocalProgress(), "practical", levelId)
}

export async function markTheoryLevelCompleted(levelId: number): Promise<LearningProgress> {
  const serverProgress = await postProgressUpdate("theory", levelId)
  if (serverProgress) {
    writeLocalProgress(serverProgress)
    return serverProgress
  }
  return addLocalLevel(readLocalProgress(), "theory", levelId)
}
