import { prisma } from '@/lib/prisma'
import type { CollectionField } from '@/lib/webflow/field-mapper'

export type DeliveryMode = 'remote_runtime' | 'split_plain_text' | 'iframe_embed'

export type WebflowCollectionFieldDef = {
  type: string
  displayName: string
  slug?: string
  isRequired?: boolean
  isEditable?: boolean
}

/**
 * Remote runtime CMS schema — lightweight Webflow shell only.
 * Full page schema + render bundle lives on Automaio platform API.
 */
export const RUNTIME_LANDING_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Title', slug: 'title', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', slug: 'slug', isRequired: true },
  { type: 'PlainText', displayName: 'SEO Title', slug: 'seo-title' },
  { type: 'PlainText', displayName: 'SEO Description', slug: 'seo-description' },
  { type: 'PlainText', displayName: 'Page ID', slug: 'page-id', isRequired: true },
  { type: 'PlainText', displayName: 'Runtime Config', slug: 'runtime-config' },
  { type: 'PlainText', displayName: 'Template ID', slug: 'template-id' },
  { type: 'PlainText', displayName: 'Status', slug: 'status' },
  { type: 'Image', displayName: 'Preview Image', slug: 'preview-image' },
]

/** Split HTML/CSS/JS in CMS Plain Text fields (SEO-friendly). */
export const SPLIT_LANDING_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Title', slug: 'title', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', slug: 'slug', isRequired: true },
  { type: 'PlainText', displayName: 'SEO Title', slug: 'seo-title' },
  { type: 'PlainText', displayName: 'SEO Description', slug: 'seo-description' },
  { type: 'PlainText', displayName: 'HTML', slug: 'html' },
  { type: 'PlainText', displayName: 'CSS', slug: 'css' },
  { type: 'PlainText', displayName: 'JS', slug: 'js' },
  { type: 'Image', displayName: 'Preview Image', slug: 'preview-image' },
  { type: 'PlainText', displayName: 'Template ID', slug: 'template-id' },
  { type: 'PlainText', displayName: 'Status', slug: 'status' },
]

/** Iframe embed URL in CMS Plain Text field. */
export const IFRAME_LANDING_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Title', slug: 'title', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', slug: 'slug', isRequired: true },
  { type: 'PlainText', displayName: 'SEO Title', slug: 'seo-title' },
  { type: 'PlainText', displayName: 'SEO Description', slug: 'seo-description' },
  { type: 'PlainText', displayName: 'Iframe URL', slug: 'iframe-url' },
  { type: 'Image', displayName: 'Preview Image', slug: 'preview-image' },
  { type: 'PlainText', displayName: 'Template ID', slug: 'template-id' },
  { type: 'PlainText', displayName: 'Status', slug: 'status' },
]

export const DELIVERY_FIELD_DEFINITIONS: Record<DeliveryMode, WebflowCollectionFieldDef[]> = {
  remote_runtime: RUNTIME_LANDING_CMS_FIELDS,
  split_plain_text: SPLIT_LANDING_CMS_FIELDS,
  iframe_embed: IFRAME_LANDING_CMS_FIELDS,
}

/** Legacy Rich Text body collections. */
export const LEGACY_LANDING_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Name', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', isRequired: true },
  { type: 'PlainText', displayName: 'Headline' },
  { type: 'RichText', displayName: 'Body' },
  { type: 'PlainText', displayName: 'SEO Title' },
  { type: 'PlainText', displayName: 'SEO Description' },
  { type: 'PlainText', displayName: 'Target Audience' },
  { type: 'PlainText', displayName: 'Industry' },
]

export const RUNTIME_FIELD_SLUGS = {
  pageId: ['page-id', 'page_id', 'automaio-page-id', 'automaio-id', 'automaio-campaign-id'],
  runtimeConfig: ['runtime-config', 'runtime_config'],
  seoTitle: ['seo-title', 'seo_title'],
  seoDescription: ['seo-description', 'seo_description'],
  templateId: ['template-id', 'template_id', 'automaio-template-id'],
  status: ['status'],
  previewImage: ['preview-image', 'preview_image'],
  title: ['title', 'name'],
  slug: ['slug'],
} as const

