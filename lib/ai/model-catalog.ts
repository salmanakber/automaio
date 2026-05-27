export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'google'
  | 'deepseek'
  | 'mistral'
  | 'together'
  | 'openrouter'

export type ModelTier = 'budget' | 'balanced' | 'quality'

export type GoogleSubgroup = 'preview' | 'flash' | 'pro' | 'legacy'

export type CatalogModel = {
  /** Stable ID stored in DB */
  id: string
  /** Short name in dropdowns */
  shortLabel: string
  /** One-line hint */
  description?: string
  provider: AIProvider
  envKey: string
  /** Provider API model string (e.g. gemini-3-flash-preview) */
  apiModelId: string
  tier: ModelTier
  apiBaseUrl?: string
  recommended?: boolean
  preview?: boolean
  googleSubgroup?: GoogleSubgroup
}

export type CatalogOptionGroup = {
  key: string
  label: string
  provider: AIProvider
  models: CatalogModel[]
}

function geminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
}

/** All models — curated list (not every Google variant). */
export const AI_MODEL_CATALOG: CatalogModel[] = [
  // Google Gemini — official @google/genai SDK
  {
    id: 'gemini-3-flash-preview',
    shortLabel: 'Gemini 3 Flash (Preview)',
    description: 'Latest preview — fast, use for testing new features',
    provider: 'google',
    envKey: 'GEMINI_API_KEY',
    apiModelId: 'gemini-3-flash-preview',
    tier: 'budget',
    googleSubgroup: 'preview',
    preview: true,
    recommended: true,
  },
  {
    id: 'gemini-2.5-flash-preview',
    shortLabel: 'Gemini 2.5 Flash (Preview)',
    description: 'Preview flash model',
    provider: 'google',
    envKey: 'GEMINI_API_KEY',
    apiModelId: 'gemini-2.5-flash-preview',
    tier: 'budget',
    googleSubgroup: 'preview',
    preview: true,
  },
  {
    id: 'gemini-2.0-flash',
    shortLabel: 'Gemini 2.0 Flash',
    description: 'Best default — fast & cheap for marketing copy',
    provider: 'google',
    envKey: 'GEMINI_API_KEY',
    apiModelId: 'gemini-2.0-flash',
    tier: 'budget',
    googleSubgroup: 'flash',
    recommended: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    shortLabel: 'Gemini 2.0 Flash Lite',
    description: 'Lowest cost Gemini',
    provider: 'google',
    envKey: 'GEMINI_API_KEY',
    apiModelId: 'gemini-2.0-flash-lite',
    tier: 'budget',
    googleSubgroup: 'flash',
  },
  {
    id: 'gemini-2.0-pro',
    shortLabel: 'Gemini 2.0 Pro',
    description: 'Higher quality Google model',
    provider: 'google',
    envKey: 'GEMINI_API_KEY',
    apiModelId: 'gemini-2.0-pro',
    tier: 'quality',
    googleSubgroup: 'pro',
  },
  {
    id: 'gemini-1.5-pro',
    shortLabel: 'Gemini 1.5 Pro',
    description: 'Previous generation pro',
    provider: 'google',
    envKey: 'GEMINI_API_KEY',
    apiModelId: 'gemini-1.5-pro',
    tier: 'quality',
    googleSubgroup: 'legacy',
  },

  // Groq
  {
    id: 'llama-3.1-8b-instant',
    shortLabel: 'Llama 3.1 8B Instant',
    description: 'Ultra-fast open model on Groq',
    provider: 'groq',
    envKey: 'GROQ_API_KEY',
    apiModelId: 'llama-3.1-8b-instant',
    tier: 'budget',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
    recommended: true,
  },
  {
    id: 'llama-3.3-70b-versatile',
    shortLabel: 'Llama 3.3 70B Versatile',
    provider: 'groq',
    envKey: 'GROQ_API_KEY',
    apiModelId: 'llama-3.3-70b-versatile',
    tier: 'balanced',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'mixtral-8x7b',
    shortLabel: 'Mixtral 8x7B',
    provider: 'groq',
    envKey: 'GROQ_API_KEY',
    apiModelId: 'mixtral-8x7b-32768',
    tier: 'balanced',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
  },


  // DeepSeek
  {
    id: 'deepseek-chat',
    shortLabel: 'DeepSeek Chat',
    description: 'Low cost, strong for copy',
    provider: 'deepseek',
    envKey: 'DEEPSEEK_API_KEY',
    apiModelId: 'deepseek-chat',
    tier: 'budget',
    apiBaseUrl: 'https://api.deepseek.com/v1',
    recommended: true,
  },
  {
    id: 'deepseek-reasoner',
    shortLabel: 'DeepSeek Reasoner',
    provider: 'deepseek',
    envKey: 'DEEPSEEK_API_KEY',
    apiModelId: 'deepseek-reasoner',
    tier: 'quality',
    apiBaseUrl: 'https://api.deepseek.com/v1',
  },

  // Mistral
  {
    id: 'mistral-small',
    shortLabel: 'Mistral Small',
    provider: 'mistral',
    envKey: 'MISTRAL_API_KEY',
    apiModelId: 'mistral-small-latest',
    tier: 'budget',
    apiBaseUrl: 'https://api.mistral.ai/v1',
  },
  {
    id: 'mistral-large',
    shortLabel: 'Mistral Large',
    provider: 'mistral',
    envKey: 'MISTRAL_API_KEY',
    apiModelId: 'mistral-large-latest',
    tier: 'quality',
    apiBaseUrl: 'https://api.mistral.ai/v1',
  },

  // OpenAI
  {
    id: 'gpt-4o-mini',
    shortLabel: 'GPT-4o Mini',
    provider: 'openai',
    envKey: 'OPENAI_API_KEY',
    apiModelId: 'gpt-4o-mini',
    tier: 'budget',
    apiBaseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'gpt-4o',
    shortLabel: 'GPT-4o',
    provider: 'openai',
    envKey: 'OPENAI_API_KEY',
    apiModelId: 'gpt-4o',
    tier: 'quality',
    apiBaseUrl: 'https://api.openai.com/v1',
  },

  // Anthropic
  {
    id: 'claude-3-5-haiku',
    shortLabel: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    apiModelId: 'claude-3-5-haiku-20241022',
    tier: 'budget',
  },
  {
    id: 'claude-opus-4.6',
    shortLabel: 'Claude Opus 4.6',
    provider: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    apiModelId: 'claude-opus-4-6',
    tier: 'quality',
  },

  // Together
  {
    id: 'together-llama-3.1-8b',
    shortLabel: 'Llama 3.1 8B Turbo',
    provider: 'together',
    envKey: 'TOGETHER_API_KEY',
    apiModelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    tier: 'budget',
    apiBaseUrl: 'https://api.together.xyz/v1',
  },

  // OpenRouter (proxy — requires separate key)
  {
    id: 'openrouter-deepseek',
    shortLabel: 'DeepSeek (OpenRouter)',
    description: 'DeepSeek via OpenRouter gateway',
    provider: 'openrouter',
    envKey: 'OPENROUTER_API_KEY',
    apiModelId: 'deepseek/deepseek-chat',
    tier: 'budget',
    apiBaseUrl: 'https://openrouter.ai/api/v1',
  },
]

