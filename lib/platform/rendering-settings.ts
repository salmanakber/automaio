import { prisma } from '@/lib/prisma'

export const PLATFORM_RENDERING_SETTINGS_MODEL = '__platform_rendering_settings__'

/** Default HTML line threshold (enhancementContext.md). */
export const DEFAULT_HTML_LINE_THRESHOLD = 4000

export type PlatformRenderingSettings = {
  htmlLineThreshold: number
}

const DEFAULTS: PlatformRenderingSettings = {
  htmlLineThreshold: DEFAULT_HTML_LINE_THRESHOLD,
}

export async function getPlatformRenderingSettings(): Promise<PlatformRenderingSettings> {
  const row = await prisma.aIModelConfig.findFirst({
    where: { modelName: PLATFORM_RENDERING_SETTINGS_MODEL, organizationId: null },
  })

  if (!row?.configMetadata || typeof row.configMetadata !== 'object') {
    return DEFAULTS
  }

  const meta = row.configMetadata as Record<string, unknown>
  const threshold = Number(meta.htmlLineThreshold)
  return {
    htmlLineThreshold: threshold > 0 ? threshold : DEFAULTS.htmlLineThreshold,
  }
}

export async function getHtmlLineThreshold(): Promise<number> {
  const settings = await getPlatformRenderingSettings()
  return settings.htmlLineThreshold
}

export async function setPlatformRenderingSettings(
  settings: Partial<PlatformRenderingSettings>,
) {
  const current = await getPlatformRenderingSettings()
  const next: PlatformRenderingSettings = { ...current, ...settings }

  const existing = await prisma.aIModelConfig.findFirst({
    where: { modelName: PLATFORM_RENDERING_SETTINGS_MODEL, organizationId: null },
  })

  const data = {
    modelName: PLATFORM_RENDERING_SETTINGS_MODEL,
    organizationId: null as string | null,
    isActive: false,
    maxTokens: 0,
    temperature: 0,
    configMetadata: {
      htmlLineThreshold: next.htmlLineThreshold,
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
