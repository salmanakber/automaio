import { GoogleGenAI } from '@google/genai'
import type { CatalogModel } from '@/lib/ai/model-catalog'

function getGeminiApiKey(override?: string | null): string {
  return override || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
}

export type GoogleGenerateOptions = {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  apiKey?: string | null
}

/** Official Google GenAI SDK — uses GEMINI_API_KEY / GOOGLE_API_KEY from env when apiKey omitted. */
export async function generateWithGoogleGenAI(
  catalog: CatalogModel,
  options: GoogleGenerateOptions,
): Promise<{ content: string; apiModel: string }> {
  const apiKey = getGeminiApiKey(options.apiKey)
  if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment')
  }

  const client = new GoogleGenAI({ apiKey })

  const response = await client.models.generateContent({
    model: catalog.apiModelId,
    contents: options.prompt.trim(),
    config: {
      ...(options.systemPrompt?.trim()
        ? { systemInstruction: options.systemPrompt.trim() }
        : {}),
      maxOutputTokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    },
  })

  const content = response.text ?? ''

  return {
    content,
    apiModel: catalog.apiModelId,
  }
}
