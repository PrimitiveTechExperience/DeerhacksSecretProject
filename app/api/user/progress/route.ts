import { NextResponse } from "next/server"
import { ensureSqliteInitialized } from "@/lib/db"
import { getSessionUser } from "@/lib/auth/server-user"

function unauthorized() {
  return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  const user = getSessionUser()
  if (!user) return unauthorized()

  const repo = await ensureSqliteInitialized()
  const [completedLevels, completedTheoryLevels] = await Promise.all([
    repo.listCompletedLevels(user.id, "practical"),
    repo.listCompletedLevels(user.id, "theory"),
  ])

  return NextResponse.json({
    completedLevels,
    completedTheoryLevels,
  })
}

export async function POST(request: Request) {
  const user = getSessionUser()
  if (!user) return unauthorized()

  let payload: { track?: string; levelId?: unknown }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return badRequest("Invalid JSON body.")
  }

  const track = payload.track === "theory" ? "theory" : payload.track === "practical" ? "practical" : null
  const levelId = Number(payload.levelId)

  if (!track || !Number.isFinite(levelId)) {
    return badRequest("track (practical|theory) and numeric levelId are required.")
  }

  const repo = await ensureSqliteInitialized()
  await repo.markLevelCompleted(user.id, track, levelId)

  const [completedLevels, completedTheoryLevels] = await Promise.all([
    repo.listCompletedLevels(user.id, "practical"),
    repo.listCompletedLevels(user.id, "theory"),
  ])

  return NextResponse.json({
    completedLevels,
    completedTheoryLevels,
  })
}