const GOOGLE_SUBGROUP_LABELS: Record<GoogleSubgroup, string> = {
  preview: 'Preview',
  flash: 'Flash — recommended',
  pro: 'Pro',
  legacy: 'Legacy',
}

const PROVIDER_ORDER: AIProvider[] = [
  'google',
  'groq',
  'deepseek',
  'mistral',
  'openai',
  'anthropic',
  'together',
  'openrouter',
]

export const OPTIMIZATION_MODES = ['balanced', 'quality', 'cost'] as const
export type OptimizationMode = (typeof OPTIMIZATION_MODES)[number]

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
  google: 'Google Gemini',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  together: 'Together AI',
  openrouter: 'OpenRouter',
}

export const TIER_LABELS: Record<ModelTier, string> = {
  budget: 'Budget',
  balanced: 'Balanced',
  quality: 'Quality',
}

/** Build optgroups for &lt;select&gt; — Google split into Preview / Flash / Pro / Legacy. */
export function buildCatalogOptionGroups(
  providers?: Partial<Record<AIProvider, boolean>>,
): CatalogOptionGroup[] {
  const groups: CatalogOptionGroup[] = []

  for (const provider of PROVIDER_ORDER) {
    const models = AI_MODEL_CATALOG.filter((m) => m.provider === provider)
    if (models.length === 0) continue

    if (provider === 'google') {
      const subOrder: GoogleSubgroup[] = ['preview', 'flash', 'pro', 'legacy']
      for (const sub of subOrder) {
        const subModels = models.filter((m) => m.googleSubgroup === sub)
        if (subModels.length === 0) continue
        groups.push({
          key: `google-${sub}`,
          label: `Google Gemini — ${GOOGLE_SUBGROUP_LABELS[sub]}`,
          provider,
          models: subModels,
        })
      }
    } else {
      groups.push({
        key: provider,
        label: PROVIDER_LABELS[provider],
        provider,
        models,
      })
    }
  }

  return groups
}

