/**
 * Webflow Collection Template snippets — paste in Designer or applied via Designer Extension.
 * Direct render uses server-side {{wf}} bindings on generated-html / generated-css CMS fields.
 */

import { buildSplitRenderEmbedMarkup } from '@/lib/webflow/publishing/embed-template'
import {
  GENERATED_CSS_SLUG,
  GENERATED_HTML_SLUG,
} from '@/lib/webflow/publishing/types'

export const SPLIT_CMS_FIELD_PATHS = {
  html: GENERATED_HTML_SLUG,
  css: GENERATED_CSS_SLUG,
  /** Legacy aliases still supported in field mapper. */
  legacyHtml: 'htmlContent',
  legacyCss: 'cssContent',
  legacyJs: 'jsContent',
} as const

export const IFRAME_CMS_FIELD_PATH = 'iframe-url'

function wfPlainText(path: string): string {
  return `{{wf {"path":"${path}","type":"PlainText"} }}`
}

/** SEO direct render — Webflow server-side CMS bindings (config-type: split_method). */
export function buildWebflowSplitMethodTemplateEmbed(): string {
  return buildSplitRenderEmbedMarkup()
}

/** Collection template — split HTML/CSS via server-side embed. */
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

/** Registered inline script — legacy DOM fallback when canvas embed is missing. */
export function buildSplitInlineBootstrap(): string {
  return `(function(){
if(window.__automaioSplitBoot)return;window.__automaioSplitBoot=1;
function readConfigType(){var el=document.querySelector('[data-wf-field="config-type"],#am-config-type,[data-am-cms="config-type"]');var t=el?(el.textContent||'').trim().toLowerCase():'';return t;}
if(readConfigType()==='remote_runtime'||readConfigType()==='iframe_embed')return;
if(document.querySelector('[data-automaio-render-embed]'))return;
function read(slugs){for(var i=0;i<slugs.length;i++){var s=slugs[i];
var el=document.getElementById('am-'+s)||document.querySelector('[data-am-cms="'+s+'"]')||document.querySelector('[data-wf-field="'+s+'"]');
if(el){var t=(el.textContent||'').trim();if(t&&t.indexOf('{{')===-1&&t.length>0)return t;}}return '';}
var html=read(['generated-html','generated_html','htmlContent','html-content','html']);
var css=read(['generated-css','generated_css','cssContent','css-content','css']);
if(!html&&!css)return;
var wrapper=document.querySelector('.automaio-render-root')||document.querySelector('.ai-wrapper');
if(!wrapper){wrapper=document.createElement('div');wrapper.className='automaio-render-root';document.body.appendChild(wrapper);}
if(css){var st=wrapper.querySelector('style[data-automaio-css]');if(!st){st=document.createElement('style');st.setAttribute('data-automaio-css','1');wrapper.insertBefore(st,wrapper.firstChild);}st.textContent=css;}
if(html){var host=wrapper.querySelector('[data-automaio-html]');if(!host){host=document.createElement('div');host.setAttribute('data-automaio-html','1');wrapper.appendChild(host);}host.innerHTML=html;}
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
