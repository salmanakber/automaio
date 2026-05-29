/**
 * Legacy Webflow CMS Collection Template embed (HTML/CSS/JS in CMS fields).
 * Uses native {{wf}} bindings — config-type should be split_method.
 */
export function buildWebflowCollectionTemplateEmbed(): string {
  return `<!-- Automaio Legacy Split Renderer (config-type: split_method) -->
<div class="ai-wrapper">
  <style>
{{wf {"path":"css","type":"PlainText"} }}
  </style>

{{wf {"path":"html","type":"PlainText"} }}
</div>
<script>
{{wf {"path":"js","type":"PlainText"} }}
</script>`
}

export const WEBFLOW_COLLECTION_TEMPLATE_SETUP = [
  'Remote runtime (config-type: remote_runtime) uses runtime.js — recommended for new collections.',
  'Legacy split (config-type: split_method) uses html, css, js Plain Text fields with {{wf}} bindings above.',
  'Iframe embed (config-type: iframe_embed) uses iframe-url Plain Text field.',
] as const

export { buildWebflowRuntimeCollectionEmbed, WEBFLOW_RUNTIME_TEMPLATE_SETUP } from '@/lib/webflow/runtime-embed'
