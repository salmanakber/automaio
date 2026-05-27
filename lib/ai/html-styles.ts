/** Extract all inline style blocks from HTML (template + theme CSS). */
export function extractInlineStyleBlocks(html: string): string {
  return [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)].map((m) => m[0]).join('\n')
}

/** Remove inline style blocks — markup only. */
export function stripInlineStyleBlocks(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim()
}

/** Re-attach preserved styles if the personalized HTML lost them. */
export function mergePreservedStyles(originalHtml: string, resultHtml: string): string {
  const originalStyles = extractInlineStyleBlocks(originalHtml)
  if (!originalStyles.trim()) return resultHtml

  const resultStyles = extractInlineStyleBlocks(resultHtml)
  if (resultStyles.trim()) return resultHtml

  const body = stripInlineStyleBlocks(resultHtml)
  return `${originalStyles}\n${body}`.trim()
}

export function resolveUpdateText(updates: Record<string, string>, id: string): string | undefined {
  if (updates[id] !== undefined) return updates[id]
  const numeric = String(Number(id))
  if (updates[numeric] !== undefined) return updates[numeric]
  if (updates[`id_${id}`] !== undefined) return updates[`id_${id}`]
  return undefined
}
