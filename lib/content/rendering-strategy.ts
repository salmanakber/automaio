import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'

/** Line threshold for automatic rendering strategy (enhancementContext.md). */
export const HTML_LINE_THRESHOLD = 4000

export type RenderingStrategy = {
  lineCount: number
  strategy: 'custom_code' | 'iframe_embed' | 'rich_text_html'
  htmlMode: PublishHtmlMode
  reason: string
}

export function countHtmlLines(html: string): number {
  if (!html?.trim()) return 0
  return html.split('\n').length
}

/**
 * Decide how to deliver HTML on Webflow:
 * - Small HTML (<4000 lines) with custom_code access → rich_text_html (native CMS rendering, better SEO)
 * - Large HTML (≥4000 lines) → iframe_embed (stability/performance)
 * - No custom_code access → rich_text_html fallback
 */
export function resolveRenderingStrategy(
  html: string,
  hasCustomCodeAccess: boolean,
): RenderingStrategy {
  const lineCount = countHtmlLines(html)

  if (!hasCustomCodeAccess) {
    return {
      lineCount,
      strategy: 'rich_text_html',
      htmlMode: 'rich_text_html',
      reason: 'Custom code unavailable — using CMS Rich Text delivery',
    }
  }

  if (lineCount >= HTML_LINE_THRESHOLD) {
    return {
      lineCount,
      strategy: 'iframe_embed',
      htmlMode: 'iframe_embed',
      reason: `HTML exceeds ${HTML_LINE_THRESHOLD} lines — using iframe embed for stability`,
    }
  }

  return {
    lineCount,
    strategy: 'custom_code',
    htmlMode: 'rich_text_html',
    reason: `HTML under ${HTML_LINE_THRESHOLD} lines — using direct CMS HTML for native rendering and SEO`,
  }
}
