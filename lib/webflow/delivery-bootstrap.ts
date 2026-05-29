/**
 * Registered inline scripts for split / iframe delivery.
 * Auto-installed on collection template custom code (footer) — no manual Designer paste.
 * Reads CMS fields from DOM or Automaio API; routes by config-type.
 */

function escapeForJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function debugBootstrap(): string {
  return `function amDebug(){
  if(typeof window==="undefined")return;
  var on=/[?&]automaio_debug=1/i.test(location.search||"")||window.localStorage&&window.localStorage.getItem("automaioDebug")==="1";
  if(!on)return function(){};
  return function(tag,data){try{console.log("[Automaio:"+tag+"]",data);}catch(e){}};
}`
}

function readSlugFromPath(): string {
  return `function readSlug(){
  var parts=location.pathname.split("/").filter(Boolean);
  return parts.length?parts[parts.length-1]:"";
}`
}

function readConfigTypeFromDom(): string {
  return `function readConfigType(){
  var el=document.querySelector('[data-wf-field="config-type"],#am-config-type,[data-am-cms="config-type"]');
  var t=el?(el.textContent||"").trim().toLowerCase():"";
  if(t==="split_method"||t==="splitmethod")return"split_method";
  if(t==="iframe_embed"||t==="iframe")return"iframe_embed";
  if(t==="remote_runtime"||t==="runtime")return"remote_runtime";
  return"";
}`
}

function readCmsField(slug: string): string {
  return `function readField(slug){
  var el=document.getElementById("am-"+slug)||document.querySelector('[data-am-cms="'+slug+'"]')||document.querySelector('[data-wf-field="'+slug+'"]');
  if(!el)return"";
  var t=(el.textContent||"").trim();
  if(!t||t.indexOf("{{")!==-1)return"";
  return t;
}`
}

/** Mirrors legacy {{wf}} split template: ai-wrapper > style + html + script */
function injectSplitMethod(): string {
  return `function injectSplitMethod(html,css,js){
  if(!html&&!css&&!js)return false;
  var wrapper=document.querySelector(".ai-wrapper[data-automaio-split]");
  if(!wrapper){
    wrapper=document.createElement("div");
    wrapper.className="ai-wrapper";
    wrapper.setAttribute("data-automaio-split","1");
    var main=document.querySelector("main")||document.querySelector("[role=main]")||document.body;
    main.appendChild(wrapper);
  }
  if(css){
    var st=wrapper.querySelector("style[data-automaio-css]");
    if(!st){st=document.createElement("style");st.setAttribute("data-automaio-css","1");wrapper.insertBefore(st,wrapper.firstChild);}
    st.textContent=css;
  }
  if(html){
    var host=wrapper.querySelector("[data-automaio-html]");
    if(!host){host=document.createElement("div");host.setAttribute("data-automaio-html","1");wrapper.appendChild(host);}
    host.innerHTML=html;
  }
  if(js){
    var sc=document.createElement("script");
    sc.textContent=js;
    wrapper.appendChild(sc);
  }
  return true;
}`
}

function readCmsFromDom(slugs: string[]): string {
  return `function readCms(slugs){
  for(var i=0;i<slugs.length;i++){
    var s=slugs[i];
    var v=readField(s);
    if(v)return v;
  }
  return "";
}`
}

function splitShouldRun(): string {
  return `function splitShouldRun(){
  var cfg=readConfigType();
  if(cfg==="remote_runtime"||cfg==="iframe_embed")return false;
  if(cfg==="split_method")return true;
  return true;
}`
}

