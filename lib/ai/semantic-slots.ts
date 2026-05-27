import {
  applyTextPreservingMarkup,
  describeInlineStructure,
  escapeHtmlText,
} from '@/lib/ai/markup-preserve'

export type SlotConstraints = {
  maxWords?: number
  tone?: string
  goal?: string
}

export type SemanticSlot = {
  field: string
  tag: string
  text: string
  innerHtml: string
  section?: string
  role?: string
  constraints?: SlotConstraints
}

const SECTION_PATTERNS: Array<{ section: string; test: RegExp }> = [
  { section: 'hero', test: /\b(hero|banner|masthead)\b/i },
  { section: 'features', test: /\b(feature|benefit|grid|card)\b/i },
  { section: 'testimonials', test: /\b(testimonial|review|quote|social-proof)\b/i },
  { section: 'faq', test: /\b(faq|accordion|question)\b/i },
  { section: 'pricing', test: /\b(pric|plan|tier)\b/i },
  { section: 'cta', test: /\b(cta|call-to-action|signup|subscribe)\b/i },
  { section: 'contact', test: /\b(contact|form|get-in-touch)\b/i },
  { section: 'footer', test: /\b(footer|copyright)\b/i },
  { section: 'navigation', test: /\b(nav|header|menu)\b/i },
]

const DEFAULT_CONSTRAINTS: Record<string, SlotConstraints> = {
  'hero.title': { maxWords: 8, tone: 'bold', goal: 'attention' },
  'hero.description': { maxWords: 30, tone: 'clear', goal: 'value' },
  'hero.badge': { maxWords: 3, tone: 'neutral', goal: 'context' },
  'cta.primary': { maxWords: 4, goal: 'conversion' },
  'footer.copyright': { maxWords: 12, tone: 'neutral', goal: 'legal' },
}

const FIELD_ROLE_HINTS: Record<string, string> = {
  'hero.title': 'main headline — high impact, outcome-focused',
  'hero.description': 'hero subheadline — clarify value proposition',
  'hero.badge': 'category or industry badge',
  'cta.primary': 'primary call-to-action button',
  'footer.copyright': 'footer line — company name only if needed',
}

