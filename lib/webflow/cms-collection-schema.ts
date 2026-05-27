import type { CollectionField } from '@/lib/webflow/field-mapper'

export type WebflowCollectionFieldDef = {
  type: string
  displayName: string
  isRequired?: boolean
  isEditable?: boolean
}

/**
 * Remote runtime CMS schema — lightweight Webflow shell only.
 * Full page schema + render bundle lives on Automaio platform API.
 */
export const RUNTIME_LANDING_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Title', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', isRequired: true },
  { type: 'PlainText', displayName: 'SEO Title' },
  { type: 'PlainText', displayName: 'SEO Description' },
  { type: 'PlainText', displayName: 'Page ID', isRequired: true },
  { type: 'PlainText', displayName: 'Runtime Config' },
  { type: 'PlainText', displayName: 'Template ID' },
  { type: 'PlainText', displayName: 'Status' },
  { type: 'Image', displayName: 'Preview Image' },
]

/** Legacy: HTML/CSS/JS split in CMS (deprecated — use runtime fields). */
export const SPLIT_LANDING_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Title', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', isRequired: true },
  { type: 'PlainText', displayName: 'SEO Title' },
  { type: 'PlainText', displayName: 'SEO Description' },
  { type: 'PlainText', displayName: 'HTML Content' },
  { type: 'PlainText', displayName: 'CSS Content' },
  { type: 'PlainText', displayName: 'JS Content' },
  { type: 'Image', displayName: 'Preview Image' },
  { type: 'PlainText', displayName: 'Template ID' },
  { type: 'PlainText', displayName: 'Status' },
]

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
  html: ['html-content', 'html_content'],
  css: ['css-content', 'css_content'],
  js: ['js-content', 'js_content'],
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
  if (collectionSupportsRemoteRuntime(fields)) return false
  const slugs = new Set(fields.map((f) => f.slug))
  const hasHtml = SPLIT_FIELD_SLUGS.html.some((s) => slugs.has(s))
  const hasCss = SPLIT_FIELD_SLUGS.css.some((s) => slugs.has(s))
  return hasHtml && hasCss
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
