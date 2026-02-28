import { NextResponse } from "next/server"
import { writeSessionCookie } from "@/lib/auth/server-session"

export async function POST(request: Request) {
  const body = await request.json()
  const name = String(body?.name ?? "").trim()
  const email = String(body?.email ?? "").trim().toLowerCase()
  const password = String(body?.password ?? "")

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 })
  }

  const session = {
    user: {
      id: `local_${email}`,
      email,
      name,
      provider: "local" as const,
    },
  }

  const response = NextResponse.json(session)
  response.cookies.set(writeSessionCookie(session))
  return response
}

