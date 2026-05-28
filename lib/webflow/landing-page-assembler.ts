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
}

const FORBIDDEN_WRAPPER_PATTERN = /<!DOCTYPE|<html[\s>]|<\/html>|<head[\s>]|<\/head>|<body[\s>]|<\/body>/i

/** Stable scope class from project or template id. */
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

function extractStylesheetLinks(html: string): { imports: string; htmlWithoutLinks: string } {
  const imports: string[] = []
  const without = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (href) imports.push(`@import url('${href}');`)
    return ''
  })
  return { imports: imports.join('\n'), htmlWithoutLinks: without }
}

function extractScriptBlocks(html: string): { js: string; htmlWithoutScripts: string } {
  const scripts: string[] = []
  const without = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, js: string) => {
    if (js.trim()) scripts.push(js.trim())
    return ''
  })
  return { js: scripts.join('\n\n'), htmlWithoutScripts: without }
}

/**
 * Prefix CSS selectors with a scope class to avoid Webflow global style conflicts.
 * Handles simple rules, @media blocks, and preserves @keyframes/@font-face.
 */
export function scopeCssToTemplate(css: string, scopeClass: string): string {
  if (!css?.trim()) return ''

  const scope = `.${scopeClass}`
  const chunks = css.split(/(?=@media\s)/g)
  const scoped: string[] = []

  for (const chunk of chunks) {
    if (chunk.trim().startsWith('@media')) {
      const mediaMatch = chunk.match(/^(@media[^{]+)\{([\s\S]*)\}\s*$/i)
      if (mediaMatch) {
        scoped.push(`${mediaMatch[1]}{${scopeCssToTemplate(mediaMatch[2], scopeClass)}}`)
      } else {
        scoped.push(chunk)
      }
      continue
    }

    scoped.push(
      chunk.replace(/([^{}@/][^{]*)\{/g, (match, selectors: string) => {
        const trimmed = selectors.trim()
        if (!trimmed || trimmed.startsWith('@keyframes') || trimmed.startsWith('@font-face')) {
          return match
        }
        if (trimmed.startsWith('@')) return match

        const prefixed = trimmed
          .split(',')
          .map((sel) => {
            const s = sel.trim()
            if (!s) return s
            if (s === 'html' || s === 'body' || s === ':root') return scope
            if (s.startsWith(scope)) return s

            const wrapperRoot =
              /^\.ai-landing-wrap(?:per)?(?:\b|$)/.test(s) ||
              s === '.ai-template-scope' ||
              s.startsWith('.ai-landing-wrap ') ||
              s.startsWith('.ai-landing-wrapper ')

            if (wrapperRoot) {
              const rest = s
                .replace(/^\.ai-landing-wrap(?:per)?/, '')
                .replace(/^\.ai-template-scope/, '')
              const rootClass = `.${scopeClass}.ai-landing-wrapper`
              return rest.trim() ? `${rootClass}${rest}` : rootClass
            }

            return `${scope} ${s}`
          })
          .join(', ')

        return `${prefixed} {`
      }),
    )
  }

  return scoped.join('\n')
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

/** Base reset styles so Webflow global CSS does not break Automaio templates. */
export function buildWebflowIsolationCss(scopeClass: string): string {
  const scope = `.${scopeClass}.ai-landing-wrapper`
  return `
${scope} {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  color: var(--automaio-text, #0f172a);
  background: var(--automaio-bg, #ffffff);
}
${scope} *,
${scope} *::before,
${scope} *::after {
  box-sizing: border-box;
}
${scope} img {
  max-width: 100%;
  height: auto;
}
${scope} h1, ${scope} h2, ${scope} h3, ${scope} h4, ${scope} h5, ${scope} h6 {
  margin: 0 0 0.5em;
  line-height: 1.2;
  font-weight: 700;
}
${scope} p {
  margin: 0 0 1em;
}
${scope} a {
  color: inherit;
}
`.trim()
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
 * Split generated HTML into Webflow CMS Plain Text fields:
 * - htmlContent: semantic section markup only (no document wrapper)
 * - cssContent: scoped CSS (no global pollution)
 * - jsContent: isolated, sanitized IIFE
 */
export function assembleLandingPageForWebflow(
  rawHtml: string,
  options: AssembleLandingPageOptions,
): AssembledLandingPage {
  const scopeClass = buildScopeClass(options.scopeId)
  let html = normalizeAssetUrls(rawHtml, options.cdnBase)

  const { js: rawJs, htmlWithoutScripts } = extractScriptBlocks(html)
  const { css: inlineCss, htmlWithoutStyles } = extractStyleBlocks(htmlWithoutScripts)
  const { imports, htmlWithoutLinks } = extractStylesheetLinks(htmlWithoutStyles)

  let htmlContent = stripDocumentWrapper(htmlWithoutLinks)
  htmlContent = sanitizeLandingPageHtml(htmlContent)
  htmlContent = wrapWithScope(htmlContent, scopeClass)

  const rawCss = [imports, inlineCss].filter(Boolean).join('\n\n')
  let cssContent = [
    buildWebflowIsolationCss(scopeClass),
    scopeCssToTemplate(rawCss, scopeClass),
  ]
    .filter(Boolean)
    .join('\n\n')

  // Fallback: if scoping produced empty output but we had CSS, scope the wrapper only
  if (!cssContent.trim() && rawCss.trim()) {
    cssContent = scopeCssToTemplate(
      `.${scopeClass} { display: block; }\n${rawCss}`,
      scopeClass,
    )
  }

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
  }
}

/** Rebuild a full preview document from split CMS parts (studio preview / embed fallback). */
export function buildDocumentFromSplitParts(
  assembled: AssembledLandingPage,
  title = 'Landing Page',
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${assembled.cssContent}</style>
</head>
<body>
  ${assembled.htmlContent}
  ${assembled.jsContent ? `<script>${assembled.jsContent}<\/script>` : ''}
</body>
</html>`
}
