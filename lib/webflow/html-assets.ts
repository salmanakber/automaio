import { extractRichTextFragment } from '@/lib/webflow/embed-setup'

/** Stylesheets and inline styles from document head (or top-level link/style tags). */
export function extractHeadAssets(html: string): string {
  const trimmed = html.trim()
  const headMatch = trimmed.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const source = headMatch?.[1] ?? trimmed

  const links = [...source.matchAll(/<link[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /rel=["']stylesheet["']/i.test(tag) || /rel=["']preconnect["']/i.test(tag))

  const styles = [...source.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)].map((m) => m[0])

  if (headMatch) {
    return [...links, ...styles].join('\n')
  }

  return [...links, ...styles].join('\n')
}

/** Rich Text body with styles preserved — Webflow strips scripts but allows link/style. */
export function extractRichTextWithAssets(html: string): string {
  const assets = extractHeadAssets(html)
  const body = extractRichTextFragment(html)
  return sanitizeForWebflowRichText([assets, body].filter(Boolean).join('\n'))
}

/** Remove content Webflow Rich Text rejects. */
export function sanitizeForWebflowRichText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
}

export function buildRichTextIframeEmbed(appUrl: string, projectId: string, iframeUrl?: string): string {
  const src =
    iframeUrl ??
    `${appUrl.replace(/\/$/, '')}/webflow/embed/project/${encodeURIComponent(projectId)}`
  return `<iframe src="${src}" style="width:100%;border:none;min-height:720px;display:block;" loading="lazy" title="Landing page"></iframe>`
}
