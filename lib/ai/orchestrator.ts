import { prisma } from '@/lib/prisma'
import {
  getCatalogModel,
  getProviderForModel,
  type OptimizationMode,
} from '@/lib/ai/model-catalog'
import { invokeCatalogModel } from '@/lib/ai/invoke-catalog-model'
import { getPlatformAISettings, isRunnableModel } from '@/lib/ai/platform-settings'
import { resolveModelApiKey } from '@/lib/ai/resolve-model-api-key'

interface AIModel {
  name: string
  provider: ReturnType<typeof getProviderForModel>
  apiKey: string
  maxTokens: number
  temperature: number
  apiModelId: string
}

interface GenerationRequest {
  prompt: string
  systemPrompt?: string
  organizationId: string
  modelPreference?: string
  maxTokens?: number
  temperature?: number
}

interface GenerationResponse {
  content: string
  model: string
  tokens: number
}

class AIOrchestrator {
  private models: AIModel[] = []

  async initialize(organizationId: string) {
    const [configs, settings] = await Promise.all([
      prisma.aIModelConfig.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [{ organizationId: null }, { organizationId }],
            },
          ],
        },
        orderBy: { fallbackOrder: 'asc' },
      }),
      getPlatformAISettings(),
    ])

    const runnable = configs.filter((c) => isRunnableModel(c.modelName))

    const resolved = await Promise.all(
      runnable.map(async (config) => {
        const catalog = getCatalogModel(config.modelName)
        const apiKey = catalog
          ? await resolveModelApiKey(catalog, config.apiKey)
          : ''
        return {
          name: config.modelName,
          provider: getProviderForModel(config.modelName),
          apiKey,
          maxTokens: config.maxTokens,
          temperature: Number(config.temperature),
          apiModelId: catalog?.apiModelId ?? config.modelName,
        }
      }),
    )

    this.models = this.orderModelsForMode(
      resolved.filter((m) => m.apiKey),
      settings.primaryModel,
      settings.optimizationMode,
    )

    if (this.models.length === 0) {
      throw new Error('No AI models configured — add models in Admin → AI Config')
    }
  }

  private orderModelsForMode(
    models: AIModel[],
    primaryModel: string,
    mode: OptimizationMode,
  ) {
    const primary = models.find((m) => m.name === primaryModel)
    const rest = models.filter((m) => m.name !== primaryModel)

    const sortByPreference = (list: AIModel[], preference: string[]) => {
      return [...list].sort((a, b) => {
        const ai = preference.findIndex((p) => a.name.includes(p))
        const bi = preference.findIndex((p) => b.name.includes(p))
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
    }

    let ordered = rest
    if (mode === 'quality') {
      ordered = sortByPreference(rest, [
        'gemini-2.0-pro',
        'gemini-1.5-pro',
        'gpt-4o',
        'claude-opus',
        'claude-3-5-haiku',
      ])
    } else if (mode === 'cost') {
      ordered = sortByPreference(rest, [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'deepseek-chat',
        'llama-3.1-8b',
        'mistral-small',
        'gpt-4o-mini',
        'mixtral',
      ])
    }

    return primary ? [primary, ...ordered] : ordered
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    if (this.models.length === 0) {
      await this.initialize(request.organizationId)
    }

    let lastError: Error | null = null

    for (const model of this.models) {
      try {
        const result = await invokeCatalogModel(model.name, {
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          maxTokens: request.maxTokens || model.maxTokens,
          temperature: request.temperature || model.temperature,
          apiKey: model.apiKey,
        })

        return {
          content: result.content,
          model: model.name,
          tokens: Math.ceil(result.content.length / 4),
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.error(`[AI] Failed with ${model.name}:`, lastError.message)
      }
    }

    throw new Error(`All AI models failed. Last error: ${lastError?.message}`)
  }
}

export const aiOrchestrator = new AIOrchestrator()
