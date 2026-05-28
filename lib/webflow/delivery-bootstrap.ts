/**
 * Registered inline scripts for split / iframe delivery.
 * Reads CMS-bound DOM when present; falls back to Automaio API by site + slug.
 */

function escapeForJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function readSlugFromPath(): string {
  return `function readSlug(){
  var parts=location.pathname.split("/").filter(Boolean);
  return parts.length?parts[parts.length-1]:"";
}`
}

function injectSplitContent(): string {
  return `function injectSplit(html,css,js){
  if(!html&&!css&&!js)return;
  var root=document.getElementById("page-root")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"page-root"}));
  var styleEl=document.getElementById("page-style")||(function(){var s=document.createElement("style");s.id="page-style";document.head.appendChild(s);return s;})();
  if(html)root.innerHTML=html;
  if(css)styleEl.textContent=css;
  if(js){var t=document.createElement("script");t.textContent=js;root.appendChild(t);}
}`
}

function readCmsFromDom(slugs: string[]): string {
  const slugJson = JSON.stringify(slugs)
  return `function readCms(slugs){
  for(var i=0;i<slugs.length;i++){
    var s=slugs[i];
    var el=document.getElementById("am-"+s)||document.querySelector('[data-am-cms="'+s+'"]')||document.querySelector('[data-wf-field="'+s+'"]');
    if(el){var t=(el.textContent||"").trim();if(t&&t.indexOf("{{")===-1&&t.length>0)return t;}
  }
  return "";
}`
}

export function buildSplitInlineBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)

  return `(function(){
if(window.__automaioSplitBoot)return;window.__automaioSplitBoot=1;
var API="${base}";
var SITE="${site}";
${readSlugFromPath()}
${readCmsFromDom(['html', 'html-content', 'html_content', 'css', 'css-content', 'css_content', 'js', 'js-content', 'js_content'])}
${injectSplitContent()}
function fromDom(){
  var html=readCms(["html","html-content","html_content"]);
  var css=readCms(["css","css-content","css_content"]);
  var js=readCms(["js","js-content","js_content"]);
  if(html||css||js){injectSplit(html,css,js);return true;}
  return false;
}
function fromApi(){
  var slug=readSlug();
  if(!slug||!SITE)return;
  fetch(API+"/api/webflow/delivery/split?siteId="+encodeURIComponent(SITE)+"&slug="+encodeURIComponent(slug))
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){if(d&&(d.html||d.css||d.js))injectSplit(d.html||"",d.css||"",d.js||"");})
    .catch(function(){});
}
if(!fromDom())fromApi();
})();`
}

export function buildIframeInlineBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)

  return `(function(){
if(window.__automaioIframeBoot)return;window.__automaioIframeBoot=1;
var API="${base}";
var SITE="${site}";
${readSlugFromPath()}
${readCmsFromDom(['iframe-url', 'iframe_url', 'embed-url', 'page-url'])}
function mountIframe(src){
  if(!src||src.indexOf("http")!==0)return;
  var host=document.getElementById("automaio-iframe-host")||document.body.appendChild(Object.assign(document.createElement("div"),{id:"automaio-iframe-host"}));
  host.replaceChildren();
  var f=document.createElement("iframe");
  f.src=src;f.title="Page";f.loading="lazy";
  f.setAttribute("sandbox","allow-scripts allow-same-origin allow-popups allow-forms");
  f.referrerPolicy="strict-origin-when-cross-origin";
  f.style.cssText="width:100%;border:0;display:block;min-height:min(80vh,900px)";
  host.appendChild(f);
  window.addEventListener("message",function(e){
    if(e.data&&e.data.type==="automaio-embed-resize"&&e.data.height>0){
      f.style.height=Math.max(320,e.data.height)+"px";
    }
  });
}
function fromDom(){
  var src=readCms(["iframe-url","iframe_url","embed-url","page-url"]);
  if(src){mountIframe(src);return true;}
  return false;
}
function fromApi(){
  var slug=readSlug();
  if(!slug||!SITE)return;
  fetch(API+"/api/webflow/delivery/iframe?siteId="+encodeURIComponent(SITE)+"&slug="+encodeURIComponent(slug))
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){if(d&&d.url)mountIframe(d.url);})
    .catch(function(){});
}
if(!fromDom())fromApi();
})();`
}
