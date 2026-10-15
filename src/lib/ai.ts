export type AiErrorKind = "rate_limited" | "failed"

export class AiError extends Error {
  readonly kind: AiErrorKind

  constructor(kind: AiErrorKind, message: string) {
    super(message)
    this.name = "AiError"
    this.kind = kind
  }
}

interface GeminiPart {
  text?: string
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[]
    role?: string
  }
}

interface GeminiResponse {
  candidates?: GeminiCandidate[]
}

interface GenerateTextOptions {
  system: string
  prompt: string
  maxOutputTokens?: number
}

export async function generateText({
  system,
  prompt,
  maxOutputTokens = 1024,
}: GenerateTextOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AiError("failed", "AI API key is missing")
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens },
      }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof AiError) {
      throw err
    }
    throw new AiError("failed", "AI network request failed")
  } finally {
    clearTimeout(timeoutId)
  }

  if (response.status === 429) {
    throw new AiError("rate_limited", `AI rate limit reached (${response.status})`)
  }

  if (!response.ok) {
    throw new AiError("failed", `AI generation failed (${response.status})`)
  }

  let data: GeminiResponse
  try {
    data = (await response.json()) as GeminiResponse
  } catch {
    throw new AiError("failed", "AI response parsing failed")
  }

  const parts = data.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((part) => part.text ?? "").join("").trim()

  if (!text) {
    throw new AiError("failed", "AI returned empty content")
  }

  return text
}
