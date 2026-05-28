import { getAppBaseUrl } from '@/lib/app-url'

/** Lightweight Webflow collection template — mounts remote runtime (no HTML/CSS in CMS). */
export function buildWebflowRuntimeCollectionEmbed(appUrl?: string): string {
  const base = (appUrl ?? getAppBaseUrl()).replace(/\/$/, '')

  return `<!-- Automaio Remote Runtime — bind Page ID to data attribute -->
<div id="ai-page-root" data-automaio-page-id="{{wf {"path":"page-id","type":"PlainText"} }}"></div>
<!-- Optional: hide Page ID / Runtime Config text rows with display:none in Webflow Designer -->
<script src="${base}/webflow/runtime.js?v=1.0.3" defer></script>
<script>
(function(){
  var el = document.getElementById('ai-page-root');
  var pageId = el && el.getAttribute('data-automaio-page-id');
  if (!pageId || pageId.indexOf('{{') !== -1) return;
  function go() {
    window.AutomaioRuntime && window.AutomaioRuntime.render({
      pageId: pageId.trim(),
      target: '#ai-page-root',
      apiBase: '${base}',
      hideShell: true
    });
  }
  if (window.AutomaioRuntime) go();
  else document.querySelector('script[src*="runtime.js"]').addEventListener('load', go);
})();
</script>`
}

export function buildWebflowRuntimeCollectionEmbedStatic(appUrl?: string): string {
  const base = (appUrl ?? getAppBaseUrl()).replace(/\/$/, '')

  return `<!-- Automaio Remote Runtime -->
<div id="ai-page-root" data-automaio-page-id="PAGE_ID_HERE"></div>
<script src="${base}/webflow/runtime.js" defer></script>
<script>
window.AutomaioRuntime && window.AutomaioRuntime.render({
  pageId: 'PAGE_ID_HERE',
  target: '#ai-page-root',
  apiBase: '${base}'
});
</script>`
}

export const WEBFLOW_RUNTIME_TEMPLATE_SETUP = [
  'Automaio auto-installs the runtime bootstrap when you create a collection or publish a page.',
  'Recommended: add one Embed with #ai-page-root bound to Page ID (see fallback snippet in Settings).',
  'Or bind Runtime Config JSON / Page ID to a visible Text field — bootstrap reads {"pageId":"..."}.',
  'Hide the Page ID / Runtime Config rows with display:none so only Automaio HTML shows.',
  'Republish Webflow after connecting; future content updates deploy without changing CMS HTML.',
] as const
