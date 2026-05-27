import { extractHeadAssets } from '@/lib/webflow/html-assets'
import { extractInlineStyleBlocks, mergePreservedStyles } from '@/lib/ai/html-styles'
import { stripPersonalizationMarkers } from '@/lib/ai/dom-patcher'
import { stripSemanticMarkers } from '@/lib/ai/semantic-slots'

/** Remove editor/personalization markers without altering layout or styles. */
export function stripEditorMarkers(html: string): string {
  return stripSemanticMarkers(stripPersonalizationMarkers(html))
    .replace(/\sdata-am-kind="[^"]*"/gi, '')
    .replace(/\scontenteditable="[^"]*"/gi, '')
    .replace(/\sclass="[^"]*\bam-active\b[^"]*"/gi, (m) => {
      const cleaned = m.replace(/\bam-active\b/g, '').replace(/\s+/g, ' ').trim()
      return cleaned === 'class=""' ? '' : cleaned
    })
}

/**
 * Preserve template HTML integrity — stylesheets, inline styles, and structure.
 * Use before/after personalization and when saving editor output.
 */
export function preserveTemplateHtmlIntegrity(originalHtml: string, resultHtml: string): string {
  const original = originalHtml.trim()
  let result = stripEditorMarkers(resultHtml.trim())
  if (!original) return result

  result = mergePreservedStyles(original, result)

  const originalHeadAssets = extractHeadAssets(original)
  const resultHeadAssets = extractHeadAssets(result)

  if (originalHeadAssets.trim() && !resultHeadAssets.trim()) {
    const body = result.replace(/<head[^>]*>[\s\S]*?<\/head>/i, '').trim()
    if (/<html[\s>]/i.test(original)) {
      result = original.replace(
        /<\/head>/i,
        `\n${originalHeadAssets}\n</head>`,
      )
      const bodyMatch = result.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        result = result.replace(bodyMatch[0], bodyMatch[0].replace(bodyMatch[1], body.replace(/<\/?body[^>]*>/gi, '')))
      }
    } else {
      result = `${originalHeadAssets}\n${body}`
    }
  }

  const originalStyles = extractInlineStyleBlocks(original)
  const resultStyles = extractInlineStyleBlocks(result)
  if (originalStyles.trim() && !resultStyles.trim()) {
    result = `${originalStyles}\n${result}`
  }

  return result.trim()
}

/** Normalize stored HTML without stripping user content. */
export function normalizeStoredHtml(html: string): string {
  return stripEditorMarkers(html.trim())
}
