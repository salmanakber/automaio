/** Wrap imported / external HTML as a single custom-code block on the canvas. */

const CUSTOM_CODE_BLOCK = `<section data-am-block="true" data-am-widget="customCode" data-am-custom-code="true" class="am-elt-block am-custom-code-block" style="width:100%;max-width:none;padding:0;margin:0;">
  <div data-am-custom-code-root="true" style="width:100%;">
`

const CUSTOM_CODE_CLOSE = `
  </div>
</section>`

function extractBodyInner(html: string): string {
  const trimmed = html.trim()
  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) return bodyMatch[1].trim()

  if (/<!DOCTYPE|<html[\s>]/i.test(trimmed)) {
    return trimmed
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .trim()
  }

  return trimmed
}

function extractHeadExtras(html: string): { styles: string; title: string } {
  const trimmed = html.trim()
  const styles = [...trimmed.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)].map((m) => m[0]).join('\n')
  const titleMatch = trimmed.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return { styles, title: titleMatch?.[1]?.trim() || 'Imported page' }
}

/** Wrap raw HTML as a full document with one custom-code block in the body. */
export function wrapHtmlAsCustomCodeBlock(html: string): string {
  const inner = extractBodyInner(html)
  const { styles, title } = extractHeadExtras(html)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  ${styles}
</head>
<body>
${CUSTOM_CODE_BLOCK}${inner}${CUSTOM_CODE_CLOSE}
</body>
</html>`
}

/** Wrap raw HTML when it is external/imported markup (not native studio blocks). */
export function wrapHtmlIfExternalImport(html: string): string {
  if (!html.trim() || isCustomCodeBlockHtml(html)) return html
  const isNativeStudio =
    /data-am-block=["']true["']/i.test(html) && /data-am-widget=/i.test(html)
  if (isNativeStudio) return html
  return wrapHtmlAsCustomCodeBlock(html)
}

export function isCustomCodeBlockHtml(html: string): boolean {
  return /data-am-custom-code=["']true["']/i.test(html)
}
