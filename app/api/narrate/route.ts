import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in your environment variables." },
        { status: 503 }
      )
    }

    // Using "Rachel" voice - a clear, natural-sounding voice
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!res.ok) {
      const error = await res.text()
      console.error("ElevenLabs API error:", error)
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: 502 }
      )
    }

    const audioBuffer = await res.arrayBuffer()

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
