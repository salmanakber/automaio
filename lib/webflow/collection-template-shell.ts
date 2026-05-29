/** Collection template shell — canvas embed for CMS routes + SEO direct rendering. */

import { buildSplitRenderEmbedMarkup } from '@/lib/webflow/publishing/embed-template'

export const TEMPLATE_SHELL_SCRIPT_NAME = 'Automaio Template Shell'
export const TEMPLATE_SHELL_VERSION = '1.0.0'

/** Head bootstrap — runtime mount fallback only when canvas embed is missing. */
export function buildTemplateShellHeadBootstrap(): string {
  return `(function(){
if(window.__automaioTemplateShell)return;window.__automaioTemplateShell=1;
function ensure(){
  if(!document.body)return;
  if(document.querySelector("[data-automaio-render-embed]"))return;
  if(!document.getElementById("ai-page-root")){
    var root=document.createElement("div");
    root.id="ai-page-root";
    root.setAttribute("data-automaio-root","true");
    root.style.cssText="min-height:1px;width:100%";
    document.body.appendChild(root);
  }
}
if(document.body)ensure();
else document.addEventListener("DOMContentLoaded",ensure);
})();`
}

/** SEO canvas embed — insert once via Designer Extension. */
export function buildSeoCollectionTemplateCanvas(): string {
  return buildSplitRenderEmbedMarkup()
}

export function buildCollectionTemplateBodySnippet(): string {
  return buildSeoCollectionTemplateCanvas()
}

export const COLLECTION_TEMPLATE_SETUP_STEPS = [
  'Open Webflow Designer → Pages → CMS Collection pages → your collection template.',
  'Automaio auto-installs the render Embed on first direct-mode publish (no copy/paste).',
  'In Publish settings, turn ON publishing for this collection template.',
  'Publish the site from Webflow Designer once after embed install.',
]
