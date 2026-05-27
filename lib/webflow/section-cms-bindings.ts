import type { BusinessContext } from '@/lib/ai/business-context-types'
import { tagTextElements, groupElementsBySection } from '@/lib/ai/dom-patcher'
import type { CollectionField } from '@/lib/webflow/field-mapper'

/** Logical section keys → common Webflow CMS field slug patterns. */
export const SECTION_FIELD_ALIASES: Record<string, string[]> = {
  'hero-headline': ['hero-headline', 'hero-title', 'main-headline', 'h1', 'headline'],
  'hero-subheadline': ['hero-subheadline', 'hero-subtitle', 'subheadline', 'lead', 'tagline'],
  'hero-cta': ['hero-cta', 'cta-text', 'cta', 'primary-cta', 'button-text'],
  'features-summary': ['features', 'feature-list', 'benefits', 'feature-summary'],
  testimonials: ['testimonials', 'social-proof', 'reviews', 'quotes'],
  faq: ['faq', 'questions', 'faq-content'],
  'cta-section': ['cta-section', 'cta-block', 'final-cta'],
  pricing: ['pricing', 'plans', 'pricing-summary'],
  contact: ['contact', 'contact-info'],
}

export const SECTION_FIELD_LABELS: Record<string, string> = {
  'hero-headline': 'Hero headline',
  'hero-subheadline': 'Hero subheadline',
  'hero-cta': 'Hero CTA',
  'features-summary': 'Features',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  'cta-section': 'CTA section',
  pricing: 'Pricing',
  contact: 'Contact',
}

export type WebflowCollectionFieldDef = {
  type: string
  displayName: string
  isRequired?: boolean
  isEditable?: boolean
}

/** Base CMS fields every landing page collection needs. */
export const LANDING_PAGE_BASE_CMS_FIELDS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Name', isRequired: true },
  { type: 'PlainText', displayName: 'Slug', isRequired: true },
  { type: 'PlainText', displayName: 'Headline' },
  { type: 'RichText', displayName: 'Body' },
  { type: 'PlainText', displayName: 'SEO Title' },
  { type: 'PlainText', displayName: 'SEO Description' },
  { type: 'PlainText', displayName: 'Target Audience' },
  { type: 'PlainText', displayName: 'Industry' },
]

/** Section fields for AI-personalized landing page content binding. */
export const SECTION_CMS_FIELD_DEFINITIONS: WebflowCollectionFieldDef[] = [
  { type: 'PlainText', displayName: 'Hero Headline' },
  { type: 'PlainText', displayName: 'Hero Subheadline' },
  { type: 'PlainText', displayName: 'Hero CTA' },
  { type: 'RichText', displayName: 'Features' },
  { type: 'RichText', displayName: 'Testimonials' },
  { type: 'RichText', displayName: 'FAQ' },
  { type: 'PlainText', displayName: 'CTA Section' },
  { type: 'RichText', displayName: 'Pricing' },
  { type: 'PlainText', displayName: 'Contact' },
]

/** Minimal collection: split Plain Text HTML/CSS/JS fields for scalable landing pages. */
export { getDefaultLandingCollectionFields } from '@/lib/webflow/cms-collection-schema'

export type SectionCmsMappingRow = {
  logicalKey: string
  label: string
  webflowSlug: string | null
  value: string
  status: 'mapped' | 'missing_field' | 'empty'
}

export function buildSectionCmsMappingPreview(
  sectionContent: SectionCmsContent,
  collectionFields: CollectionField[],
): SectionCmsMappingRow[] {
  const slugs = new Set(collectionFields.map((f) => f.slug))
  const rows: SectionCmsMappingRow[] = []

  for (const logicalKey of Object.keys(SECTION_FIELD_LABELS)) {
    const value = sectionContent[logicalKey]?.trim() ?? ''
    const aliases = SECTION_FIELD_ALIASES[logicalKey] ?? [logicalKey]
    const webflowSlug = aliases.find((slug) => slugs.has(slug)) ?? null

    let status: SectionCmsMappingRow['status'] = 'empty'
    if (value && webflowSlug) status = 'mapped'
    else if (value && !webflowSlug) status = 'missing_field'
    else if (!value && webflowSlug) status = 'empty'

    rows.push({
      logicalKey,
      label: SECTION_FIELD_LABELS[logicalKey] ?? logicalKey,
      webflowSlug,
      value: value.length > 100 ? `${value.slice(0, 100)}…` : value,
      status,
    })
  }

  return rows
}

export type SectionCmsContent = Record<string, string>

function pickPrimaryText(elements: Array<{ tag: string; text: string }>): string {
  const h1 = elements.find((e) => e.tag === 'h1')
  if (h1) return h1.text
  const h2 = elements.find((e) => e.tag === 'h2')
  if (h2) return h2.text
  return elements[0]?.text ?? ''
}