function extractPlainText(inner: string): string {
  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectSection(field: string, tag: string, attrs: string, text: string): string | undefined {
  const context = `${field} ${attrs} ${text}`.slice(0, 240)
  for (const { section, test } of SECTION_PATTERNS) {
    if (test.test(context)) return section
  }
  if (field.startsWith('hero.')) return 'hero'
  if (field.startsWith('features.')) return 'features'
  if (field.startsWith('testimonial')) return 'testimonials'
  if (field.startsWith('faq.')) return 'faq'
  if (field.startsWith('cta.')) return 'cta'
  if (field.startsWith('footer.')) return 'footer'
  if (/^h1$/i.test(tag)) return 'hero'
  if (/^footer$/i.test(tag)) return 'footer'
  if (/button|cta/i.test(tag) || /class=["'][^"']*cta/i.test(attrs)) return 'cta'
  return undefined
}

function inferFieldName(
  tag: string,
  attrs: string,
  counters: Record<string, number>,
): string | null {
  const tagLower = tag.toLowerCase()
  const cls = attrs.match(/class=["']([^"']*)["']/i)?.[1] ?? ''

  if (/^h1$/i.test(tag)) return 'hero.title'
  if (/^h1$/i.test(tag) === false && /^h[2-3]$/i.test(tag) && /card|feature|benefit/i.test(cls)) {
    counters.featureTitle = (counters.featureTitle ?? 0) + 1
    return `features.${counters.featureTitle}.title`
  }
  if (tagLower === 'p' && /lead|subhead|subtitle|description/i.test(cls)) return 'hero.description'
  if (tagLower === 'p' && /card|feature|benefit/i.test(cls)) {
    counters.featureDesc = (counters.featureDesc ?? 0) + 1
    return `features.${counters.featureDesc}.description`
  }
  if (tagLower === 'span' && /badge/i.test(cls)) return 'hero.badge'
  if ((tagLower === 'a' || tagLower === 'button') && /cta|w-button|btn/i.test(`${cls} ${attrs}`)) {
    return 'cta.primary'
  }
  if (tagLower === 'footer' || /ai-footer|footer/i.test(cls)) return 'footer.copyright'
  if (/^h[2-6]$/i.test(tag)) {
    counters.heading = (counters.heading ?? 0) + 1
    return `section.${counters.heading}.title`
  }
  if (tagLower === 'p') {
    counters.paragraph = (counters.paragraph ?? 0) + 1
    return `content.${counters.paragraph}`
  }
  if (tagLower === 'button' || (tagLower === 'a' && /btn|button/i.test(cls))) {
    counters.cta = (counters.cta ?? 0) + 1
    return counters.cta === 1 ? 'cta.primary' : `cta.${counters.cta}`
  }
  if (tagLower === 'li') {
    counters.list = (counters.list ?? 0) + 1
    return `list.${counters.list}`
  }
  return null
}

/** Add data-ai-field attributes where missing (heuristic). */
export function autoAnnotateSemanticSlots(html: string): string {
  const counters: Record<string, number> = {}
  const usedFields = new Set<string>()

  const tagPattern =
    /<(h[1-6]|p|button|a|span|li|td|th|blockquote|label|figcaption|small|strong|em|footer|div)([^>]*)>([\s\S]*?)<\/\1>/gi

  return html.replace(tagPattern, (match, tag: string, attrs: string, inner: string) => {
    if (/data-ai-field=/i.test(attrs)) return match
    if (/skip|noscript|script|style/i.test(attrs)) return match

    const text = extractPlainText(inner)
    const tagLower = tag.toLowerCase()
    const minLen = /^h[1-6]$/i.test(tag) || tagLower === 'button' || tagLower === 'a' ? 1 : 2
    if (!text || text.length < minLen) return match

    const isLeaf = !/<[a-z][\s>]/i.test(inner.replace(/<br\s*\/?>/gi, ''))
    const shouldTag =
      /^h[1-6]$/i.test(tag) ||
      tagLower === 'p' ||
      tagLower === 'button' ||
      tagLower === 'li' ||
      tagLower === 'small' ||
      tagLower === 'label' ||
      tagLower === 'footer' ||
      (tagLower === 'a' && /cta|btn|button|w-button/i.test(attrs)) ||
      (tagLower === 'span' && /badge|label|tag/i.test(attrs)) ||
      ((tagLower === 'div' || tagLower === 'span') && isLeaf)

    if (!shouldTag) return match

    let field = inferFieldName(tag, attrs, counters)
    if (!field) return match

    let uniqueField: string = field
    while (usedFields.has(uniqueField)) {
      const parts = uniqueField.split('.')
      const last = parts.pop() ?? '1'
      const num = Number(last)
      if (!Number.isNaN(num)) {
        parts.push(String(num + 1))
        uniqueField = parts.join('.')
      } else {
        uniqueField = `${uniqueField}.alt`
      }
    }
    usedFields.add(uniqueField)

    return `<${tag}${attrs} data-ai-field="${uniqueField}">${inner}</${tag}>`
  })
}

/** Parse semantic slots from HTML (data-ai-field attributes). */
export function parseSemanticSlots(html: string): {
  html: string
  slots: SemanticSlot[]
  schema: Record<string, string>
} {
  const annotated = autoAnnotateSemanticSlots(html)
  const slots: SemanticSlot[] = []
  const schema: Record<string, string> = {}

  const tagPattern =
    /<([a-z][a-z0-9]*)((?:\s[^>]*)?\sdata-ai-field="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi

  annotated.replace(tagPattern, (_match, tag: string, attrs: string, field: string, inner: string) => {
    const text = extractPlainText(inner)
    if (!text.trim()) return _match

    const constraints = DEFAULT_CONSTRAINTS[field]
    const section = detectSection(field, tag, attrs, text)
    const role = FIELD_ROLE_HINTS[field]

    slots.push({
      field,
      tag: tag.toLowerCase(),
      text,
      innerHtml: inner,
      section,
      role,
      constraints,
    })
    schema[field] = text
    return _match
  })

  return { html: annotated, slots, schema }
}

/** Apply structured JSON slot updates — never rewrites layout. */
export function applySemanticSlotPatches(html: string, updates: Record<string, string>): string {
  if (!Object.keys(updates).length) return html

  let result = html

  for (const [field, newText] of Object.entries(updates)) {
    if (!newText?.trim()) continue

    const fieldPattern = new RegExp(
      `(<([a-z][a-z0-9]*)((?:\\s[^>]*)?\\sdata-ai-field="${escapeRegex(field)}"[^>]*)>)([\\s\\S]*?)(<\\/\\2>)`,
      'i',
    )

    result = result.replace(fieldPattern, (_m, openPart, tag, attrs, inner, closeTag) => {
      const openTag = `<${tag}${attrs}>`
      return applyTextPreservingMarkup(openTag, inner, closeTag, newText)
    })
  }

  return result
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function groupSlotsBySection(slots: SemanticSlot[]): Record<string, SemanticSlot[]> {
  const groups: Record<string, SemanticSlot[]> = { general: [] }
  for (const slot of slots) {
    const key = slot.section ?? 'general'
    if (!groups[key]) groups[key] = []
    groups[key].push(slot)
  }
  return groups
}

export function buildSemanticPromptFields(slots: SemanticSlot[]): string {
  return slots
    .map((slot) => {
      const constraints = slot.constraints
      const constraintNote = constraints
        ? ` [max ${constraints.maxWords ?? '?'} words, goal: ${constraints.goal ?? 'conversion'}]`
        : ''
      const roleNote = slot.role ? ` — ${slot.role}` : ''
      const structureNote =
        slot.innerHtml.includes('<') && !slot.innerHtml.match(/^[^<]+$/)
          ? ` (${describeInlineStructure(slot.innerHtml)})`
          : ''
      return `"${slot.field}": <${slot.tag}>${roleNote}${constraintNote}${structureNote}\n  current: ${slot.text}`
    })
    .join('\n\n')
}

export function normalizeSemanticUpdates(raw: Record<string, unknown>): Record<string, string> {
  const updates: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.trim()) {
      updates[key] = value.trim()
    }
  }
  return updates
}

/** Strip data-ai-field markers for export (optional). */
export function stripSemanticMarkers(html: string): string {
  return html.replace(/\sdata-ai-field="[^"]*"/gi, '')
}

/** Build default schema JSON from HTML. */
export function buildSemanticSchema(html: string): Record<string, string> {
  return parseSemanticSlots(html).schema
}
