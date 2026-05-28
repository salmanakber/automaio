import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { CollectionField } from '@/lib/webflow/field-mapper'
import {
  resolveRuntimeFieldSlug,
  resolveSplitFieldSlug,
  RUNTIME_FIELD_SLUGS,
  SPLIT_FIELD_SLUGS,
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

function embedFieldSlugs(fields: CollectionField[]): string[] {
  return fields
    .filter((f) => f.type === 'PlainText' && /embed|html-field|template-html/i.test(f.slug + f.name))
    .map((f) => f.slug)
}

/**
 * When switching HTML delivery mode, explicitly clear CMS fields from the previous mode
 * so Webflow does not keep serving stale runtime IDs or old split HTML.
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

  const addRichTextSlugs = () => {
    for (const slug of richTextBodySlugs(collectionFields)) slugsToClear.add(slug)
    for (const slug of embedFieldSlugs(collectionFields)) slugsToClear.add(slug)
  }

  if (htmlMode === 'remote_runtime') {
    addSplitSlugs()
    addRichTextSlugs()
  } else if (htmlMode === 'split_plain_text') {
    addRuntimeSlugs()
    addRichTextSlugs()
  } else {
    addRuntimeSlugs()
    addSplitSlugs()
  }

  for (const slug of slugsToClear) {
    if (!(slug in result)) {
      result[slug] = CLEARED
    }
  }

  return result
}
