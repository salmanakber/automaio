import { prisma } from '@/lib/prisma'
import type { OptimizationMode } from '@/lib/ai/model-catalog'
import { isPlatformSettingsRecord } from '@/lib/ai/model-catalog'

export const PLATFORM_SETTINGS_MODEL = '__platform_settings__'

export type PlatformAISettings = {
  primaryModel: string
  optimizationMode: OptimizationMode
}

const DEFAULTS: PlatformAISettings = {
  primaryModel: 'gemini-2.0-flash',
  optimizationMode: 'balanced',
}

export const DEFAULT_PRIMARY_MODEL = DEFAULTS.primaryModel

export async function getPlatformAISettings(): Promise<PlatformAISettings> {
  const row = await prisma.aIModelConfig.findFirst({
    where: { modelName: PLATFORM_SETTINGS_MODEL, organizationId: null },
  })

  if (!row?.configMetadata || typeof row.configMetadata !== 'object') {
    return DEFAULTS
  }

  const meta = row.configMetadata as Record<string, string>
  return {
    primaryModel: meta.primaryModel ?? DEFAULTS.primaryModel,
    optimizationMode: (meta.optimizationMode as OptimizationMode) ?? DEFAULTS.optimizationMode,
  }
}

export async function setPlatformAISettings(settings: Partial<PlatformAISettings>) {
  const current = await getPlatformAISettings()
  const next: PlatformAISettings = { ...current, ...settings }

  const existing = await prisma.aIModelConfig.findFirst({
    where: { modelName: PLATFORM_SETTINGS_MODEL, organizationId: null },
  })

  const data = {
    modelName: PLATFORM_SETTINGS_MODEL,
    organizationId: null as string | null,
    isActive: false,
    maxTokens: 0,
    temperature: 0,
    configMetadata: {
      primaryModel: next.primaryModel,
      optimizationMode: next.optimizationMode,
    },
  }

  if (existing) {
    return prisma.aIModelConfig.update({
      where: { id: existing.id },
      data: { configMetadata: data.configMetadata },
    })
  }

  return prisma.aIModelConfig.create({ data })
}

export function isRunnableModel(modelName: string) {
  return !isPlatformSettingsRecord(modelName)
}
