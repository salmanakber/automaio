import {
  DEFAULT_CMS_FIELD_MAPPING,
  type CmsFieldMapping,
} from '@/lib/webflow/cms-config'
import {
  extractRichTextFragment,
  findRichTextField,
  isFullHtmlDocument,
} from '@/lib/webflow/embed-setup'
import { buildProjectIframeUrl } from '@/lib/webflow/embed-page'
import { getAppBaseUrl } from '@/lib/app-url'
import { htmlToPlainSummary } from '@/lib/content/render-project-html'
import {
  buildRichTextIframeEmbed,
  extractRichTextWithAssets,
  sanitizeForWebflowRichText,
} from '@/lib/webflow/html-assets'

export { formatWebflowValidationError } from '@/lib/webflow/webflow-errors'

export type CollectionField = {
  slug: string
  name?: string
  type: string
}

export type AutomaioContentPayload = {
  name: string
  slug: string
  headline?: string
  bodyHtml?: string
  templateHtml?: string
  industry?: string
  status?: string
  targetAudience?: string
  automaioId?: string
  automaioTemplateId?: string
  contentType?: string
  seoTitle?: string
  seoDescription?: string
  ogTitle?: string
  ogDescription?: string
  custom?: Record<string, string>
}

/** How full HTML templates are delivered on the Webflow site. */
export type PublishHtmlMode = 'iframe_embed' | 'rich_text_html' | 'custom_code'

export type BuildFieldPlanOptions = {
  /** When custom_code is unavailable, store HTML in CMS Rich Text instead of iframe embed. */
  htmlMode?: PublishHtmlMode
}

export type PublishFieldPlan = {
  fieldData: Record<string, unknown>
  embedFieldSlug: string | null
  richTextFieldSlug: string | null
  usesEmbed: boolean
  htmlMode: PublishHtmlMode
}

/** Logical Automaio keys → common Webflow collection field slugs (blog, CMS, projects, etc.) */
const FIELD_ALIASES: Record<keyof CmsFieldMapping, string[]> = {
  name: ['name', 'title'],
  slug: ['slug'],
  headline: ['headline', 'title', 'post-title', 'heading', 'h1'],
  'body-html': [
    'body-html',
    'body',
    'post-body',
    'content',
    'rich-text',
    'summary',
    'post-summary',
    'description',
    'excerpt',
    'main-content',
    'text',
  ],
  'template-html': [
    'template-html',
    'html',
    'embed',
    'custom-code',
    'page-html',
    'full-html',
    'code-embed',
    'automaio-html',
  ],
  industry: ['industry', 'category', 'tag', 'sector'],
  status: ['status', 'state'],
  'target-audience': ['target-audience', 'audience', 'segment'],
  'automaio-campaign-id': ['automaio-campaign-id', 'external-id', 'reference-id'],
  'automaio-template-id': ['automaio-template-id', 'template-id'],
  'seo-title': ['seo-title', 'meta-title', 'meta-title-tag', 'page-title', 'title-tag'],
  'seo-description': ['seo-description', 'meta-description', 'meta-desc', 'description-tag'],
  'og-title': ['og-title', 'open-graph-title', 'social-title'],
  'og-description': ['og-description', 'open-graph-description', 'social-description'],
}

function getOverridesForCollection(
  cmsFieldMapping: unknown,
  collectionId: string,
): Partial<CmsFieldMapping> {
  if (!cmsFieldMapping || typeof cmsFieldMapping !== 'object') return {}

  const raw = cmsFieldMapping as Record<string, unknown>
  const perCollection = raw.collections as Record<string, Partial<CmsFieldMapping>> | undefined
  if (perCollection?.[collectionId]) {
    return { ...DEFAULT_CMS_FIELD_MAPPING, ...perCollection[collectionId] }
  }

  if ('name' in raw || 'headline' in raw) {
    return { ...DEFAULT_CMS_FIELD_MAPPING, ...(raw as Partial<CmsFieldMapping>) }
  }

  return {}
}

export function resolveFieldSlug(
  logicalKey: keyof CmsFieldMapping,
  collectionFields: CollectionField[],
  overrides: Partial<CmsFieldMapping>,
): string | null {
  const slugs = new Set(collectionFields.map((f) => f.slug))
  const override = overrides[logicalKey]
  if (override && slugs.has(override)) return override

  for (const alias of FIELD_ALIASES[logicalKey] ?? [logicalKey]) {
    if (slugs.has(alias)) return alias
  }
  return null
}

