/** Footer bootstrap for remote runtime only — split HTML is server-rendered via {{wf}} on canvas. */

function escapeForJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export const UNIFIED_DELIVERY_SCRIPT_NAME = 'Automaio Page Delivery'
export const UNIFIED_DELIVERY_VERSION = '2.1.0'

export function buildUnifiedDeliveryBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)
  const runtimeVersion = '1.0.4'

  return `(function(){
if(window.__automaioUnifiedBoot)return;window.__automaioUnifiedBoot=1;
var API="${base}";
var SITE="${site}";
var RV="${runtimeVersion}";

function readSlug(){
  var parts=location.pathname.split("/").filter(Boolean);
  return parts.length?parts[parts.length-1]:"";
}

function readField(slug){
  var el=document.getElementById("am-"+slug)||document.querySelector('[data-am-cms="'+slug+'"]')||document.querySelector('[data-wf-field="'+slug+'"]');
  if(!el)return"";
  var t=(el.textContent||"").trim();
  if(!t||t.indexOf("{{")!==-1)return"";
  return t;
}

function readConfigType(){
  var t=(readField("config-type")||readField("config_type")||"").toLowerCase();
  if(t==="split_method"||t==="splitmethod"||t==="split")return"split";
  if(t==="iframe_embed"||t==="iframe")return"iframe";
  if(t==="remote_runtime"||t==="runtime")return"runtime";
  return"";
}

function ensureRuntimeRoot(){
  if(!document.body)return null;
  var root=document.getElementById("ai-page-root");
  if(!root){
    root=document.createElement("div");
    root.id="ai-page-root";
    root.setAttribute("data-automaio-root","true");
    root.style.cssText="min-height:1px;width:100%";
    document.body.appendChild(root);
  }
  return root;
}

function loadRuntime(pageId){
  var root=ensureRuntimeRoot();
  if(!root)return;
  root.setAttribute("data-automaio-page-id",pageId);
  function go(){
    if(!window.AutomaioRuntime)return;
    window.AutomaioRuntime.render({pageId:pageId,target:"#ai-page-root",apiBase:API,hideShell:true});
  }
  if(window.AutomaioRuntime)return go();
  var sc=document.createElement("script");
  sc.src=API+"/webflow/runtime.js?v="+RV;
  sc.onload=go;
  sc.onerror=function(){console.warn("[Automaio] runtime.js failed to load from",API);};
  document.head.appendChild(sc);
}

function tryRuntime(slug){
  var pageId=readField("page-id")||readField("page_id");
  if(pageId&&pageId.length>=10){loadRuntime(pageId);return Promise.resolve(true);}
  return fetch(API+"/api/runtime/resolve?siteId="+encodeURIComponent(SITE)+"&slug="+encodeURIComponent(slug))
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.pageId){loadRuntime(d.pageId);console.info("[Automaio] loaded runtime for",slug);return true;}
      if(d&&d.error)console.warn("[Automaio] runtime resolve:",d.error);
      return false;
    })
    .catch(function(err){console.warn("[Automaio] runtime resolve failed",err);return false;});
}

function boot(){
  var mode=readConfigType();
  if(mode==="split"){
    console.info("[Automaio] split_method — HTML/CSS rendered server-side; JS bootstrap skipped for SEO");
    return;
  }
  if(mode==="iframe")return;
  var slug=readSlug();
  if(!slug){console.warn("[Automaio] no slug in URL");return;}
  tryRuntime(slug);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
else boot();

window.AutomaioDebug=function(){
  console.group("[Automaio unified debug]");
  console.log("API",API,"SITE",SITE,"slug",readSlug(),"config-type",readConfigType());
  console.log("ai-page-root",document.getElementById("ai-page-root"));
  console.log("split seo wrapper",document.querySelector(".ai-wrapper"));
  console.log("page-id field",readField("page-id"));
  console.groupEnd();
};
})();`
}
