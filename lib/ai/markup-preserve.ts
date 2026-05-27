/** Escape plain text for HTML text nodes. */
export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Collect direct text segments between child elements (server-side). */
function collectTextSegments(innerHtml: string): Array<{ start: number; end: number; text: string }> {
  const segments: Array<{ start: number; end: number; text: string }> = []
  const regex = />([^<]+)</g
  let match: RegExpExecArray | null
  while ((match = regex.exec(innerHtml)) !== null) {
    const text = match[1]
    if (!text.trim()) continue
    segments.push({
      start: match.index + 1,
      end: match.index + 1 + text.length,
      text,
    })
  }

  const leading = innerHtml.match(/^([^<]+)/)
  if (leading?.[1]?.trim()) {
    segments.unshift({ start: 0, end: leading[1].length, text: leading[1] })
  }

  const trailing = innerHtml.match(/>([^<]+)$/)
  if (trailing?.[1]?.trim()) {
    const text = trailing[1]
    segments.push({
      start: innerHtml.length - text.length,
      end: innerHtml.length,
      text,
    })
  }

  return segments
}

/** Distribute new plain text across existing text nodes proportionally. */
export function replaceTextNodesProportionally(innerHtml: string, newText: string): string {
  const hasElements = /<[a-z][\s>]/i.test(innerHtml.replace(/<br\s*\/?>/gi, ''))
  if (!hasElements) return escapeHtmlText(newText)

  const segments = collectTextSegments(innerHtml)
  if (!segments.length) return escapeHtmlText(newText)

  const words = newText.trim().split(/\s+/).filter(Boolean)
  if (!words.length) {
    let result = innerHtml
    for (const seg of [...segments].reverse()) {
      result = result.slice(0, seg.start) + result.slice(seg.end)
    }
    return result
  }

  const weights = segments.map((s) => Math.max(1, s.text.trim().split(/\s+/).length))
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const allocations: string[] = []
  let wordIdx = 0

  for (let i = 0; i < segments.length; i++) {
    const isLast = i === segments.length - 1
    let count: number
    if (isLast) {
      count = words.length - wordIdx
    } else {
      count = Math.max(1, Math.round((weights[i] / totalWeight) * words.length))
      count = Math.min(count, words.length - wordIdx - (segments.length - i - 1))
    }
    allocations.push(words.slice(wordIdx, wordIdx + count).join(' '))
    wordIdx += count
  }

  let result = innerHtml
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i]
    result = result.slice(0, seg.start) + escapeHtmlText(allocations[i] ?? '') + result.slice(seg.end)
  }

  return result
}

/** Apply new text to an element while preserving inline child markup. */
export function applyTextPreservingMarkup(
  openTag: string,
  innerHtml: string,
  closeTag: string,
  newText: string,
): string {
  const trimmed = newText.trim()
  if (!trimmed) return `${openTag}${innerHtml}${closeTag}`

  const hasElements = /<[a-z][\s>]/i.test(innerHtml.replace(/<br\s*\/?>/gi, ''))
  if (!hasElements) {
    return `${openTag}${escapeHtmlText(trimmed)}${closeTag}`
  }

  return `${openTag}${replaceTextNodesProportionally(innerHtml, trimmed)}${closeTag}`
}

/** Inline structure summary for AI prompts. */
export function describeInlineStructure(innerHtml: string): string {
  const tags = [...innerHtml.matchAll(/<([a-z][a-z0-9]*)[^>]*>/gi)].map((m) => m[1].toLowerCase())
  if (!tags.length) return 'plain text only'
  return `preserve inline tags: ${[...new Set(tags)].join(', ')}`
}