export type FieldMappingPreview = {
  logicalKey: string
  label: string
  webflowSlug: string | null
  value: string
  included: boolean
  note?: string
}

export function previewFieldMapping(
  payload: AutomaioContentPayload,
  collectionFields: CollectionField[],
  cmsFieldMapping?: unknown,
  collectionId?: string,
): FieldMappingPreview[] {
  const plan = buildWebflowFieldPlan(
    payload,
    collectionFields,
    cmsFieldMapping,
    collectionId,
  )

  const rows: FieldMappingPreview[] = []

  for (const [slug, value] of Object.entries(plan.fieldData)) {
    if (typeof value !== 'string') continue
    rows.push({
      logicalKey: slug,
      label: slug,
      webflowSlug: slug,
      value: value.length > 80 ? `${value.slice(0, 80)}…` : value,
      included: true,
      note: slug === plan.embedFieldSlug ? 'Iframe URL (not full HTML)' : undefined,
    })
  }

  if (plan.usesEmbed) {
    rows.push({
      logicalKey: 'embed-setup',
      label: 'Display on site',
      webflowSlug: 'embed.js',
      value: 'Add embed snippet to Collection Template',
      included: true,
      note: 'Required to show template on your live page',
    })
  }

  return rows
}

/**
 * Build Webflow CMS fieldData.
 * Full HTML templates → Plain Text embed field + Rich Text fragment (not raw document).
 */
function resolveRichTextFieldSlug(
  collectionFields: CollectionField[],
  overrides: Partial<CmsFieldMapping>,
): string | null {
  return (
    findRichTextField(collectionFields, [
      resolveFieldSlug('body-html', collectionFields, overrides) ?? '',
      'post-body',
      'body-html',
      'content',
      'main-content',
    ].filter(Boolean)) ??
    collectionFields.find((f) => f.type === 'RichText')?.slug ??
    null
  )
}

