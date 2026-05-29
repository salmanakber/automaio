/**
 * Webflow Collection Template snippets — paste in Designer or applied via custom code bootstrap.
 * Legacy split uses native {{wf}} bindings for safe server-side rendering (config-type: split_method).
 */

export const SPLIT_CMS_FIELD_PATHS = {
  html: 'htmlContent',
  css: 'cssContent',
  js: 'jsContent',
} as const

export const IFRAME_CMS_FIELD_PATH = 'iframe-url'

function wfPlainText(path: string): string {
  return `{{wf {"path":"${path}","type":"PlainText"} }}`
}

/**
 * Legacy split method — Webflow native CMS bindings (config-type: split_method).
 * Safe rendering: CSS in <style>, HTML in wrapper. JS field optional (policy-dependent).
 */
export function buildWebflowSplitMethodTemplateEmbed(): string {
  return `<!-- Automaio Legacy Split (config-type: split_method) — bind Plain Text: htmlContent, cssContent, jsContent -->
<div class="ai-wrapper">
  <style>
${wfPlainText(SPLIT_CMS_FIELD_PATHS.css)}
  </style>

${wfPlainText(SPLIT_CMS_FIELD_PATHS.html)}
</div>
<script>
${wfPlainText(SPLIT_CMS_FIELD_PATHS.js)}
</script>`
}

/** Collection template — split HTML/CSS/JS via JS bootstrap (API fallback). */
export function buildWebflowSplitCollectionEmbed(): string {
  return buildWebflowSplitMethodTemplateEmbed()
}

/** Collection template — iframe URL from CMS Plain Text field. */
export function buildWebflowIframeCollectionEmbed(): string {
  return `<!-- Automaio Iframe Embed (config-type: iframe_embed) — bind Plain Text: iframe-url -->
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

/** Registered inline script — split html / css / js from CMS (fallback when {{wf}} bindings absent). */
export function buildSplitInlineBootstrap(): string {
  return `(function(){
if(window.__automaioSplitBoot)return;window.__automaioSplitBoot=1;
function readConfigType(){var el=document.querySelector('[data-wf-field="config-type"],#am-config-type,[data-am-cms="config-type"]');var t=el?(el.textContent||'').trim().toLowerCase():'';return t;}
if(readConfigType()==='remote_runtime'||readConfigType()==='iframe_embed')return;
function read(slugs){for(var i=0;i<slugs.length;i++){var s=slugs[i];
var el=document.getElementById('am-'+s)||document.querySelector('[data-am-cms="'+s+'"]')||document.querySelector('[data-wf-field="'+s+'"]');
if(el){var t=(el.textContent||'').trim();if(t&&t.indexOf('{{')===-1&&t.length>0)return t;}}return '';}
var html=read(['htmlContent','html-content','html_content','html']);
var css=read(['cssContent','css-content','css_content','css']);
var js=read(['jsContent','js-content','js_content','js']);
if(!html&&!css&&!js)return;
var wrapper=document.querySelector('.ai-wrapper[data-automaio-split]');
if(!wrapper){wrapper=document.createElement('div');wrapper.className='ai-wrapper';wrapper.setAttribute('data-automaio-split','1');(document.querySelector('main')||document.body).appendChild(wrapper);}
if(css){var st=wrapper.querySelector('style[data-automaio-css]');if(!st){st=document.createElement('style');st.setAttribute('data-automaio-css','1');wrapper.insertBefore(st,wrapper.firstChild);}st.textContent=css;}
if(html){var host=wrapper.querySelector('[data-automaio-html]');if(!host){host=document.createElement('div');host.setAttribute('data-automaio-html','1');wrapper.appendChild(host);}host.innerHTML=html;}
if(js){var sc=document.createElement('script');sc.textContent=js;wrapper.appendChild(sc);}
})();`
}

export function buildIframeInlineBootstrap(): string {
  return `(function(){
if(window.__automaioIframeBoot)return;window.__automaioIframeBoot=1;
function readConfigType(){var el=document.querySelector('[data-wf-field="config-type"],#am-config-type,[data-am-cms="config-type"]');var t=el?(el.textContent||'').trim().toLowerCase():'';return t;}
if(readConfigType()==='remote_runtime'||readConfigType()==='split_method')return;
function read(slugs){for(var i=0;i<slugs.length;i++){var s=slugs[i];
var el=document.getElementById('am-'+s)||document.querySelector('[data-am-cms="'+s+'"]')||document.querySelector('[data-wf-field="'+s+'"]');
if(el){var t=(el.textContent||'').trim();if(t&&t.indexOf('{{')===-1&&t.indexOf('http')===0)return t;}}return '';}
var src=read(['iframe-url','iframe_url','embed-url','page-url']);
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
