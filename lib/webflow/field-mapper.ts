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
import type { AssembledLandingPage } from '@/lib/webflow/landing-page-assembler'
import {
  collectionSupportsRemoteRuntime,
  collectionSupportsSplitPlainText,
  collectionSupportsIframeEmbed,
  resolveRuntimeFieldSlug,
  resolveSplitFieldSlug,
  resolveIframeFieldSlug,
} from '@/lib/webflow/cms-collection-schema'
import { buildRuntimeConfigJson } from '@/lib/runtime/build-page-schema'
import type { LandingPageSchema } from '@/lib/runtime/types'
import { DEFAULT_PUBLISH_DELIVERY_MODE } from '@/lib/webflow/marketplace-policy'

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
  previewImage?: string
  custom?: Record<string, string>
}

/** How landing page HTML is delivered to Webflow CMS (three delivery modes only). */
export type PublishHtmlMode = 'remote_runtime' | 'split_plain_text' | 'iframe_embed'

export type BuildFieldPlanOptions = {
  htmlMode?: PublishHtmlMode
  /** Pre-assembled HTML/CSS/JS for legacy split Plain Text CMS fields. */
  assembledLanding?: AssembledLandingPage
  /** Platform page schema (source of truth for remote runtime). */
  pageSchema?: LandingPageSchema
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
  name: ['title', 'name'],
  slug: ['slug'],
  headline: ['headline', 'post-title', 'heading', 'h1'],
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
  html: ['html', 'html-content', 'html_content'],
  css: ['css', 'css-content', 'css_content'],
  js: ['js', 'js-content', 'js_content'],
  'html-content': ['html-content', 'html_content', 'html'],
  'css-content': ['css-content', 'css_content', 'css'],
  'js-content': ['js-content', 'js_content', 'js'],
  'iframe-url': ['iframe-url', 'iframe_url', 'embed-url', 'page-url'],
  'page-id': ['page-id', 'page_id', 'automaio-page-id', 'automaio-id', 'automaio-campaign-id'],
  'runtime-config': ['runtime-config', 'runtime_config'],
  'preview-image': ['preview-image', 'preview_image', 'preview-image-url'],
  'template-id': ['template-id', 'template_id', 'automaio-template-id'],
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

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Webflow required fields (title/name, slug) must always be sent. */
function ensureRequiredCmsFields(
  result: Record<string, unknown>,
  collectionFields: CollectionField[],
  payload: AutomaioContentPayload,
): void {
  const displayName =
    payload.name?.trim() ||
    payload.headline?.trim() ||
    payload.seoTitle?.trim() ||
    'Landing Page'
  const itemSlug = payload.slug?.trim() || slugifyTitle(displayName)
  const slugs = new Set(collectionFields.map((f) => f.slug))

  if (slugs.has('title') && !result.title) result.title = displayName
  if (slugs.has('name') && !result.name) result.name = displayName
  if (slugs.has('slug') && !result.slug) result.slug = itemSlug
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

  if (plan.htmlMode === 'remote_runtime') {
    rows.push({
      logicalKey: 'runtime-setup',
      label: 'Remote runtime',
      webflowSlug: 'page-id + runtime.js',
      value: 'Webflow shell only — content from Automaio API',
      included: true,
      note: 'SEO-friendly, no HTML blobs in CMS',
    })
  }

  if (plan.htmlMode === 'split_plain_text') {
    rows.push({
      logicalKey: 'collection-template',
      label: 'Webflow collection template',
      webflowSlug: 'html + css + js',
      value: 'Collection template runner injects CMS Plain Text fields',
      included: true,
      note: 'Legacy — HTML/CSS only in CMS; JS is not executed (Webflow App Store policy)',
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
  const hasRuntimeFields = collectionSupportsRemoteRuntime(collectionFields)
  const hasSplitFields = collectionSupportsSplitPlainText(collectionFields)
  const hasIframeFields = collectionSupportsIframeEmbed(collectionFields)
  const isFullTemplate =
    !isBlogPost &&
    Boolean(htmlContent && (hasLandingHtml || isFullHtmlDocument(htmlContent)))
  const resolvedMode: PublishHtmlMode = options?.htmlMode ?? DEFAULT_PUBLISH_DELIVERY_MODE
  const useRemoteRuntime =
    resolvedMode === 'remote_runtime' &&
    Boolean(payload.automaioId || options?.pageSchema)
  const useSplitPlainText =
    resolvedMode === 'split_plain_text' && Boolean(options?.assembledLanding)
  const useIframeCms =
    resolvedMode === 'iframe_embed' && Boolean(payload.automaioId)
  const htmlMode: PublishHtmlMode = useRemoteRuntime
    ? 'remote_runtime'
    : useSplitPlainText
      ? 'split_plain_text'
      : useIframeCms
        ? 'iframe_embed'
        : resolvedMode

  assign('name', payload.name)
  assign('slug', payload.slug)

  if (isLandingPage) {
    assign('seo-title', payload.seoTitle)
    assign('seo-description', payload.seoDescription)
    assign('status', payload.status ?? 'published')
    assign('template-id', payload.automaioTemplateId)
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

  if (useRemoteRuntime && payload.automaioId) {
    const pageId = payload.automaioId
    const runtimeConfig = buildRuntimeConfigJson(pageId)

    const pageIdSlug = resolveRuntimeFieldSlug('pageId', collectionFields)
    if (pageIdSlug) result[pageIdSlug] = pageId

    assign('page-id', pageId)
    assign('automaio-campaign-id', pageId)
    assign('runtime-config', runtimeConfig)
    assign('preview-image', payload.previewImage)
  } else if (useSplitPlainText && options?.assembledLanding) {
    const split = options.assembledLanding
    const htmlSlug = resolveSplitFieldSlug('html', collectionFields)
    const cssSlug = resolveSplitFieldSlug('css', collectionFields)
    const jsSlug = resolveSplitFieldSlug('js', collectionFields)

    if (htmlSlug && split.htmlContent) result[htmlSlug] = split.htmlContent
    if (cssSlug && split.cssContent) result[cssSlug] = split.cssContent
    if (jsSlug && split.jsContent) result[jsSlug] = split.jsContent

    assign('html', split.htmlContent)
    assign('css', split.cssContent)
    assign('js', split.jsContent)
    assign('html-content', split.htmlContent)
    assign('css-content', split.cssContent)
    assign('js-content', split.jsContent)
    assign('preview-image', payload.previewImage)
  } else if (useIframeCms && payload.automaioId) {
    const appUrl = getAppBaseUrl()
    const iframeUrl = buildProjectIframeUrl(appUrl, payload.automaioId)
    const iframeSlug = resolveIframeFieldSlug('iframeUrl', collectionFields)
    if (iframeSlug) result[iframeSlug] = iframeUrl
    assign('iframe-url', iframeUrl)
    assign('preview-image', payload.previewImage)
    embedFieldSlug = iframeSlug
  } else if (isFullTemplate && !useRemoteRuntime && !useSplitPlainText) {
    richTextFieldSlug = resolveRichTextFieldSlug(collectionFields, overrides)
    const bodyValue = sanitizeForWebflowRichText(
      extractRichTextWithAssets(htmlContent) ||
        extractRichTextFragment(htmlContent) ||
        htmlContent ||
        textContent ||
        htmlToPlainSummary(htmlContent),
    )
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
  if (!result.title && slugs.has('title')) {
    result.title = payload.name?.trim() || payload.headline?.trim() || 'Landing Page'
  }
  if (!result.slug && slugs.has('slug')) result.slug = payload.slug

  ensureRequiredCmsFields(result, collectionFields, payload)

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
    usesEmbed: Boolean(useIframeCms && payload.automaioId && !isBlogPost),
    htmlMode,
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

