const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

export interface GeminiRequestOptions {
  parts: GeminiPart[]
  model?: string
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  topK?: number
}

export async function generateGeminiContent({
  parts,
  model = DEFAULT_MODEL,
  temperature,
  maxOutputTokens,
  topP,
  topK,
}: GeminiRequestOptions): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }

  const response = await fetch(`${API_ROOT}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP,
        topK,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await safeReadText(response)
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const textParts =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === "string" ? part.text : ""))
      .filter(Boolean) ?? []

  const text = textParts.join("\n\n").trim()
  return text.length > 0 ? text : null
}

export function stripGeminiJsonFence(text: string): string {
  return text.replace(/```json\s*|```/gi, "").trim()
}

export function parseGeminiJson<T>(text: string): T | null {
  const cleaned = stripGeminiJsonFence(text)
  if (!cleaned) return null

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const repaired = repairInvalidJsonEscapes(cleaned)
    if (repaired === cleaned) {
      return null
    }
    try {
      return JSON.parse(repaired) as T
    } catch {
      return null
    }
  }
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

export function normalizeLatexContent(text: string | undefined | null): string | undefined {
  if (!text) return text ?? undefined

  let normalized = text

  const replacements: Array<[RegExp, string]> = [
    [/\bheta\b/gi, "theta"],
    [/\bHeta\b/g, "Theta"],
    [/\bhphi\b/gi, "phi"],
    [/\bPhi\b/g, "Phi"],
    [/\\begin\{matrix\}/gi, "\\begin{bmatrix}"],
    [/\\end\{matrix\}/gi, "\\end{bmatrix}"],
    [/\\left\[/g, "\\left["],
    [/\\right\]/g, "\\right]"],
    [/\\left\(/g, "\\left("],
    [/\\right\)/g, "\\right)"],
  ]

  for (const [pattern, replacement] of replacements) {
    normalized = normalized.replace(pattern, replacement)
  }

  normalized = normalized.replace(/\\frac\{([^\}]+)\}\{([^\}]+)\}/g, (_match, numerator, denominator) => {
    return `\\dfrac{${numerator}}{${denominator}}`
  })

  normalized = balanceDollarDelimiters(normalized)
  normalized = sanitizeLatexBlocks(normalized)

  return normalized
}

function repairInvalidJsonEscapes(input: string): string {
  let changed = false
  let result = ""
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char !== "\\") {
      result += char
      continue
    }

    const next = input[i + 1]
    if (!next) {
      result += "\\\\"
      changed = true
      continue
    }

    if ('"\\/bfnrt'.includes(next)) {
      result += "\\" + next
      i += 1
      continue
    }

    if (next === "u") {
      const hex = input.slice(i + 2, i + 6)
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        result += "\\u" + hex
        i += 5
        continue
      }

      result += "\\\\u"
      changed = true
      i += 1
      continue
    }

    result += "\\\\" + next
    changed = true
    i += 1
  }

  return changed ? result : input
}

function balanceDollarDelimiters(input: string): string {
  const doubleMatches = (input.match(/\$\$/g) ?? []).length
  if (doubleMatches % 2 !== 0) {
    input = input.replace(/\$\s*$/, "")
    input = input.replace(/\$\$\s*$/, "")
  }

  const singleMatches = (input.match(/(?<!\$)\$(?!\$)/g) ?? []).length
  if (singleMatches % 2 !== 0) {
    input = input.replace(/(?<!\$)\$(?!\$)(?![^\n]*\$(?!\$))/m, "")
  }

  return input
}

function sanitizeLatexBlocks(input: string): string {
  return input.replace(/\$\$([\s\S]*?)\$\$/g, (_, block) => {
    const cleaned = sanitizeLatexMatrixBlock(block)
    return `$$\n${cleaned}\n$$`
  })
}

function sanitizeLatexMatrixBlock(block: string): string {
  let trimmed = block.trim()
  if (trimmed.includes("&") && !/\\begin\{/.test(trimmed)) {
    trimmed = `\\begin{bmatrix}\n${trimmed}\n\\end{bmatrix}`
  }

  trimmed = trimmed.replace(/\\\\\s*(\\\\)+/g, "\\\\")

  const beginMatches = (trimmed.match(/\\begin\{/g) ?? []).length
  const endMatches = (trimmed.match(/\\end\{/g) ?? []).length
  if (beginMatches > endMatches) {
    trimmed = `${trimmed}\n\\end{bmatrix}`
  } else if (endMatches > beginMatches) {
    trimmed = trimmed.replace(/\\end\{[^\}]+\}(?![\s\S]*\\begin\{)/, "")
  }

  return trimmed
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return "<no error body>"
  }
}
