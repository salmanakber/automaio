import { RUNTIME_FIELD_SLUGS } from '@/lib/webflow/cms-collection-schema'

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Extract Automaio project/page id from Webflow CMS fieldData. */
export function extractPageIdFromCmsFields(fieldData: Record<string, unknown>): string | null {
  for (const key of RUNTIME_FIELD_SLUGS.pageId) {
    const val = fieldData[key]
    if (typeof val === 'string' && val.trim().length >= 10) return val.trim()
  }

  for (const key of RUNTIME_FIELD_SLUGS.runtimeConfig) {
    const val = fieldData[key]
    if (typeof val !== 'string' || !val.includes('pageId')) continue
    try {
      const parsed = JSON.parse(val) as { pageId?: string }
      if (parsed.pageId?.trim()) return parsed.pageId.trim()
    } catch {
      const match = val.match(/"pageId"\s*:\s*"([^"]+)"/)
      if (match?.[1]?.trim()) return match[1].trim()
    }
  }

  return null
}

type CachedCollection = {
  id: string
  slug?: string
  fields?: Array<{ slug: string; type?: string }>
}

/** Collection IDs that likely store Automaio runtime page ids. */
export function pickRuntimeCollectionIds(
  integration: {
    templatesCollectionId?: string | null
    campaignsCollectionId?: string | null
    collections?: unknown
  },
  collectionIdHint?: string | null,
): string[] {
  const ids: string[] = []

  if (collectionIdHint) ids.push(collectionIdHint)
  if (integration.templatesCollectionId) ids.push(integration.templatesCollectionId)
  if (integration.campaignsCollectionId) ids.push(integration.campaignsCollectionId)

  const cached = integration.collections as { collections?: CachedCollection[] } | null
  for (const col of cached?.collections ?? []) {
    const hasPageIdField = col.fields?.some((f) =>
      RUNTIME_FIELD_SLUGS.pageId.some((alias) => alias === f.slug),
    )
    if (hasPageIdField && col.id) ids.push(col.id)
  }

  return [...new Set(ids.filter(Boolean))]
}
