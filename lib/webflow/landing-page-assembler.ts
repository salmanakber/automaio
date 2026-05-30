import * as cheerio from 'cheerio'
import { CAROUSEL_JS } from '@/lib/editor/carousel-runtime'
import { extractRichTextFragment } from '@/lib/webflow/embed-setup'
import {
  normalizeAssetUrls,
  sanitizeLandingPageHtml,
  sanitizeLandingPageJs,
} from '@/lib/webflow/webflow-security'

export type AssembledLandingPage = {
  scopeClass: string
  htmlContent: string
  cssContent: string
  jsContent: string
  /** External stylesheets (Google Fonts, etc.) — injected into document head at runtime. */
  stylesheetUrls: string[]
}

const FORBIDDEN_WRAPPER_PATTERN = /<!DOCTYPE|<html[\s>]|<\/html>|<head[\s>]|<\/head>|<body[\s>]|<\/body>/i

/** Stable scope class from project or template id (used for JS isolation only). */
export function buildScopeClass(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)
  return `ai-template-${safe || 'page'}`
}

type CheerioExtractResult = {
  css: string
  js: string
  stylesheetUrls: string[]
  htmlWithoutAssets: string
}

/**
 * Split HTML into CSS, JS, and clean markup using cheerio.
 * External script tags (src-only) and non-stylesheet links stay in HTML.
 */
export function extractHtmlCssJsWithCheerio(html: string): CheerioExtractResult {
  const $ = cheerio.load(html, { xml: false }, false)

  let css = ''
  $('style').each((_, el) => {
    const inner = $(el).html() ?? ''
    if (inner.trim()) css += `${inner}\n`
  })

  let js = ''
  $('script').each((_, el) => {
    const hasSrc = Boolean($(el).attr('src')?.trim())
    const inner = $(el).html() ?? ''
    if (hasSrc && !inner.trim()) return
    if (inner.trim()) js += `${inner}\n`
  })

  const stylesheetUrls: string[] = []
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href')?.trim()
    if (href) stylesheetUrls.push(href)
  })

  $('style').remove()
  $('script').remove()
  $('link[rel="stylesheet"]').remove()

  const htmlWithoutAssets = $.root().children().toArray().map((node) => $.html(node)).join('')

  return { css: css.trim(), js: js.trim(), stylesheetUrls, htmlWithoutAssets }
}

/** Pull @import / @font-face / @keyframes to the top — must never be prefixed or scoped. */
export function extractGlobalCssAtRules(css: string): { global: string; local: string } {
  if (!css?.trim()) return { global: '', local: '' }

  const globalParts: string[] = []
  let local = css

  local = local.replace(/@import[\s\S]*?;/gi, (match) => {
    globalParts.push(match.trim())
    return ''
  })

  local = local.replace(/@font-face\s*\{[\s\S]*?\}/gi, (match) => {
    globalParts.push(match.trim())
    return ''
  })

  local = local.replace(/@keyframes[\s\S]*?\{(?:[^{}]|\{[^{}]*\})*\}/gi, (match) => {
    globalParts.push(match.trim())
    return ''
  })

  return { global: globalParts.filter(Boolean).join('\n\n'), local: local.trim() }
}

function stripDocumentWrapper(html: string): string {
  let fragment = html.trim()
  if (FORBIDDEN_WRAPPER_PATTERN.test(fragment)) {
    fragment = extractRichTextFragment(fragment)
  }
  return fragment
}

function wrapWithScope(html: string, scopeClass: string): string {
  const trimmed = html.trim()
  const scopePattern = new RegExp(`class=["'][^"']*${scopeClass}`, 'i')
  if (scopePattern.test(trimmed)) return trimmed

  return `<div class="${scopeClass} ai-landing-wrapper ai-template-scope ai-wrapper">\n${trimmed}\n</div>`
}

function wrapJsInScopeIife(js: string, scopeClass: string): string {
  if (!js.trim()) return ''
  return `(function(){
  var root = document.querySelector('.${scopeClass}');
  if (!root) return;
  ${js}
})();`
}

/** Rough line count — used to detect accidental content loss during split. */
function countNonEmptyLines(text: string): number {
  return text.split('\n').filter((line) => line.trim()).length
}

export type AssembleLandingPageOptions = {
  scopeId: string
  cdnBase?: string
  allowJs?: boolean
}

/**
 * Split generated HTML for Webflow remote runtime or legacy CMS fields.
 * CSS is preserved exactly (no selector prefixing) so templates match the studio preview.
 * Font/stylesheet links are returned separately for head injection at runtime.
 */
export function assembleLandingPageForWebflow(
  rawHtml: string,
  options: AssembleLandingPageOptions,
): AssembledLandingPage {
  const scopeClass = buildScopeClass(options.scopeId)
  let html = normalizeAssetUrls(rawHtml, options.cdnBase)
  const inputLines = countNonEmptyLines(html)

  const { css: inlineCss, js: rawJs, stylesheetUrls, htmlWithoutAssets } =
    extractHtmlCssJsWithCheerio(html)

  let htmlContent = stripDocumentWrapper(htmlWithoutAssets)
  htmlContent = sanitizeLandingPageHtml(htmlContent)
  htmlContent = wrapWithScope(htmlContent, scopeClass)

  const { global: globalCss, local: localCss } = extractGlobalCssAtRules(inlineCss)
  const cssContent = [globalCss, localCss].filter(Boolean).join('\n\n')

  let jsContent = ''
  if (options.allowJs !== false && rawJs.trim()) {
    const sanitized = sanitizeLandingPageJs(rawJs)
    jsContent = wrapJsInScopeIife(sanitized, scopeClass)
  }

  const needsCarousel = /data-am-carousel=["']true["']/i.test(rawHtml)
  if (options.allowJs !== false && needsCarousel) {
    const carouselSanitized = sanitizeLandingPageJs(CAROUSEL_JS)
    jsContent = jsContent ? `${jsContent}\n${carouselSanitized}` : carouselSanitized
  }

  const outputLines =
    countNonEmptyLines(htmlContent) +
    countNonEmptyLines(cssContent) +
    countNonEmptyLines(jsContent) +
    stylesheetUrls.length

  if (process.env.NODE_ENV === 'development' && outputLines + 5 < inputLines) {
    console.warn(
      '[assembleLandingPageForWebflow] Split may have dropped content — input lines:',
      inputLines,
      'output approx:',
      outputLines,
    )
  }

  return {
    scopeClass,
    htmlContent,
    cssContent,
    jsContent,
    stylesheetUrls,
  }
}

/** Rebuild a full preview document from split CMS parts (studio preview / embed fallback). */
export function buildDocumentFromSplitParts(
  assembled: AssembledLandingPage,
  title = 'Landing Page',
): string {
  const links = assembled.stylesheetUrls
    .map((href) => `<link rel="stylesheet" href="${href}" />`)
    .join('\n  ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  ${links}
  <style>${assembled.cssContent}</style>
</head>
<body>
  ${assembled.htmlContent}
  ${assembled.jsContent ? `<script>${assembled.jsContent}<\/script>` : ''}
</body>
</html>`
}

/**
 * @deprecated Aggressive scoping broke template CSS (@import, fonts). Kept for legacy callers only.
 */
export function scopeCssToTemplate(css: string, _scopeClass: string): string {
  const { global, local } = extractGlobalCssAtRules(css)
  return [global, local].filter(Boolean).join('\n\n')
}

/** @deprecated Isolation reset removed — it overrode template fonts/layout. */
export function buildWebflowIsolationCss(_scopeClass: string): string {
  return ''
}
