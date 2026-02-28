import { NextResponse } from "next/server"
import { getTheoryLevelById } from "@/lib/theory-levels"
import { generateGeminiContent, hasGeminiApiKey } from "@/lib/ai/gemini"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

function fileIsText(filename: string) {
  const lower = filename.toLowerCase()
  return lower.endsWith(".md") || lower.endsWith(".tex") || lower.endsWith(".txt")
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const levelId = Number(form.get("levelId"))
    const answer = String(form.get("answer") ?? "")
    const message = String(form.get("message") ?? "")
    const historyRaw = String(form.get("history") ?? "[]")
    const history = JSON.parse(historyRaw) as ChatMessage[]
    const level = getTheoryLevelById(levelId)

    if (!level) {
      return NextResponse.json({ reply: "Select a valid theory level first." }, { status: 404 })
    }

    const files = form.getAll("files").filter((value): value is File => value instanceof File)

    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = []
    const fileTextChunks: string[] = []

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer())
        imageParts.push({
          inlineData: {
            mimeType: file.type,
            data: buffer.toString("base64"),
          },
        })
      } else if (fileIsText(file.name)) {
        const text = await file.text()
        const clipped = text.length > 16000 ? `${text.slice(0, 16000)}\n...[truncated]` : text
        fileTextChunks.push(`File: ${file.name}\n${clipped}`)
      }
    }

    const contextPrompt = `You are a continuum robotics theory tutor in a chat session.
Level: ${level.title}
Concept: ${level.concept}
Lesson: ${level.lesson}
Problem: ${level.problem}

Student draft answer:
${answer || "(none provided yet)"}

Recent chat:
${history.slice(-8).map((item) => `${item.role.toUpperCase()}: ${item.content}`).join("\n")}

Student message:
${message || "Please review my current answer and give feedback."}

If files are provided, include them in your analysis. For images, infer math/work shown.
Respond with:
1) Brief assessment
2) Specific corrections/gaps
3) Next concrete step
Use markdown and LaTeX where useful.`

    if (!hasGeminiApiKey()) {
      return NextResponse.json({
        reply:
          "Initial review: your approach is plausible. Check units and state each assumption explicitly. Next step: substitute values symbolically before numeric evaluation.",
      })
    }

    const textParts = fileTextChunks.map((chunk) => ({ text: chunk }))
    let reply: string | null = null
    try {
      reply = await generateGeminiContent({
        parts: [{ text: contextPrompt }, ...textParts, ...imageParts],
        temperature: 0.5,
        maxOutputTokens: 1400,
      })
    } catch (error) {
      console.error("Gemini theory-chat error:", error)
    }

    if (!reply) {
      return NextResponse.json({
        reply: "I could not analyze that upload right now. Try sending a shorter message or fewer files.",
      })
    }

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: "Theory chat failed. Please try again." }, { status: 500 })
  }
}