export function buildWebflowFieldPlan(
  payload: AutomaioContentPayload,
  collectionFields: CollectionField[],
  cmsFieldMapping?: unknown,
  collectionId?: string,
  options?: BuildFieldPlanOptions,
): PublishFieldPlan {
  const overrides = collectionId
    ? getOverridesForCollection(cmsFieldMapping, collectionId)
    : { ...DEFAULT_CMS_FIELD_MAPPING, ...((cmsFieldMapping as Partial<CmsFieldMapping>) ?? {}) }

  const slugs = new Set(collectionFields.map((f) => f.slug))
  const result: Record<string, unknown> = {}

  const assign = (logicalKey: keyof CmsFieldMapping, value: unknown) => {
    if (value === undefined || value === null || value === '') return
    const slug = resolveFieldSlug(logicalKey, collectionFields, overrides)
    if (slug && !result[slug]) result[slug] = value
  }

  const htmlContent = payload.templateHtml?.trim() ?? ''
  const textContent = payload.bodyHtml?.trim() ?? ''
  const isBlogPost = payload.contentType === 'blog_post'
  const isLandingPage =
    payload.contentType === 'landing_page' ||
    payload.contentType === 'cms_entry' ||
    payload.contentType === 'custom' ||
    Boolean(payload.automaioTemplateId)
  const hasLandingHtml = !isBlogPost && isLandingPage && Boolean(htmlContent)
  const isFullTemplate =
    !isBlogPost &&
    Boolean(htmlContent && (hasLandingHtml || isFullHtmlDocument(htmlContent)))
  const htmlMode: PublishHtmlMode =
    options?.htmlMode ?? (isFullTemplate ? 'iframe_embed' : 'rich_text_html')
  const useIframeEmbed = isFullTemplate && htmlMode === 'iframe_embed'

  assign('name', payload.name)
  assign('slug', payload.slug)

  if (isLandingPage) {
    assign('seo-title', payload.seoTitle)
    assign('seo-description', payload.seoDescription)
    assign('og-title', payload.ogTitle ?? payload.seoTitle)
    assign('og-description', payload.ogDescription ?? payload.seoDescription)
  } else {
    assign('headline', payload.headline ?? payload.name)
    assign('industry', payload.industry)
    assign('status', payload.status)
    assign('target-audience', payload.targetAudience)
    assign('automaio-campaign-id', payload.automaioId)
    assign('automaio-template-id', payload.automaioTemplateId)
    assign('seo-title', payload.seoTitle)
    assign('seo-description', payload.seoDescription)
    assign('og-title', payload.ogTitle ?? payload.seoTitle)
    assign('og-description', payload.ogDescription ?? payload.seoDescription)
  }

  let embedFieldSlug: string | null = null
  let richTextFieldSlug: string | null = null

  if (isFullTemplate) {
    // Landing pages: entire design lives in one CMS body field — full HTML or iframe embed.
    richTextFieldSlug = resolveRichTextFieldSlug(collectionFields, overrides)
    const appUrl = getAppBaseUrl()

    let bodyValue: string
    if (useIframeEmbed && payload.automaioId) {
      const iframeUrl = buildProjectIframeUrl(appUrl, payload.automaioId)
      bodyValue = buildRichTextIframeEmbed(appUrl, payload.automaioId, iframeUrl)
    } else {
      bodyValue = sanitizeForWebflowRichText(
        extractRichTextWithAssets(htmlContent) ||
          extractRichTextFragment(htmlContent) ||
          htmlContent ||
          textContent ||
          htmlToPlainSummary(htmlContent),
      )
    }

    if (richTextFieldSlug && bodyValue) {
      result[richTextFieldSlug] = bodyValue
    } else {
      assign('body-html', bodyValue)
      richTextFieldSlug = resolveFieldSlug('body-html', collectionFields, overrides)
    }
    embedFieldSlug = null
  } else if (isBlogPost) {
    // Blog posts: rich text body goes to CMS — no HTML template / iframe embed
    richTextFieldSlug =
      findRichTextField(collectionFields, [
        resolveFieldSlug('body-html', collectionFields, overrides) ?? '',
        'post-body',
        'body-html',
        'content',
      ].filter(Boolean)) ?? null

    const blogBody = textContent || htmlContent
    if (richTextFieldSlug && blogBody) {
      result[richTextFieldSlug] = blogBody
    } else {
      assign('body-html', blogBody)
      richTextFieldSlug = resolveFieldSlug('body-html', collectionFields, overrides)
    }
    embedFieldSlug = null
  } else if (htmlContent) {
    richTextFieldSlug = resolveRichTextFieldSlug(collectionFields, overrides)
    const bodyValue = sanitizeForWebflowRichText(
      extractRichTextWithAssets(htmlContent) || htmlContent || textContent,
    )
    if (richTextFieldSlug && bodyValue) {
      result[richTextFieldSlug] = bodyValue
    } else {
      assign('body-html', bodyValue)
      richTextFieldSlug = resolveFieldSlug('body-html', collectionFields, overrides)
    }
    embedFieldSlug = null
  }

  // Do not spread section/hero/CTA fields into CMS — landing content is HTML or iframe in body only.
  if (payload.custom && !isLandingPage) {
    for (const [key, val] of Object.entries(payload.custom)) {
      if (slugs.has(key) && val && !(key in result)) result[key] = val
    }
  }

  if (!result.name && slugs.has('name')) result.name = payload.name
  if (!result.slug && slugs.has('slug')) result.slug = payload.slug

  const sanitized = sanitizeFieldDataForCollection(result, collectionFields)

  if (Object.keys(sanitized).length === 0) {
    throw new Error(
      'No matching fields found in this Webflow collection. Add a Plain Text field (e.g. template-html) or Rich Text body field, then sync in Settings.',
    )
  }

  return {
    fieldData: sanitized,
    embedFieldSlug,
    richTextFieldSlug,
    usesEmbed: Boolean(isFullTemplate && useIframeEmbed && payload.automaioId && !isBlogPost),
    htmlMode: isFullTemplate ? htmlMode : 'rich_text_html',
  }
}

/** Drop fields that are not in the Webflow collection schema. */
export function sanitizeFieldDataForCollection(
  fieldData: Record<string, unknown>,
  collectionFields: CollectionField[],
): Record<string, unknown> {
  const allowed = new Set(collectionFields.map((f) => f.slug))
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(fieldData)) {
    if (!allowed.has(key)) continue
    if (value === undefined || value === null || value === '') continue
    out[key] = value
  }

  return out
}

export function buildWebflowFieldData(
  payload: AutomaioContentPayload,
  collectionFields: CollectionField[],
  cmsFieldMapping?: unknown,
  collectionId?: string,
  options?: BuildFieldPlanOptions,
): Record<string, unknown> {
  return buildWebflowFieldPlan(payload, collectionFields, cmsFieldMapping, collectionId, options)
    .fieldData
}

