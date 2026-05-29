/** Minimal collection template shell — Webflow requires canvas elements for CMS item routes. */

export const TEMPLATE_SHELL_SCRIPT_NAME = 'Automaio Template Shell'
export const TEMPLATE_SHELL_VERSION = '1.0.0'

/** Head bootstrap — ensures mount nodes exist when the page HTML loads. */
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
  if(!document.querySelector(".ai-wrapper[data-automaio-split]")){
    var wrap=document.createElement("div");
    wrap.className="ai-wrapper";
    wrap.setAttribute("data-automaio-split","1");
    wrap.style.cssText="min-height:1px;width:100%";
    document.body.appendChild(wrap);
  }
}
if(document.body)ensure();
else document.addEventListener("DOMContentLoaded",ensure);
})();`
}

/** Copy-paste fallback for collection template custom code (Before </body> tag) in Designer. */
export function buildCollectionTemplateBodySnippet(): string {
  return `<!-- Automaio — minimal collection template shell (required for CMS item URLs) -->
<main class="automaio-cms-shell" style="min-height:1px;width:100%">
  <div id="ai-page-root" data-automaio-root="true" style="min-height:1px"></div>
  <div class="ai-wrapper" data-automaio-split="1" style="min-height:1px"></div>
</main>`
}

export const COLLECTION_TEMPLATE_SETUP_STEPS = [
  'Open Webflow Designer → Pages → CMS Collection pages → your Landing pages template.',
  'In Publish settings, turn ON publishing for this collection template.',
  'Use the Automaio Designer panel → “Install template shell” (adds required elements automatically).',
  'Or paste the minimal shell snippet into the template canvas (Add Elements → Embed / Div).',
  'Publish the site from Webflow Designer (required once after shell install).',
]
