/**
 * Legacy Webflow CMS Collection Template embed (HTML/CSS/JS in CMS fields).
 * Prefer buildWebflowRuntimeCollectionEmbed() from runtime-embed.ts for new collections.
 */
export function buildWebflowCollectionTemplateEmbed(): string {
  return `<!-- Automaio Legacy Renderer — no runtime.js / Page ID required -->
<style>
{{wf {"path":"css-content","type":"PlainText"} }}
</style>
<div class="ai-landing-wrapper">
{{wf {"path":"html-content","type":"PlainText"} }}
</div>
<script>
{{wf {"path":"js-content","type":"PlainText"} }}
</script>`
}

export const WEBFLOW_COLLECTION_TEMPLATE_SETUP = [
  'Prefer the Remote Runtime embed (runtime.js) for new collections.',
  'Legacy split HTML/CSS/JS embed is only for older collections.',
] as const

export { buildWebflowRuntimeCollectionEmbed, WEBFLOW_RUNTIME_TEMPLATE_SETUP } from '@/lib/webflow/runtime-embed'
