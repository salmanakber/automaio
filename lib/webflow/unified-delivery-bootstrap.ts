/** Footer bootstrap for remote runtime only — split HTML is server-rendered via {{wf}} on canvas. */

function escapeForJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export const UNIFIED_DELIVERY_SCRIPT_NAME = 'Automaio Page Delivery'
export const UNIFIED_DELIVERY_VERSION = '2.1.0'

export function buildUnifiedDeliveryBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)
  const runtimeVersion = '1.0.5'

  return `(function(){
if(window.__automaioUnifiedBoot)return;window.__automaioUnifiedBoot=1;
var API="${base}";
var SITE="${site}";
var RV="${runtimeVersion}";

function injectLoaderStyles(){if(document.getElementById("automaio-loader-css"))return;var st=document.createElement("style");st.id="automaio-loader-css";st.textContent="@keyframes automaio-spin{to{transform:rotate(360deg)}}#automaio-page-loader{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#fff}#automaio-page-loader .automaio-loader-ring{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:automaio-spin .7s linear infinite}";(document.head||document.documentElement).appendChild(st);}
function showPageLoader(){injectLoaderStyles();if(document.getElementById("automaio-page-loader"))return;var o=document.createElement("div");o.id="automaio-page-loader";o.innerHTML='<div class="automaio-loader-ring" role="status" aria-label="Loading"></div>';(document.body||document.documentElement).appendChild(o);}
function hidePageLoader(){var o=document.getElementById("automaio-page-loader");if(o)o.remove();}
injectLoaderStyles();showPageLoader();

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
  showPageLoader();
  function go(){
    if(!window.AutomaioRuntime)return;
    window.AutomaioRuntime.render({pageId:pageId,target:"#ai-page-root",apiBase:API,hideShell:true});
  }
  if(window.AutomaioRuntime)return go();
  var sc=document.createElement("script");
  sc.src=API+"/webflow/runtime.js?v="+RV;
  sc.onload=go;
  sc.onerror=function(){hidePageLoader();console.warn("[Automaio] runtime.js failed to load");};
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
    hidePageLoader();
    console.info("[Automaio] split_method — HTML/CSS rendered server-side; JS bootstrap skipped for SEO");
    return;
  }
  if(mode==="iframe"){hidePageLoader();return;}
  var slug=readSlug();
  if(!slug){hidePageLoader();console.warn("[Automaio] no slug in URL");return;}
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
