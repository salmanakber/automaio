export type TextElement = {
  id: string
  tag: string
  text: string
  section?: string
}

const SECTION_PATTERNS: Array<{ section: string; test: RegExp }> = [
  { section: 'hero', test: /\b(hero|banner|jumbotron|masthead)\b/i },
  { section: 'features', test: /\b(feature|benefit|grid|card)\b/i },
  { section: 'testimonials', test: /\b(testimonial|review|quote|social-proof)\b/i },
  { section: 'faq', test: /\b(faq|accordion|question)\b/i },
  { section: 'pricing', test: /\b(pric|plan|tier)\b/i },
  { section: 'cta', test: /\b(cta|call-to-action|signup|subscribe)\b/i },
  { section: 'contact', test: /\b(contact|form|get-in-touch)\b/i },
  { section: 'footer', test: /\b(footer|copyright)\b/i },
  { section: 'navigation', test: /\b(nav|header|menu)\b/i },
]

const TEXT_CLASS_PATTERN =
  /\b(heading|headline|title|subtitle|subheadline|lead|text-block|paragraph|feature|benefit|cta|button|w-button|w-richtext|display|hero-text)\b/i

function isHeadingTag(tag: string): boolean {
  return /^h[1-6]$/i.test(tag)
}

function hasTextClass(attrs: string): boolean {
  return /class=["'][^"']*["']/i.test(attrs) && TEXT_CLASS_PATTERN.test(attrs)
}

function extractPlainText(inner: string): string {
  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Remove prior personalization markers so re-runs can tag elements again. */
export function stripPersonalizationMarkers(html: string): string {
  return html
    .replace(/\sdata-am-id="[^"]*"/gi, '')
    .replace(/\sdata-am-kind="[^"]*"/gi, '')
}

function detectSection(tag: string, attrs: string, text: string): string | undefined {
  const context = `${attrs} ${text}`.slice(0, 200)
  for (const { section, test } of SECTION_PATTERNS) {
    if (test.test(context)) return section
  }
  if (/^h1$/i.test(tag)) return 'hero'
  if (/^h[2-3]$/i.test(tag) && /feature|benefit/i.test(text)) return 'features'
  if (/^h[2-3]$/i.test(tag) && /faq|question/i.test(text)) return 'faq'
  if (/^h[2-3]$/i.test(tag) && /price|plan/i.test(text)) return 'pricing'
  if (/button|cta/i.test(tag)) return 'cta'
  if (/^footer$/i.test(tag)) return 'footer'
  return undefined
}

/** Tag editable text elements in HTML with data-am-id attributes (server-side). */
export function tagTextElements(html: string): { html: string; elements: TextElement[] } {
  const elements: TextElement[] = []
  let idx = 0

  const tagPattern =
    /<(h[1-6]|p|button|li|td|th|blockquote|label|figcaption|span|div|a|strong|em)([^>]*)>([\s\S]*?)<\/\1>/gi

  const tagged = html.replace(tagPattern, (match, tag: string, attrs: string, inner: string) => {
    if (/skip|noscript|script|style/i.test(attrs)) return match

    const existingId = attrs.match(/data-am-id="(\d+)"/i)?.[1]
    const text = extractPlainText(inner)
    const tagLower = tag.toLowerCase()
    const minLen = isHeadingTag(tag) || tagLower === 'button' || tagLower === 'a' ? 1 : 2

    if (!text || text.length < minLen) return match

    const isLeaf = !/<[a-z][\s>]/i.test(inner.replace(/<br\s*\/?>/gi, ''))
    const shouldTag =
      isHeadingTag(tag) ||
      tagLower === 'p' ||
      tagLower === 'button' ||
      tagLower === 'li' ||
      tagLower === 'label' ||
      (tagLower === 'a' && /class=["'][^"']*cta/i.test(attrs)) ||
      hasTextClass(attrs) ||
      ((tagLower === 'div' || tagLower === 'span') && isLeaf)

    if (!shouldTag) return match

    const id = existingId ?? String(idx++)
    const section = detectSection(tag, attrs, text)
    elements.push({ id, tag: tagLower, text, section })

    if (existingId) return match

    const newAttrs = `${attrs} data-am-id="${id}" data-am-kind="text"`
    return `<${tag}${newAttrs}>${inner}</${tag}>`
  })

  return { html: tagged, elements }
}

/** Apply text updates to tagged HTML without changing structure. */
export function applyTextPatches(
  html: string,
  updates: Record<string, string>,
): string {
  return html.replace(
    /(<(?:h[1-6]|p|button|li|td|th|blockquote|label|figcaption|span|div|a)[^>]*data-am-id="(\d+)"[^>]*>)([\s\S]*?)(<\/(?:h[1-6]|p|button|li|td|th|blockquote|label|figcaption|span|div|a)>)/gi,
    (match, openTag, id, inner, closeTag) => {
      const newText = updates[id]
      if (newText === undefined) return match

      const hasChildElements = /<[a-z][\s>]/i.test(inner.replace(/<br\s*\/?>/gi, ''))
      if (!hasChildElements) {
        return `${openTag}${escapeHtml(newText)}${closeTag}`
      }

      const patched = inner.replace(/>([^<]+)</, () => `>${escapeHtml(newText)}<`)
      return `${openTag}${patched}${closeTag}`
    },
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function groupElementsBySection(elements: TextElement[]): Record<string, TextElement[]> {
  const groups: Record<string, TextElement[]> = { general: [] }
  for (const el of elements) {
    const key = el.section ?? 'general'
    if (!groups[key]) groups[key] = []
    groups[key].push(el)
  }
  return groups
}
