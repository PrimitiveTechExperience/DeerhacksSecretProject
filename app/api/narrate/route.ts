import { NextResponse } from "next/server"
import { hasElevenLabsApiKey, synthesizeSpeechWithElevenLabs } from "@/lib/ai/elevenlabs"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      )
    }

    if (!hasElevenLabsApiKey()) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in your environment variables." },
        { status: 503 }
      )
    }

    // Using "Rachel" voice - a clear, natural-sounding voice
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"

    const audioBuffer = await synthesizeSpeechWithElevenLabs({ text, voiceId })
    if (!audioBuffer) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured." },
        { status: 503 }
      )
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (err) {
    console.error("Narrate API error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
