import { getCatalogModel, resolveApiKey, type CatalogModel } from '@/lib/ai/model-catalog'
import { generateWithGoogleGenAI } from '@/lib/ai/google-genai-client'

export type InvokeOptions = {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  apiKey?: string | null
}

export type InvokeResult = {
  content: string
  apiModel: string
  provider: string
}

function buildOpenAIMessages(systemPrompt: string | undefined, prompt: string) {
  const messages: Array<{ role: string; content: string }> = []
  if (systemPrompt?.trim()) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })
  return messages
}

async function callOpenAICompatible(
  catalog: CatalogModel,
  apiKey: string,
  options: InvokeOptions,
): Promise<InvokeResult> {
  const base = catalog.apiBaseUrl ?? 'https://api.openai.com/v1'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (catalog.provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    headers['X-Title'] = 'Automaio'
  }

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: catalog.apiModelId,
      messages: buildOpenAIMessages(options.systemPrompt, options.prompt),
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`${catalog.provider} error: ${response.statusText} — ${errBody.slice(0, 200)}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    apiModel: data.model ?? catalog.apiModelId,
    provider: catalog.provider,
  }
}

async function callAnthropic(
  catalog: CatalogModel,
  apiKey: string,
  options: InvokeOptions,
): Promise<InvokeResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: catalog.apiModelId,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      ...(options.systemPrompt?.trim() ? { system: options.systemPrompt } : {}),
      messages: [{ role: 'user', content: options.prompt.trim() }],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Anthropic error: ${response.statusText} — ${errBody.slice(0, 200)}`)
  }

  const data = await response.json()
  return {
    content: data.content?.[0]?.text ?? '',
    apiModel: catalog.apiModelId,
    provider: 'anthropic',
  }
}

/** Invoke any catalog model by ID. */
export async function invokeCatalogModel(
  modelId: string,
  options: InvokeOptions,
): Promise<InvokeResult> {
  const catalog = getCatalogModel(modelId)
  if (!catalog) {
    throw new Error(`Unknown model: ${modelId}`)
  }

  const apiKey = resolveApiKey(catalog, options.apiKey)
  if (!apiKey) {
    throw new Error(
      `No API key for ${catalog.shortLabel}. Save the provider key in Admin → AI Config.`,
    )
  }

  switch (catalog.provider) {
    case 'google': {
      const result = await generateWithGoogleGenAI(catalog, {
        prompt: options.prompt,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        apiKey,
      })
      return { ...result, provider: 'google' }
    }
    case 'anthropic':
      return callAnthropic(catalog, apiKey, options)
    case 'openai':
    case 'groq':
    case 'deepseek':
    case 'mistral':
    case 'together':
    case 'openrouter':
      return callOpenAICompatible(catalog, apiKey, options)
    default:
      throw new Error(`Unsupported provider: ${catalog.provider}`)
  }
}
