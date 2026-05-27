import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { getCatalogModel } from '@/lib/ai/model-catalog'
import { invokeCatalogModel } from '@/lib/ai/invoke-catalog-model'
import { getPlatformAISettings } from '@/lib/ai/platform-settings'
import { prisma } from '@/lib/prisma'
import { resolveModelApiKey } from '@/lib/ai/resolve-model-api-key'

export async function POST(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { prompt, model: requestedModel } = await req.json()

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const settings = await getPlatformAISettings()
    const modelName = requestedModel ?? settings.primaryModel
    const catalog = getCatalogModel(modelName)

    if (!catalog) {
      return NextResponse.json({ error: 'Unknown model' }, { status: 400 })
    }

    const dbConfig = await prisma.aIModelConfig.findFirst({
      where: { modelName, organizationId: null },
    })

    const apiKey = await resolveModelApiKey(catalog, dbConfig?.apiKey)

    if (!apiKey) {
      return NextResponse.json(
        {
          error: `No API key for ${catalog.shortLabel}. Save the provider API key in Admin → AI Config first.`,
        },
        { status: 503 },
      )
    }

    const started = Date.now()
    const result = await invokeCatalogModel(modelName, {
      prompt: prompt.trim(),
      systemPrompt:
        'You are Automaio, an AI marketing assistant. Reply concisely and helpfully.',
      maxTokens: dbConfig?.maxTokens ?? 500,
      temperature: dbConfig ? Number(dbConfig.temperature) : 0.7,
      apiKey,
    })

    return NextResponse.json({
      content: result.content,
      model: modelName,
      apiModel: result.apiModel,
      provider: result.provider,
      latencyMs: Date.now() - started,
      optimizationMode: settings.optimizationMode,
    })
  } catch (error) {
    console.error('AI test error:', error)
    const message = error instanceof Error ? error.message : 'AI test failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
