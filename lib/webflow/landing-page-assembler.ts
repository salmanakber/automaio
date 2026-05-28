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

function extractStyleBlocks(html: string): { css: string; htmlWithoutStyles: string } {
  const styles: string[] = []
  const without = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css: string) => {
    styles.push(css.trim())
    return ''
  })
  return { css: styles.join('\n\n'), htmlWithoutStyles: without }
}

function extractStylesheetLinks(html: string): { urls: string[]; htmlWithoutLinks: string } {
  const urls: string[] = []
  const without = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (href) urls.push(href)
    return ''
  })
  return { urls, htmlWithoutLinks: without }
}

function extractScriptBlocks(html: string): { js: string; htmlWithoutScripts: string } {
  const scripts: string[] = []
  const without = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, js: string) => {
    if (js.trim()) scripts.push(js.trim())
    return ''
  })
  return { js: scripts.join('\n\n'), htmlWithoutScripts: without }
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

  return `<div class="${scopeClass} ai-landing-wrapper ai-template-scope">\n${trimmed}\n</div>`
}

function wrapJsInScopeIife(js: string, scopeClass: string): string {
  if (!js.trim()) return ''
  return `(function(){
  var root = document.querySelector('.${scopeClass}');
  if (!root) return;
  ${js}
})();`
}

export type AssembleLandingPageOptions = {
  scopeId: string
  cdnBase?: string
  allowJs?: boolean
}

/**
 * Split generated HTML for Webflow remote runtime.
 * CSS is preserved exactly (no selector prefixing) so templates match the studio preview.
 * Font/stylesheet links are returned separately for head injection at runtime.
 */
export function assembleLandingPageForWebflow(
  rawHtml: string,
  options: AssembleLandingPageOptions,
): AssembledLandingPage {
  const scopeClass = buildScopeClass(options.scopeId)
  let html = normalizeAssetUrls(rawHtml, options.cdnBase)

  const { js: rawJs, htmlWithoutScripts } = extractScriptBlocks(html)
  const { css: inlineCss, htmlWithoutStyles } = extractStyleBlocks(htmlWithoutScripts)
  const { urls: stylesheetUrls, htmlWithoutLinks } = extractStylesheetLinks(htmlWithoutStyles)

  let htmlContent = stripDocumentWrapper(htmlWithoutLinks)
  htmlContent = sanitizeLandingPageHtml(htmlContent)
  htmlContent = wrapWithScope(htmlContent, scopeClass)

  const { global: globalCss, local: localCss } = extractGlobalCssAtRules(inlineCss)
  const cssContent = [globalCss, localCss].filter(Boolean).join('\n\n')

  let jsContent = ''
  if (options.allowJs !== false && rawJs.trim()) {
    const sanitized = sanitizeLandingPageJs(rawJs)
    jsContent = wrapJsInScopeIife(sanitized, scopeClass)
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
