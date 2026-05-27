'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  buildFilteredCatalogOptionGroups,
  filterCatalogModels,
  getCatalogDisplayLabel,
  PROVIDER_LABELS,
  TIER_LABELS,
  type AIProvider,
  type ModelTier,
} from '@/lib/ai/model-catalog'

type ModelCatalogPickerProps = {
  value: string
  onChange: (modelId: string) => void
  /** When true, appends a soft hint on options missing env keys (never disables selection). */
  showKeyHints?: boolean
  providers?: Partial<Record<AIProvider, boolean>>
  placeholder?: string
  allowEmpty?: boolean
  /** Limit to these catalog IDs */
  modelIds?: string[]
  className?: string
  id?: string
  showFilters?: boolean
}

const ALL_PROVIDERS: AIProvider[] = [
  'google',
  'groq',
  'deepseek',
  'mistral',
  'openai',
  'anthropic',
  'together',
  'openrouter',
]

export function ModelCatalogPicker({
  value,
  onChange,
  providers,
  showKeyHints = false,
  placeholder = 'Select model…',
  allowEmpty = false,
  modelIds,
  className,
  id,
  showFilters = true,
}: ModelCatalogPickerProps) {
  const [providerFilter, setProviderFilter] = useState<AIProvider | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<ModelTier | 'all'>('all')
  const [search, setSearch] = useState('')
  const [recommendedOnly, setRecommendedOnly] = useState(false)

  const configuredIds = useMemo(
    () => (modelIds ? new Set(modelIds) : undefined),
    [modelIds],
  )

  const filteredModels = useMemo(
    () =>
      filterCatalogModels({
        provider: providerFilter,
        tier: tierFilter,
        search,
        recommendedOnly,
        configuredIds,
        configuredOnly: Boolean(modelIds?.length),
      }),
    [providerFilter, tierFilter, search, recommendedOnly, configuredIds, modelIds],
  )

  const groups = useMemo(
    () => buildFilteredCatalogOptionGroups(filteredModels, providers),
    [filteredModels, providers],
  )

  const selectClass =
    className ??
    'w-full rounded-md border bg-background px-3 py-2 text-sm'

  return (
    <div className="space-y-3">
      {showFilters ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as AIProvider | 'all')}
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All providers</option>
              {ALL_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                  {providers && !providers[p] ? ' (no key)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tier</Label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as ModelTier | 'all')}
              className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All tiers</option>
              {(Object.keys(TIER_LABELS) as ModelTier[]).map((t) => (
                <option key={t} value={t}>
                  {TIER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or ID…"
              className="mt-1 h-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={recommendedOnly}
              onChange={(e) => setRecommendedOnly(e.target.checked)}
              className="rounded border"
            />
            Recommended only
          </label>
        </div>
      ) : null}

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {allowEmpty ? <option value="">{placeholder}</option> : null}
        {groups.length === 0 ? (
          <option value="" disabled>
            No models match filters
          </option>
        ) : (
          groups.map((group) => (
            <optgroup key={group.key} label={group.label}>
              {group.models.map((m) => {
                const missingKey =
                  showKeyHints && providers && providers[m.provider] === false
                return (
                  <option key={m.id} value={m.id}>
                    {getCatalogDisplayLabel(m)}
                    {missingKey ? ' · save key in AI Config' : ''}
                  </option>
                )
              })}
            </optgroup>
          ))
        )}
      </select>
    </div>
  )
}
