import {
  GENERATED_CSS_SLUG,
  GENERATED_HTML_SLUG,
  RENDER_EMBED_MARKER,
  RENDER_EMBED_VERSION,
} from '@/lib/webflow/publishing/types'

function wfPlainText(path: string): string {
  return `{{wf {"path":"${path}","type":"PlainText"} }}`
}

/**
 * Collection-template Embed markup — server-side SEO rendering via Webflow CMS bindings.
 * Insert once on the collection template canvas; content updates via CMS field publishes only.
 */
export function buildSplitRenderEmbedMarkup(): string {
  return `<!-- Automaio direct render (${RENDER_EMBED_MARKER}="${RENDER_EMBED_VERSION}") -->
<div class="automaio-render-root" ${RENDER_EMBED_MARKER}="${RENDER_EMBED_VERSION}">
  <style>
${wfPlainText(GENERATED_CSS_SLUG)}
  </style>

${wfPlainText(GENERATED_HTML_SLUG)}
</div>`
}

/** Runtime collection template — mount node only; content from Automaio API. */
export function buildRuntimeRenderEmbedMarkup(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `<!-- Automaio runtime render (${RENDER_EMBED_MARKER}="runtime") -->
<div id="ai-page-root" ${RENDER_EMBED_MARKER}="runtime" data-automaio-page-id="${wfPlainText('page-id')}"></div>
<script src="${base}/webflow/runtime.js?v=1.0.4" defer></script>`
}
