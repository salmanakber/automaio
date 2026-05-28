/**
 * Webflow Collection Template snippets — paste in Designer or applied via custom code bootstrap.
 * Marketplace-safe: no eval() or CMS-driven script execution (Webflow App Store policy).
 */

export const SPLIT_CMS_FIELD_PATHS = {
  html: 'html',
  css: 'css',
  js: 'js',
} as const

export const IFRAME_CMS_FIELD_PATH = 'iframe-url'

function wfPlainText(path: string): string {
  return `{{wf {"path":"${path}","type":"PlainText"} }}`
}

function injectSplitMarkup(root: string, styleEl: string, html: string, css: string): string {
  return `(function(){
  var html = ${html};
  var css = ${css};
  if (html && html.indexOf('{{') === -1) {
    var root = document.getElementById('${root}');
    if (root) root.innerHTML = html;
  }
  if (css && css.indexOf('{{') === -1) {
    var styleEl = document.getElementById('${styleEl}');
    if (styleEl) styleEl.textContent = css;
  }
})();`
}

/** Collection template body — split HTML/CSS from CMS (JS field stored but not executed). */
export function buildWebflowSplitCollectionEmbed(): string {
  const htmlBinding = `\`${wfPlainText(SPLIT_CMS_FIELD_PATHS.html)}\``
  const cssBinding = `\`${wfPlainText(SPLIT_CMS_FIELD_PATHS.css)}\``
  return `<!-- Automaio Legacy Split HTML — html + css only (no CMS JS execution) -->
<div id="page-root"></div>
<style id="page-style"></style>
<script>
${injectSplitMarkup('page-root', 'page-style', htmlBinding, cssBinding)}
<\/script>`
}

/** Collection template — iframe URL from CMS Plain Text field. */
export function buildWebflowIframeCollectionEmbed(): string {
  return `<!-- Automaio Legacy Iframe Embed — bind Plain Text field: iframe-url -->
<div id="automaio-iframe-host" style="width:100%;min-height:min(80vh,900px);position:relative;"></div>
<script>
(function(){
  var src = \`${wfPlainText(IFRAME_CMS_FIELD_PATH)}\`;
  if (!src || src.indexOf('{{') !== -1) return;
  var host = document.getElementById('automaio-iframe-host');
  if (!host) return;
  host.replaceChildren();
  var frame = document.createElement('iframe');
  frame.src = src;
  frame.title = 'Page content';
  frame.loading = 'lazy';
  frame.setAttribute('allow', 'fullscreen');
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.style.cssText = 'width:100%;border:0;display:block;min-height:min(80vh,900px);background:transparent';
  host.appendChild(frame);
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'automaio-embed-resize' && e.data.height > 0) {
      frame.style.height = Math.max(320, e.data.height) + 'px';
    }
  });
})();
<\/script>`
}

/** Registered inline script — html/css only, marketplace-safe. */
export function buildSplitInlineBootstrap(): string {
  return `(function(){
if(window.__automaioSplitBoot)return;window.__automaioSplitBoot=1;
function read(slugs){for(var i=0;i<slugs.length;i++){var s=slugs[i];
var el=document.getElementById('am-'+s)||document.querySelector('[data-am-cms="'+s+'"]');
if(el){var t=(el.textContent||'').trim();if(t&&t.indexOf('{{')===-1&&t.length>0)return t;}}return '';}
var html=read(['html','html-content','html_content']);
var css=read(['css','css-content','css_content']);
if(!html&&!css)return;
var root=document.getElementById('page-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'page-root'}));
var styleEl=document.getElementById('page-style')||(function(){var s=document.createElement('style');s.id='page-style';document.head.appendChild(s);return s;})();
if(html)root.innerHTML=html;
if(css)styleEl.textContent=css;
})();`
}

export function buildIframeInlineBootstrap(): string {
  return `(function(){
if(window.__automaioIframeBoot)return;window.__automaioIframeBoot=1;
function read(slugs){for(var i=0;i<slugs.length;i++){var s=slugs[i];
var el=document.getElementById('am-'+s)||document.querySelector('[data-am-cms="'+s+'"]');
if(el){var t=(el.textContent||'').trim();if(t&&t.indexOf('{{')===-1&&t.indexOf('http')===0)return t;}}return '';}
var src=read(['iframe-url','iframe_url','embed-url']);
if(!src)return;
var host=document.getElementById('automaio-iframe-host')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'automaio-iframe-host'}));
host.replaceChildren();
var f=document.createElement('iframe');f.src=src;f.title='Page';f.loading='lazy';
f.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-forms');
f.referrerPolicy='strict-origin-when-cross-origin';
f.style.cssText='width:100%;border:0;display:block;min-height:min(80vh,900px)';
host.appendChild(f);
})();`
}
