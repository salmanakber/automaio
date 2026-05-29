import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { CollectionField } from '@/lib/webflow/field-mapper'
import {
  RUNTIME_FIELD_SLUGS,
  SPLIT_FIELD_SLUGS,
  IFRAME_FIELD_SLUGS,
  resolveRuntimeFieldSlug,
  resolveSplitFieldSlug,
  resolveIframeFieldSlug,
} from '@/lib/webflow/cms-collection-schema'

/** Webflow accepts a single space to clear optional Plain Text fields. */
export const CMS_FIELD_CLEAR_VALUE = ' '

const CLEARED = CMS_FIELD_CLEAR_VALUE

function richTextBodySlugs(fields: CollectionField[]): string[] {
  const slugs = new Set<string>()
  for (const candidate of ['body-html', 'body', 'post-body', 'content', 'main-content']) {
    const field = fields.find((f) => f.slug === candidate && f.type === 'RichText')
    if (field) slugs.add(field.slug)
  }
  for (const field of fields) {
    if (field.type === 'RichText') slugs.add(field.slug)
  }
  return [...slugs]
}

function addAllAliases(
  slugsToClear: Set<string>,
  aliases: readonly string[],
  collectionSlugs: Set<string>,
) {
  for (const slug of aliases) {
    if (collectionSlugs.has(slug)) slugsToClear.add(slug)
  }
}

/**
 * When switching HTML delivery mode, clear CMS fields from other modes
 * so Webflow does not keep serving stale runtime IDs, split HTML, or iframe URLs.
 * Always overwrites stale values — important when republishing the same CMS item.
 */
export function applyHtmlModeFieldCleanup(
  fieldData: Record<string, unknown>,
  htmlMode: PublishHtmlMode,
  collectionFields: CollectionField[],
): Record<string, unknown> {
  const result = { ...fieldData }
  const collectionSlugs = new Set(collectionFields.map((f) => f.slug))
  const slugsToClear = new Set<string>()

  const addIfPresent = (slug: string | null) => {
    if (slug && collectionSlugs.has(slug)) slugsToClear.add(slug)
  }

  const addRuntimeSlugs = () => {
    addAllAliases(slugsToClear, RUNTIME_FIELD_SLUGS.pageId, collectionSlugs)
    addAllAliases(slugsToClear, RUNTIME_FIELD_SLUGS.runtimeConfig, collectionSlugs)
    addIfPresent(resolveRuntimeFieldSlug('status', collectionFields))
  }

  const addSplitSlugs = () => {
    addAllAliases(slugsToClear, SPLIT_FIELD_SLUGS.html, collectionSlugs)
    addAllAliases(slugsToClear, SPLIT_FIELD_SLUGS.css, collectionSlugs)
    addAllAliases(slugsToClear, SPLIT_FIELD_SLUGS.js, collectionSlugs)
  }

  const addIframeSlugs = () => {
    addAllAliases(slugsToClear, IFRAME_FIELD_SLUGS.iframeUrl, collectionSlugs)
    addAllAliases(slugsToClear, IFRAME_FIELD_SLUGS.iframeHeight, collectionSlugs)
    addAllAliases(slugsToClear, IFRAME_FIELD_SLUGS.iframeSandbox, collectionSlugs)
  }

  const addRichTextSlugs = () => {
    for (const slug of richTextBodySlugs(collectionFields)) {
      if (collectionSlugs.has(slug)) slugsToClear.add(slug)
    }
  }

  if (htmlMode === 'remote_runtime') {
    addSplitSlugs()
    addIframeSlugs()
    addRichTextSlugs()
  } else if (htmlMode === 'split_plain_text') {
    addRuntimeSlugs()
    addIframeSlugs()
    addRichTextSlugs()
  } else if (htmlMode === 'iframe_embed') {
    addRuntimeSlugs()
    addSplitSlugs()
    addRichTextSlugs()
  }

  for (const slug of slugsToClear) {
    result[slug] = CLEARED
  }

  return result
}

/** Re-apply intentional field clears removed by sanitizeFieldDataForCollection. */
export function preserveClearsAfterSanitize(
  sanitized: Record<string, unknown>,
  beforeSanitize: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...sanitized }
  for (const [key, value] of Object.entries(beforeSanitize)) {
    if (value === CMS_FIELD_CLEAR_VALUE) out[key] = CMS_FIELD_CLEAR_VALUE
  }
  return out
}
