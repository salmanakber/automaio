import { prisma } from '@/lib/prisma'
import {
  AI_MODEL_CATALOG,
  buildCatalogOptionGroups,
  isPlatformSettingsRecord,
} from '@/lib/ai/model-catalog'
import { getPlatformAISettings } from '@/lib/ai/platform-settings'
import { getProviderConfiguredMap, getProviderKeyStatus } from '@/lib/ai/provider-keys'

export async function listAdminAIModels() {
  const [configs, settings] = await Promise.all([
    prisma.aIModelConfig.findMany({
      where: { organizationId: null },
      orderBy: [{ fallbackOrder: 'asc' }, { modelName: 'asc' }],
    }),
    getPlatformAISettings(),
  ])

  const models = configs
    .filter((c) => !isPlatformSettingsRecord(c.modelName))
    .map((c) => ({
      id: c.id,
      modelName: c.modelName,
      isActive: c.isActive,
      maxTokens: c.maxTokens,
      temperature: Number(c.temperature),
      fallbackOrder: c.fallbackOrder,
      hasStoredApiKey: Boolean(c.apiKey),
      catalogLabel:
        AI_MODEL_CATALOG.find((m) => m.id === c.modelName)?.shortLabel ?? c.modelName,
      provider: AI_MODEL_CATALOG.find((m) => m.id === c.modelName)?.provider ?? 'openai',
    }))

  const failureCounts = await prisma.aIObservabilityLog.groupBy({
    by: ['modelName'],
    where: { requestStatus: 'failed' },
    _count: { id: true },
  })

  const failureMap = Object.fromEntries(
    failureCounts.map((f) => [f.modelName, f._count.id]),
  )

  const providers = await getProviderConfiguredMap()
  const providerKeys = await getProviderKeyStatus()

  return {
    configs: models.map((m) => ({
      ...m,
      failures: failureMap[m.modelName] ?? 0,
    })),
    settings,
    providers,
    providerKeys,
    catalogGroups: buildCatalogOptionGroups(providers),
    catalog: AI_MODEL_CATALOG.map((m) => ({
      id: m.id,
      shortLabel: m.shortLabel,
      description: m.description,
      provider: m.provider,
      tier: m.tier,
      recommended: m.recommended,
      preview: m.preview,
      keyConfigured: providers[m.provider],
    })),
  }
}

export async function getNextFallbackOrder() {
  const max = await prisma.aIModelConfig.aggregate({
    where: {
      organizationId: null,
      modelName: { notIn: ['__platform_settings__', '__provider_keys__'] },
    },
    _max: { fallbackOrder: true },
  })
  return (max._max.fallbackOrder ?? 0) + 1
}
