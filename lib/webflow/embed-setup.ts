/** True when HTML is a full page document (needs embed, not Rich Text). */
export function isFullHtmlDocument(html: string): boolean {
  return /<!DOCTYPE|<html[\s>]/i.test(html.trim())
}

/** Strip outer document wrapper — Webflow Rich Text needs an HTML fragment. */
export function extractRichTextFragment(html: string): string {
  const trimmed = html.trim()
  if (!isFullHtmlDocument(trimmed)) return trimmed

  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) return bodyMatch[1].trim()

  return trimmed
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim()
}

export function buildCollectionEmbedSnippet(appUrl: string, webflowSiteId: string) {
  const base = appUrl.replace(/\/$/, '')
  return `<!-- Automaio: add this Embed to your CMS Collection Template page (before </body>) -->
<div id="automaio-root" data-automaio-api="${base}" data-automaio-site-id="${webflowSiteId}"></div>
<script src="${base}/webflow/embed.js" defer></script>`
}

export function buildProjectEmbedSnippet(appUrl: string, projectId: string) {
  const base = appUrl.replace(/\/$/, '')
  return `<!-- Automaio: iframe embed — content loads from ${base}/webflow/embed/project/${projectId} -->
<div id="automaio-root" data-automaio-project-id="${projectId}" data-automaio-api="${base}"></div>
<script src="${base}/webflow/embed.js" defer></script>`
}

export function findPlainTextField(
  fields: Array<{ slug: string; type: string }>,
  preferSlugs: string[],
): string | null {
  const slugSet = new Set(fields.map((f) => f.slug))
  for (const slug of preferSlugs) {
    const field = fields.find((f) => f.slug === slug)
    if (field && isPlainTextType(field.type)) return slug
  }
  const plain = fields.find((f) => isPlainTextType(f.type) && !['name', 'slug'].includes(f.slug))
  return plain?.slug ?? null
}

export function findRichTextField(
  fields: Array<{ slug: string; type: string }>,
  preferSlugs: string[],
): string | null {
  for (const slug of preferSlugs) {
    const field = fields.find((f) => f.slug === slug)
    if (field && isRichTextType(field.type)) return slug
  }
  return fields.find((f) => isRichTextType(f.type))?.slug ?? null
}

function isPlainTextType(type: string) {
  return type === 'PlainText' || type === 'Email' || type === 'Phone'
}

function isRichTextType(type: string) {
  return type === 'RichText'
}