export function buildSplitInlineBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)

  return `(function(){
if(window.__automaioSplitBoot)return;window.__automaioSplitBoot=1;
var API="${base}";
var SITE="${site}";
${debugBootstrap()}
var log=amDebug();
${readConfigTypeFromDom()}
${readSlugFromPath()}
${readCmsField('config-type')}
${readCmsFromDom(['htmlContent', 'html-content', 'html_content', 'html', 'cssContent', 'css-content', 'css_content', 'css', 'jsContent', 'js-content', 'js_content', 'js'])}
${injectSplitMethod()}
${splitShouldRun()}
function fromDom(){
  if(!splitShouldRun()){log("split","skipped — config-type="+readConfigType());return false;}
  var html=readCms(["htmlContent","html-content","html_content","html"]);
  var css=readCms(["cssContent","css-content","css_content","css"]);
  var js=readCms(["jsContent","js-content","js_content","js"]);
  log("split-dom",{configType:readConfigType(),templateId:readField("template-id"),pageId:readField("page-id"),htmlLen:(html||"").length,cssLen:(css||"").length,jsLen:(js||"").length});
  if(html||css||js){injectSplitMethod(html,css,js);log("split","injected from DOM");return true;}
  return false;
}
function fromApi(){
  if(!splitShouldRun())return;
  var slug=readSlug();
  if(!slug||!SITE){log("split-api","missing slug or siteId");return;}
  var url=API+"/api/webflow/delivery/split?siteId="+encodeURIComponent(SITE)+"&slug="+encodeURIComponent(slug);
  log("split-api",{url:url,slug:slug});
  fetch(url)
    .then(function(r){return r.json().then(function(d){return {ok:r.ok,status:r.status,d:d};});})
    .then(function(res){
      if(!res.ok){log("split-api","failed",{status:res.status,error:res.d&&res.d.error});console.warn("[Automaio split] API "+res.status+":",(res.d&&res.d.error)||"unknown");return;}
      if(res.d&&(res.d.html||res.d.css||res.d.js)){
        injectSplitMethod(res.d.html||"",res.d.css||"",res.d.js||"");
        log("split","injected from API",{projectId:res.d.projectId});
      }else{log("split-api","empty payload");console.warn("[Automaio split] API returned no html/css/js for slug",slug);}
    })
    .catch(function(err){log("split-api","network error",err);console.warn("[Automaio split] fetch failed",err);});
}
if(!fromDom())fromApi();
window.AutomaioSplitDebug=function(){
  console.group("[Automaio split debug]");
  console.log("booted",!!window.__automaioSplitBoot);
  console.log("config-type",readConfigType());
  console.log("template-id",readField("template-id"));
  console.log("page-id",readField("page-id"));
  console.log("slug",readSlug());
  console.log("htmlContent chars",readCms(["htmlContent","html-content","html_content","html"]).length);
  console.log("cssContent chars",readCms(["cssContent","css-content","css_content","css"]).length);
  console.log("jsContent chars",readCms(["jsContent","js-content","js_content","js"]).length);
  console.log("wrapper",document.querySelector(".ai-wrapper[data-automaio-split]"));
  console.groupEnd();
};
})();`
}

function iframeShouldRun(): string {
  return `function iframeShouldRun(){
  var cfg=readConfigType();
  if(cfg==="remote_runtime"||cfg==="split_method")return false;
  if(cfg==="iframe_embed")return true;
  return true;
}`
}

export function buildIframeInlineBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)

  return `(function(){
if(window.__automaioIframeBoot)return;window.__automaioIframeBoot=1;
var API="${base}";
var SITE="${site}";
${debugBootstrap()}
var log=amDebug();
${readConfigTypeFromDom()}
${readSlugFromPath()}
${readCmsField('config-type')}
${readCmsFromDom(['iframe-url', 'iframe_url', 'embed-url', 'page-url'])}
${iframeShouldRun()}
function mountIframe(src){
  if(!src||src.indexOf("http")!==0)return false;
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
  log("iframe","mounted",src);
  return true;
}
function fromDom(){
  if(!iframeShouldRun())return false;
  var src=readCms(["iframe-url","iframe_url","embed-url","page-url"]);
  if(src){mountIframe(src);return true;}
  return false;
}
function fromApi(){
  if(!iframeShouldRun())return;
  var slug=readSlug();
  if(!slug||!SITE)return;
  fetch(API+"/api/webflow/delivery/iframe?siteId="+encodeURIComponent(SITE)+"&slug="+encodeURIComponent(slug))
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){if(d&&d.url)mountIframe(d.url);})
    .catch(function(err){console.warn("[Automaio iframe] fetch failed",err);});
}
if(!fromDom())fromApi();
})();`
}
