import { prisma } from '@/lib/prisma'
import {
  AI_MODEL_CATALOG,
  resolveApiKey,
  type AIProvider,
  type CatalogModel,
} from '@/lib/ai/model-catalog'
import { getAdminProviderKey, getProviderConfiguredMap } from '@/lib/ai/provider-keys'

/** Providers where one admin key covers every model in that family. */
export const SHARED_KEY_PROVIDERS: AIProvider[] = ['google']

export function usesSharedProviderKey(provider: AIProvider): boolean {
  return SHARED_KEY_PROVIDERS.includes(provider)
}

export async function isProviderConfigured(provider: AIProvider): Promise<boolean> {
  const map = await getProviderConfiguredMap()
  return map[provider]
}

export async function findSiblingProviderApiKey(
  provider: AIProvider,
): Promise<string | null> {
  if (!usesSharedProviderKey(provider)) return null

  const modelIds = AI_MODEL_CATALOG.filter((m) => m.provider === provider).map((m) => m.id)
  const row = await prisma.aIModelConfig.findFirst({
    where: {
      organizationId: null,
      modelName: { in: modelIds },
      apiKey: { not: null },
    },
    select: { apiKey: true },
  })
  return row?.apiKey ?? null
}

/** Admin provider key → per-model override → legacy sibling → env fallback. */
export async function resolveModelApiKey(
  catalog: CatalogModel,
  storedKey?: string | null,
): Promise<string> {
  if (storedKey?.trim()) return storedKey.trim()

  const adminKey = await getAdminProviderKey(catalog.provider)
  if (adminKey) return adminKey

  const sibling = await findSiblingProviderApiKey(catalog.provider)
  if (sibling) return sibling

  return resolveApiKey(catalog, null)
}

export async function assertCanRegisterModel(
  catalog: CatalogModel,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (await isProviderConfigured(catalog.provider)) return { ok: true }
  if (await findSiblingProviderApiKey(catalog.provider)) return { ok: true }

  if (catalog.provider === 'google') {
    return {
      ok: false,
      message:
        'Save your Google Gemini API key in Provider API keys above first — one key works for all Gemini models.',
    }
  }

  return {
    ok: false,
    message: `Save your ${catalog.provider} API key in Provider API keys above before adding this model.`,
  }
}

export function getProviderKeyHint(provider: AIProvider): string {
  if (provider === 'google') {
    return 'One Google API key in Admin powers every Gemini model (Flash, Pro, Preview). Save it once under Provider API keys.'
  }
  return 'Save your provider API key once under Provider API keys — no .env file needed.'
}
