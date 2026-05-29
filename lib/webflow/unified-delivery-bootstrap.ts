/** Single footer bootstrap: mount nodes + split API + runtime fallback. */

function escapeForJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export const UNIFIED_DELIVERY_SCRIPT_NAME = 'Automaio Page Delivery'
export const UNIFIED_DELIVERY_VERSION = '2.0.1'

export function buildUnifiedDeliveryBootstrap(appUrl: string, webflowSiteId: string): string {
  const base = escapeForJsString(appUrl.replace(/\/$/, ''))
  const site = escapeForJsString(webflowSiteId)
  const runtimeVersion = '1.0.4'

  return `(function(){
if(window.__automaioUnifiedBoot)return;window.__automaioUnifiedBoot=1;
var API="${base}";
var SITE="${site}";
var RV="${runtimeVersion}";

function ensureMounts(){
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

function injectSplit(html,css,js){
  ensureMounts();
  var wrapper=document.querySelector(".ai-wrapper[data-automaio-split]")||document.body;
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
}

function loadRuntime(pageId){
  ensureMounts();
  var root=document.getElementById("ai-page-root");
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

function tryDomSplit(){
  var html=readField("htmlContent")||readField("html-content")||readField("html");
  var css=readField("cssContent")||readField("css-content")||readField("css");
  var js=readField("jsContent")||readField("js-content")||readField("js");
  if(html||css||js){injectSplit(html,css,js);return true;}
  return false;
}

function trySplitApi(slug){
  return fetch(API+"/api/webflow/delivery/split?siteId="+encodeURIComponent(SITE)+"&slug="+encodeURIComponent(slug))
    .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
    .then(function(res){
      if(res.ok&&res.d&&(res.d.html||res.d.css||res.d.js)){
        injectSplit(res.d.html||"",res.d.css||"",res.d.js||"");
        console.info("[Automaio] loaded split content for",slug);
        return true;
      }
      if(!res.ok&&res.d&&res.d.error)console.warn("[Automaio] split API:",res.d.error);
      return false;
    })
    .catch(function(err){console.warn("[Automaio] split API failed",err);return false;});
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
  ensureMounts();
  var slug=readSlug();
  if(!slug){console.warn("[Automaio] no slug in URL");return;}
  var mode=readConfigType();
  if(mode==="runtime"){tryRuntime(slug);return;}
  if(mode==="split"){if(tryDomSplit())return;trySplitApi(slug);return;}
  if(tryDomSplit())return;
  trySplitApi(slug).then(function(ok){
    if(!ok)tryRuntime(slug);
  });
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
else boot();

window.AutomaioDebug=function(){
  console.group("[Automaio unified debug]");
  console.log("API",API,"SITE",SITE,"slug",readSlug(),"config-type",readConfigType());
  console.log("ai-page-root",document.getElementById("ai-page-root"));
  console.log("split wrapper",document.querySelector(".ai-wrapper[data-automaio-split]"));
  console.log("page-id field",readField("page-id"));
  console.log("htmlContent chars",(readField("htmlContent")||readField("html")).length);
  console.groupEnd();
};
})();`
}
