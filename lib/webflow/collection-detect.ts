import type { CollectionField } from '@/lib/webflow/field-mapper'
import { resolveRenderingStrategy } from '@/lib/content/rendering-strategy'
import { SECTION_FIELD_ALIASES } from '@/lib/webflow/section-cms-bindings'

export type CollectionCapabilities = {
  collectionId: string
  fieldCount: number
  hasName: boolean
  hasSlug: boolean
  hasRichTextBody: boolean
  hasPlainTextBody: boolean
  hasHeadline: boolean
  hasSeoFields: boolean
  sectionFieldSlugs: string[]
  sectionFieldCount: number
  embedFieldSlugs: string[]
  recommendedContentTypes: Array<'landing_page' | 'blog_post' | 'cms_entry'>
  renderMode: 'iframe_embed' | 'rich_text_html'
  renderReason: string
  htmlLineCount: number
  customCodeAccess: boolean
  embedAutoSetupPossible: boolean
}

const BODY_SLUGS = ['body', 'body-html', 'post-body', 'content', 'rich-text', 'summary', 'description']
const HEADLINE_SLUGS = ['headline', 'title', 'post-title', 'heading', 'h1', 'hero-headline']
const EMBED_SLUGS = ['template-html', 'html', 'embed', 'custom-code', 'page-html', 'code-embed']
const SEO_SLUGS = ['seo-title', 'seo-description', 'meta-title', 'meta-description']

function fieldSlugs(fields: CollectionField[]): Set<string> {
  return new Set(fields.map((f) => f.slug))
}

function hasSlugMatch(slugs: Set<string>, candidates: string[]): boolean {
  return candidates.some((s) => slugs.has(s))
}

function isRichText(fields: CollectionField[], slug: string): boolean {
  const f = fields.find((x) => x.slug === slug)
  return f?.type === 'RichText'
}

export function detectCollectionCapabilities(
  collectionId: string,
  fields: CollectionField[],
  options?: {
    hasCustomCodeAccess?: boolean
    htmlLineCount?: number
    assignedRole?: 'blog' | 'pages' | null
  },
): CollectionCapabilities {
  const slugs = fieldSlugs(fields)
  const richTextBodySlug = BODY_SLUGS.find((s) => slugs.has(s) && isRichText(fields, s))
  const plainBodySlug = BODY_SLUGS.find((s) => slugs.has(s) && !isRichText(fields, s))

  const sectionFieldSlugs: string[] = []
  for (const aliases of Object.values(SECTION_FIELD_ALIASES)) {
    const match = aliases.find((s) => slugs.has(s))
    if (match) sectionFieldSlugs.push(match)
  }

  const embedFieldSlugs = EMBED_SLUGS.filter((s) => slugs.has(s))

  const hasCustomCodeAccess = options?.hasCustomCodeAccess ?? false
  const htmlLineCount = options?.htmlLineCount ?? 0
  const strategy = resolveRenderingStrategy(
    htmlLineCount > 0 ? Array(htmlLineCount).fill('').join('\n') : '<html></html>',
    hasCustomCodeAccess,
  )

  const recommendedContentTypes: CollectionCapabilities['recommendedContentTypes'] = []
  if (richTextBodySlug || plainBodySlug) {
    recommendedContentTypes.push('blog_post', 'cms_entry')
  }
  if (richTextBodySlug || embedFieldSlugs.length > 0 || sectionFieldSlugs.length > 0) {
    recommendedContentTypes.push('landing_page')
  }
  if (options?.assignedRole === 'blog' && !recommendedContentTypes.includes('blog_post')) {
    recommendedContentTypes.push('blog_post')
  }
  if (options?.assignedRole === 'pages' && !recommendedContentTypes.includes('landing_page')) {
    recommendedContentTypes.push('landing_page')
  }

  const uniqueTypes = [...new Set(recommendedContentTypes)]

  return {
    collectionId,
    fieldCount: fields.length,
    hasName: hasSlugMatch(slugs, ['name', 'title']),
    hasSlug: slugs.has('slug'),
    hasRichTextBody: Boolean(richTextBodySlug),
    hasPlainTextBody: Boolean(plainBodySlug),
    hasHeadline: hasSlugMatch(slugs, HEADLINE_SLUGS),
    hasSeoFields: hasSlugMatch(slugs, SEO_SLUGS),
    sectionFieldSlugs,
    sectionFieldCount: sectionFieldSlugs.length,
    embedFieldSlugs,
    recommendedContentTypes: uniqueTypes.length ? uniqueTypes : ['cms_entry'],
    renderMode: strategy.htmlMode,
    renderReason: strategy.reason,
    htmlLineCount,
    customCodeAccess: hasCustomCodeAccess,
    embedAutoSetupPossible: hasCustomCodeAccess && strategy.strategy !== 'rich_text_html',
  }
}

export function contentTypeLabel(type: string): string {
  switch (type) {
    case 'landing_page':
      return 'Landing page'
    case 'blog_post':
      return 'Blog post'
    case 'cms_entry':
      return 'CMS entry'
    case 'custom':
      return 'Custom'
    default:
      return type.replace('_', ' ')
  }
}

export function getCollectionRoleLabel(
  collectionId: string,
  integration: {
    campaignsCollectionId?: string | null
    templatesCollectionId?: string | null
  },
): string | null {
  if (collectionId === integration.templatesCollectionId) return 'Landing pages'
  if (collectionId === integration.campaignsCollectionId) return 'Blog posts'
  return null
}
