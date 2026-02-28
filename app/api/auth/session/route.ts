import { NextResponse } from "next/server"
import { readSessionFromCookie, SESSION_COOKIE_NAME } from "@/lib/auth/server-session"

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const cookieValue = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1]

  const session = readSessionFromCookie(cookieValue)
  return NextResponse.json(session)
}

