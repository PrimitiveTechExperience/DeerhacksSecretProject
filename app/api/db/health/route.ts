import { NextResponse } from "next/server"
import { ensureSqliteInitialized } from "@/lib/db"

export async function GET() {
  try {
    await ensureSqliteInitialized()
    return NextResponse.json({ ok: true, db: "sqlite", initialized: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error"
    return NextResponse.json({ ok: false, db: "sqlite", initialized: false, error: message }, { status: 500 })
  }
}

