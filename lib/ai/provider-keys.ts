import { prisma } from '@/lib/prisma'
import type { AIProvider } from '@/lib/ai/model-catalog'

export const PROVIDER_KEYS_MODEL = '__provider_keys__'

export type ProviderKeysMap = Partial<Record<AIProvider, string>>

export type ProviderKeyStatus = Record<
  AIProvider,
  { configured: boolean; masked: string | null }
>

const ALL_PROVIDERS: AIProvider[] = [
  'google',
  'openai',
  'anthropic',
  'groq',
  'deepseek',
  'mistral',
  'together',
  'openrouter',
]

export function isProviderKeysRecord(modelName: string) {
  return modelName === PROVIDER_KEYS_MODEL
}

export function isInternalAIModelRecord(modelName: string) {
  return modelName === '__platform_settings__' || isProviderKeysRecord(modelName)
}

function maskApiKey(key: string): string {
  if (key.length <= 4) return '••••'
  return `••••${key.slice(-4)}`
}

export async function getAdminProviderKeys(): Promise<ProviderKeysMap> {
  const row = await prisma.aIModelConfig.findFirst({
    where: { modelName: PROVIDER_KEYS_MODEL, organizationId: null },
  })
  if (!row?.configMetadata || typeof row.configMetadata !== 'object') {
    return {}
  }
  const raw = row.configMetadata as Record<string, unknown>
  const keys: ProviderKeysMap = {}
  for (const provider of ALL_PROVIDERS) {
    const value = raw[provider]
    if (typeof value === 'string' && value.trim()) {
      keys[provider] = value.trim()
    }
  }
  return keys
}

export async function getAdminProviderKey(provider: AIProvider): Promise<string | null> {
  const keys = await getAdminProviderKeys()
  return keys[provider] ?? null
}

export async function setAdminProviderKeys(
  updates: Partial<Record<AIProvider, string | null>>,
): Promise<ProviderKeysMap> {
  const current = await getAdminProviderKeys()
  const next: ProviderKeysMap = { ...current }

  for (const provider of ALL_PROVIDERS) {
    if (!(provider in updates)) continue
    const value = updates[provider]
    if (value === null || value === undefined || value === '') {
      delete next[provider]
    } else {
      next[provider] = value.trim()
    }
  }

  const existing = await prisma.aIModelConfig.findFirst({
    where: { modelName: PROVIDER_KEYS_MODEL, organizationId: null },
  })

  const data = {
    modelName: PROVIDER_KEYS_MODEL,
    organizationId: null as string | null,
    isActive: false,
    maxTokens: 0,
    temperature: 0,
    configMetadata: next as Record<string, string>,
  }

  if (existing) {
    await prisma.aIModelConfig.update({
      where: { id: existing.id },
      data: { configMetadata: data.configMetadata },
    })
  } else {
    await prisma.aIModelConfig.create({ data })
  }

  return next
}

export async function getProviderKeyStatus(): Promise<ProviderKeyStatus> {
  const keys = await getAdminProviderKeys()
  return Object.fromEntries(
    ALL_PROVIDERS.map((provider) => [
      provider,
      {
        configured: Boolean(keys[provider]),
        masked: keys[provider] ? maskApiKey(keys[provider]!) : null,
      },
    ]),
  ) as ProviderKeyStatus
}

/** Boolean map for UI filters (admin-stored keys only). */
export async function getProviderConfiguredMap(): Promise<Record<AIProvider, boolean>> {
  const keys = await getAdminProviderKeys()
  return Object.fromEntries(
    ALL_PROVIDERS.map((p) => [p, Boolean(keys[p])]),
  ) as Record<AIProvider, boolean>
}

export { ALL_PROVIDERS as PROVIDER_KEY_IDS }