export const SPLIT_FIELD_SLUGS = {
  html: ['html', 'html-content', 'html_content'],
  css: ['css', 'css-content', 'css_content'],
  js: ['js', 'js-content', 'js_content'],
  seoTitle: ['seo-title', 'seo_title'],
  seoDescription: ['seo-description', 'seo_description'],
  templateId: ['template-id', 'template_id', 'automaio-template-id'],
  status: ['status'],
  previewImage: ['preview-image', 'preview_image'],
  title: ['title', 'name'],
  slug: ['slug'],
} as const

export const IFRAME_FIELD_SLUGS = {
  iframeUrl: ['iframe-url', 'iframe_url', 'embed-url', 'page-url'],
  seoTitle: ['seo-title', 'seo_title'],
  seoDescription: ['seo-description', 'seo_description'],
  templateId: ['template-id', 'template_id', 'automaio-template-id'],
  status: ['status'],
  previewImage: ['preview-image', 'preview_image'],
  title: ['title', 'name'],
  slug: ['slug'],
} as const

export function getDefaultLandingCollectionFields(): WebflowCollectionFieldDef[] {
  return [...RUNTIME_LANDING_CMS_FIELDS]
}

export function collectionSupportsRemoteRuntime(fields: CollectionField[]): boolean {
  const slugs = new Set(fields.map((f) => f.slug))
  return RUNTIME_FIELD_SLUGS.pageId.some((s) => slugs.has(s))
}

export function collectionSupportsSplitPlainText(fields: CollectionField[]): boolean {
  const slugs = new Set(fields.map((f) => f.slug))
  const hasHtml = SPLIT_FIELD_SLUGS.html.some((s) => slugs.has(s))
  const hasCss = SPLIT_FIELD_SLUGS.css.some((s) => slugs.has(s))
  const hasJs = SPLIT_FIELD_SLUGS.js.some((s) => slugs.has(s))
  return hasHtml && hasCss && hasJs
}

export function collectionSupportsIframeEmbed(fields: CollectionField[]): boolean {
  const slugs = new Set(fields.map((f) => f.slug))
  return IFRAME_FIELD_SLUGS.iframeUrl.some((s) => slugs.has(s))
}

export function collectionHasDeliveryFields(fields: CollectionField[], mode: DeliveryMode): boolean {
  if (mode === 'remote_runtime') return collectionSupportsRemoteRuntime(fields)
  if (mode === 'split_plain_text') return collectionSupportsSplitPlainText(fields)
  return collectionSupportsIframeEmbed(fields)
}

export function resolveRuntimeFieldSlug(
  kind: keyof typeof RUNTIME_FIELD_SLUGS,
  fields: CollectionField[],
): string | null {
  const slugs = new Set(fields.map((f) => f.slug))
  for (const candidate of RUNTIME_FIELD_SLUGS[kind]) {
    if (slugs.has(candidate)) return candidate
  }
  return null
}

export function resolveSplitFieldSlug(
  kind: keyof typeof SPLIT_FIELD_SLUGS,
  fields: CollectionField[],
): string | null {
  const slugs = new Set(fields.map((f) => f.slug))
  for (const candidate of SPLIT_FIELD_SLUGS[kind]) {
    if (slugs.has(candidate)) return candidate
  }
  return null
}

export function resolveIframeFieldSlug(
  kind: keyof typeof IFRAME_FIELD_SLUGS,
  fields: CollectionField[],
): string | null {
  const slugs = new Set(fields.map((f) => f.slug))
  for (const candidate of IFRAME_FIELD_SLUGS[kind]) {
    if (slugs.has(candidate)) return candidate
  }
  return null
}

/** Update cached collection field list on integration after creating fields. */
export async function syncCollectionFieldsCache(
  integrationId: string,
  collectionId: string,
  fields: CollectionField[],
) {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) return

  const collectionsJson = (integration.collections as {
    collections?: Array<{ id: string; fields?: CollectionField[] }>
  }) ?? { collections: [] }

  const list = collectionsJson.collections ?? []
  const idx = list.findIndex((c) => c.id === collectionId)
  const entry = { id: collectionId, fields }
  if (idx >= 0) list[idx] = { ...list[idx], fields }
  else list.push(entry)

  await prisma.webflowIntegration.update({
    where: { id: integrationId },
    data: {
      collections: { ...collectionsJson, collections: list } as object,
    },
  })
}