/** Optgroups containing only models from the filtered list. */
export function buildFilteredCatalogOptionGroups(
  models: CatalogModel[],
  providers?: Partial<Record<AIProvider, boolean>>,
): CatalogOptionGroup[] {
  const allowed = new Set(models.map((m) => m.id))
  return buildCatalogOptionGroups(providers)
    .map((g) => ({ ...g, models: g.models.filter((m) => allowed.has(m.id)) }))
    .filter((g) => g.models.length > 0)
}

export function filterCatalogModels(options: {
  provider?: AIProvider | 'all'
  tier?: ModelTier | 'all'
  search?: string
  recommendedOnly?: boolean
  configuredIds?: Set<string>
  configuredOnly?: boolean
}): CatalogModel[] {
  let list = [...AI_MODEL_CATALOG]

  if (options.provider && options.provider !== 'all') {
    list = list.filter((m) => m.provider === options.provider)
  }
  if (options.tier && options.tier !== 'all') {
    list = list.filter((m) => m.tier === options.tier)
  }
  if (options.recommendedOnly) {
    list = list.filter((m) => m.recommended)
  }
  if (options.configuredOnly && options.configuredIds) {
    list = list.filter((m) => options.configuredIds!.has(m.id))
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase()
    list = list.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.shortLabel.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q),
    )
  }

  return list
}

export function getCatalogModel(modelName: string): CatalogModel | undefined {
  return AI_MODEL_CATALOG.find((m) => m.id === modelName)
}

/** @deprecated use shortLabel */
export function getCatalogDisplayLabel(model: CatalogModel): string {
  const tags: string[] = []
  if (model.recommended) tags.push('★')
  if (model.preview) tags.push('preview')
  if (model.tier === 'budget') tags.push('budget')
  return `${model.shortLabel}${tags.length ? ` (${tags.join(', ')})` : ''}`
}

export function resolveApiKey(catalog: CatalogModel, storedKey?: string | null): string {
  if (storedKey) return storedKey
  if (catalog.provider === 'google') return geminiKey()
  return (process.env[catalog.envKey as keyof NodeJS.ProcessEnv] as string) || ''
}

export function getProviderForModel(modelName: string): AIProvider {
  const catalog = getCatalogModel(modelName)
  if (catalog) return catalog.provider
  if (modelName.includes('gemini') || modelName.includes('google')) return 'google'
  if (modelName.includes('claude')) return 'anthropic'
  if (modelName.includes('deepseek')) return 'deepseek'
  if (modelName.includes('mistral')) return 'mistral'
  if (modelName.includes('together')) return 'together'
  if (modelName.includes('openrouter')) return 'openrouter'
  if (modelName.includes('mixtral') || modelName.includes('llama') || modelName.includes('groq'))
    return 'groq'
  return 'openai'
}

export function getEnvKeyForModel(modelName: string): string {
  return getCatalogModel(modelName)?.envKey ?? 'OPENAI_API_KEY'
}

export function isPlatformSettingsRecord(modelName: string) {
  return modelName === '__platform_settings__' || modelName === '__provider_keys__'
}

export function getProviderEnvStatus(): Record<AIProvider, boolean> {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    google: Boolean(geminiKey()),
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
    mistral: Boolean(process.env.MISTRAL_API_KEY),
    together: Boolean(process.env.TOGETHER_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
  }
}

export function getRecommendedModels(): CatalogModel[] {
  return AI_MODEL_CATALOG.filter((m) => m.recommended)
}