function pickSubheadline(elements: Array<{ tag: string; text: string }>): string {
  const p = elements.find((e) => e.tag === 'p')
  if (p) return p.text
  const h2 = elements.find((e) => e.tag === 'h2')
  return h2?.text ?? ''
}

function pickCtaText(elements: Array<{ tag: string; text: string }>): string {
  const btn = elements.find((e) => e.tag === 'button' || e.tag === 'a')
  return btn?.text ?? ''
}

function formatList(items: string[], max = 5): string {
  return items.filter(Boolean).slice(0, max).join('\n')
}

function formatTestimonials(
  testimonials: BusinessContext['testimonials'],
): string {
  if (!testimonials?.length) return ''
  return testimonials
    .slice(0, 5)
    .map((t) => `"${t.quote}"${t.author ? ` — ${t.author}` : ''}${t.role ? `, ${t.role}` : ''}`)
    .join('\n\n')
}

function formatFaq(faq: BusinessContext['faq']): string {
  if (!faq?.length) return ''
  return faq
    .slice(0, 8)
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n')
}

/** Extract section content from HTML for CMS field binding. */
export function extractSectionContentFromHtml(html: string): SectionCmsContent {
  const { elements } = tagTextElements(html)
  const groups = groupElementsBySection(elements)
  const out: SectionCmsContent = {}

  if (groups.hero?.length) {
    out['hero-headline'] = pickPrimaryText(groups.hero)
    out['hero-subheadline'] = pickSubheadline(groups.hero)
    out['hero-cta'] = pickCtaText(groups.hero)
  }

  if (groups.features?.length) {
    out['features-summary'] = groups.features.map((e) => e.text).join('\n')
  }

  if (groups.testimonials?.length) {
    out.testimonials = groups.testimonials.map((e) => e.text).join('\n\n')
  }

  if (groups.faq?.length) {
    out.faq = groups.faq.map((e) => e.text).join('\n')
  }

  if (groups.cta?.length) {
    out['cta-section'] = groups.cta.map((e) => e.text).join('\n')
  }

  if (groups.pricing?.length) {
    out.pricing = groups.pricing.map((e) => e.text).join('\n')
  }

  if (groups.contact?.length) {
    out.contact = groups.contact.map((e) => e.text).join('\n')
  }

  return out
}

/** Merge HTML-extracted sections with business context fallbacks. */
export function buildSectionCmsContent(
  html: string,
  params: Record<string, string>,
  businessContext?: BusinessContext | null,
): SectionCmsContent {
  const fromHtml = extractSectionContentFromHtml(html)
  const stored = params.sectionContent
    ? (() => {
        try {
          return JSON.parse(stored) as SectionCmsContent
        } catch {
          return {}
        }
      })()
    : {}

  const fromContext: SectionCmsContent = {}
  if (businessContext) {
    if (businessContext.headings?.[0]) {
      fromContext['hero-headline'] = businessContext.headings[0]
    }
    if (businessContext.description) {
      fromContext['hero-subheadline'] = businessContext.description
    }
    if (businessContext.ctaLanguage) {
      fromContext['hero-cta'] = businessContext.ctaLanguage
    }
    if (businessContext.valuePropositions?.length) {
      fromContext['features-summary'] = formatList(businessContext.valuePropositions)
    } else if (businessContext.services?.length) {
      fromContext['features-summary'] = formatList(businessContext.services)
    }
    const testimonials = formatTestimonials(businessContext.testimonials)
    if (testimonials) fromContext.testimonials = testimonials
    const faq = formatFaq(businessContext.faq)
    if (faq) fromContext.faq = faq
  }

  return {
    ...fromContext,
    ...stored,
    ...fromHtml,
    'hero-headline': fromHtml['hero-headline'] || params.headline || fromContext['hero-headline'] || '',
    'hero-subheadline':
      fromHtml['hero-subheadline'] || params.subheadline || fromContext['hero-subheadline'] || '',
    'hero-cta': fromHtml['hero-cta'] || params.ctaText || fromContext['hero-cta'] || '',
  }
}

/** Resolve section content to matching CMS collection field slugs. */
export function bindSectionContentToCmsFields(
  sectionContent: SectionCmsContent,
  collectionFields: CollectionField[],
): Record<string, string> {
  const slugs = new Set(collectionFields.map((f) => f.slug))
  const result: Record<string, string> = {}

  for (const [logicalKey, value] of Object.entries(sectionContent)) {
    if (!value?.trim()) continue
    const aliases = SECTION_FIELD_ALIASES[logicalKey] ?? [logicalKey]
    const match = aliases.find((slug) => slugs.has(slug))
    if (match && !result[match]) {
      result[match] = value.trim()
    }
  }

  return result
}
