/** Minimal collection template shell — Webflow requires canvas elements for CMS item routes. */

import { buildWebflowSplitMethodTemplateEmbed } from '@/lib/webflow/template-embeds'

export const TEMPLATE_SHELL_SCRIPT_NAME = 'Automaio Template Shell'
export const TEMPLATE_SHELL_VERSION = '1.0.0'

/** Head bootstrap — runtime mount only (split HTML is server-rendered on canvas). */
export function buildTemplateShellHeadBootstrap(): string {
  return `(function(){
if(window.__automaioTemplateShell)return;window.__automaioTemplateShell=1;
function ensure(){
  if(!document.body)return;
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

/**
 * SEO canvas embed — Webflow {{wf}} bindings render HTML/CSS in the initial HTML response.
 * Paste into collection template canvas (Embed) or use Designer → Install template shell.
 */
export function buildSeoCollectionTemplateCanvas(): string {
  return `<!-- Automaio collection template shell (required for CMS URLs + SEO split delivery) -->
<main class="automaio-cms-shell" style="min-height:1px;width:100%">
  <div id="ai-page-root" data-automaio-root="true" style="min-height:1px"></div>
${buildWebflowSplitMethodTemplateEmbed()}
</main>`
}

/** Copy-paste fallback for collection template canvas in Designer. */
export function buildCollectionTemplateBodySnippet(): string {
  return buildSeoCollectionTemplateCanvas()
}

export const COLLECTION_TEMPLATE_SETUP_STEPS = [
  'Open Webflow Designer → Pages → CMS Collection pages → your Landing pages template.',
  'In Publish settings, turn ON publishing for this collection template.',
  'Use the Automaio Designer panel → “Install template shell” (adds SEO {{wf}} embed automatically).',
  'Or paste the canvas snippet into the template (Add Elements → Embed).',
  'Publish the site from Webflow Designer (required once after shell install).',
]
