import { getAppBaseUrl } from '@/lib/app-url'

/** Lightweight Webflow collection template — mounts remote runtime (no HTML/CSS in CMS). */
export function buildWebflowRuntimeCollectionEmbed(appUrl?: string): string {
  const base = (appUrl ?? getAppBaseUrl()).replace(/\/$/, '')

  return `<!-- Automaio Remote Runtime — page content rendered from platform API -->
<div id="ai-page-root" data-automaio-page-id="{{wf {"path":"page-id","type":"PlainText"} }}"></div>
<script src="${base}/webflow/runtime.js" defer></script>
<script>
(function(){
  var el = document.getElementById('ai-page-root');
  var pageId = el && el.getAttribute('data-automaio-page-id');
  if (!pageId || !window.AutomaioRuntime) return;
  window.AutomaioRuntime.render({
    pageId: pageId.trim(),
    target: '#ai-page-root',
    apiBase: '${base}'
  });
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
  'Optional: bind Page ID to a hidden text field on your collection template for faster lookup.',
  'Bind SEO Title and SEO Description to page SEO settings.',
  'Each CMS item stores Page ID + metadata — content renders from Automaio.',
  'Republish Webflow once after connecting; future page updates deploy without changing CMS HTML.',
] as const
