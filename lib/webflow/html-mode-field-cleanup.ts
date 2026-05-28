import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { CollectionField } from '@/lib/webflow/field-mapper'
import {
  resolveRuntimeFieldSlug,
  resolveSplitFieldSlug,
  resolveIframeFieldSlug,
  RUNTIME_FIELD_SLUGS,
  SPLIT_FIELD_SLUGS,
  IFRAME_FIELD_SLUGS,
} from '@/lib/webflow/cms-collection-schema'

const CLEARED = ' '

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

/**
 * When switching HTML delivery mode, clear CMS fields from other modes
 * so Webflow does not keep serving stale runtime IDs, split HTML, or iframe URLs.
 */
export function applyHtmlModeFieldCleanup(
  fieldData: Record<string, unknown>,
  htmlMode: PublishHtmlMode,
  collectionFields: CollectionField[],
): Record<string, unknown> {
  const result = { ...fieldData }
  const slugsToClear = new Set<string>()

  const addRuntimeSlugs = () => {
    for (const key of Object.keys(RUNTIME_FIELD_SLUGS) as Array<keyof typeof RUNTIME_FIELD_SLUGS>) {
      const slug = resolveRuntimeFieldSlug(key, collectionFields)
      if (slug) slugsToClear.add(slug)
    }
  }

  const addSplitSlugs = () => {
    for (const key of ['html', 'css', 'js'] as const) {
      const slug = resolveSplitFieldSlug(key, collectionFields)
      if (slug) slugsToClear.add(slug)
    }
    for (const candidate of SPLIT_FIELD_SLUGS.html) slugsToClear.add(candidate)
    for (const candidate of SPLIT_FIELD_SLUGS.css) slugsToClear.add(candidate)
    for (const candidate of SPLIT_FIELD_SLUGS.js) slugsToClear.add(candidate)
  }

  const addIframeSlugs = () => {
    const slug = resolveIframeFieldSlug('iframeUrl', collectionFields)
    if (slug) slugsToClear.add(slug)
    for (const candidate of IFRAME_FIELD_SLUGS.iframeUrl) slugsToClear.add(candidate)
  }

  const addRichTextSlugs = () => {
    for (const slug of richTextBodySlugs(collectionFields)) slugsToClear.add(slug)
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
    if (!(slug in result)) {
      result[slug] = CLEARED
    }
  }

  return result
}
