import { getAppBaseUrl } from '@/lib/app-url'

/** Lightweight Webflow collection template — mounts remote runtime (no HTML/CSS in CMS). */
export function buildWebflowRuntimeCollectionEmbed(appUrl?: string): string {
  const base = (appUrl ?? getAppBaseUrl()).replace(/\/$/, '')

  return `<!-- Remote page runtime — bind Page ID to data attribute -->
<div id="ai-page-root" data-automaio-page-id="{{wf {"path":"page-id","type":"PlainText"} }}"></div>
<script>
(function(){
  if(document.getElementById("automaio-page-loader"))return;
  var st=document.createElement("style");
  st.textContent="@keyframes am-spin{to{transform:rotate(360deg)}}#automaio-page-loader{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#fff}#automaio-page-loader .am-ring{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:am-spin .7s linear infinite}";
  (document.head||document.documentElement).appendChild(st);
  var o=document.createElement("div");
  o.id="automaio-page-loader";
  o.innerHTML='<div class="am-ring" role="status" aria-label="Loading"></div>';
  (document.body||document.documentElement).appendChild(o);
})();
</script>
<script src="${base}/webflow/runtime.js?v=1.0.5" defer></script>
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

  return `<!-- Remote page runtime -->
<div id="ai-page-root" data-automaio-page-id="PAGE_ID_HERE"></div>
<script>
(function(){
  if(document.getElementById("automaio-page-loader"))return;
  var st=document.createElement("style");
  st.textContent="@keyframes am-spin{to{transform:rotate(360deg)}}#automaio-page-loader{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#fff}#automaio-page-loader .am-ring{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:am-spin .7s linear infinite}";
  (document.head||document.documentElement).appendChild(st);
  var o=document.createElement("div");
  o.id="automaio-page-loader";
  o.innerHTML='<div class="am-ring" role="status" aria-label="Loading"></div>';
  (document.body||document.documentElement).appendChild(o);
})();
</script>
<script src="${base}/webflow/runtime.js?v=1.0.5" defer></script>
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
