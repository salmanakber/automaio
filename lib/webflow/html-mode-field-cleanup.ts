import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { CollectionField } from '@/lib/webflow/field-mapper'
import {
  resolveRuntimeFieldSlug,
  resolveSplitFieldSlug,
  resolveIframeFieldSlug,
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
 * Only touches slugs that exist on the collection schema.
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
    for (const key of ['pageId', 'runtimeConfig', 'status'] as const) {
      addIfPresent(resolveRuntimeFieldSlug(key, collectionFields))
    }
  }

  const addSplitSlugs = () => {
    for (const key of ['html', 'css', 'js'] as const) {
      addIfPresent(resolveSplitFieldSlug(key, collectionFields))
    }
  }

  const addIframeSlugs = () => {
    addIfPresent(resolveIframeFieldSlug('iframeUrl', collectionFields))
    addIfPresent(resolveIframeFieldSlug('iframeHeight', collectionFields))
    addIfPresent(resolveIframeFieldSlug('iframeSandbox', collectionFields))
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
    if (!(slug in result)) {
      result[slug] = CLEARED
    }
  }

  return result
}
