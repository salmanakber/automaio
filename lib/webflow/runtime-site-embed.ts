import { getAppBaseUrl } from '@/lib/app-url'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { prisma } from '@/lib/prisma'
import { isCustomCodePermissionError, isEmbedRecoverableError } from '@/lib/webflow/embed-permissions'

const RUNTIME_SCRIPT_VERSION = '1.0.3'
const RUNTIME_SCRIPT_DISPLAY_NAME = 'Automaio Runtime Bootstrap'

export type AutomaioRuntimeMeta = {
  scriptId: string
  scriptVersion: string
  apiUrl?: string
  pageId?: string
  collectionId?: string
  configuredAt: string
  mode: 'page' | 'site'
}

type CollectionsJson = {
  collections?: unknown[]
  automaioRuntime?: AutomaioRuntimeMeta
  automaioEmbed?: unknown
}

/** Inline bootstrap — auto-mounts #ai-page-root and loads runtime.js without manual embed paste. */
export function buildRuntimeInlineBootstrap(webflowSiteId: string, apiUrl: string): string {
  const base = apiUrl.replace(/\/$/, '')
  const runtimeVersion = RUNTIME_SCRIPT_VERSION
  return `(function(){if(window.__automaioBootstrap)return;window.__automaioBootstrap=1;var u="${base}",s="${webflowSiteId}",v="${runtimeVersion}";
function injectLoaderStyles(){if(document.getElementById("automaio-loader-css"))return;var st=document.createElement("style");st.id="automaio-loader-css";st.textContent="@keyframes automaio-spin{to{transform:rotate(360deg)}}.automaio-loader{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:2.5rem 1.5rem;font-family:system-ui,sans-serif;color:#64748b}.automaio-loader-ring{width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:automaio-spin .7s linear infinite}.automaio-loader-text{font-size:13px;margin:0}";document.head.appendChild(st);}
function showLoader(r){injectLoaderStyles();r.innerHTML='<div class="automaio-loader" data-automaio-loading="true"><div class="automaio-loader-ring"></div><p class="automaio-loader-text">Loading page from Automaio…</p></div>';}
function ensureRoot(){var r=document.getElementById("ai-page-root");if(!r){r=document.createElement("div");r.id="ai-page-root";r.setAttribute("data-automaio-root","true");var m=document.querySelector("main")||document.querySelector("[role=main]")||document.body;m.insertBefore(r,m.firstChild);}return r;}
function showStatus(msg,isErr){var r=ensureRoot();r.innerHTML='<p style="font-family:system-ui;padding:1rem 1.25rem;color:'+(isErr?"#b45309":"#64748b")+';font-size:13px;margin:0;line-height:1.5">'+msg+'</p>';}
function parsePageIdFromJson(text){if(!text||text.indexOf("pageId")===-1)return null;try{var j=JSON.parse(text.trim());if(j.pageId&&String(j.pageId).trim())return String(j.pageId).trim();}catch(e){var m=text.match(/"pageId"\\s*:\\s*"([^"]+)"/);if(m)return m[1];}return null;}
function isValidPageId(v){return v&&v.length>=10&&v.length<=40&&/^[a-z0-9_-]+$/i.test(v)&&v.indexOf(" ")===-1&&!/\\{\\{/.test(v);}
function findPageId(){var r=document.getElementById("ai-page-root");if(r){var p=r.getAttribute("data-automaio-page-id")||r.dataset.automaioPageId;if(isValidPageId(p))return p.trim();}
var els=document.querySelectorAll("[data-automaio-page-id],[data-page-id],[data-automaio-config]");
for(var i=0;i<els.length;i++){var v=(els[i].getAttribute("data-automaio-page-id")||els[i].getAttribute("data-page-id")||"").trim();if(isValidPageId(v))return v;var cfg=els[i].getAttribute("data-automaio-config");if(cfg){var pid=parsePageIdFromJson(cfg);if(isValidPageId(pid))return pid;}}
var nodes=document.querySelectorAll("script[type='application/json'],pre,code,p,span,div,h1,h2,h3,h4,h5,h6,small");
for(var j=0;j<nodes.length;j++){var t=(nodes[j].textContent||"").trim();if(!t)continue;if(t.indexOf("pageId")>-1){var pid2=parsePageIdFromJson(t);if(isValidPageId(pid2))return pid2;}
if(isValidPageId(t)&&t.length>=20)return t;}
return null;}
function isLegacySplitPage(){if(document.querySelector("[data-automaio-page-id],[data-automaio-config],#ai-page-root[data-automaio-page-id]"))return false;return!!document.querySelector(".ai-wrapper,.ai-landing-wrapper,.ai-template-scope");}
function readConfigType(){var el=document.querySelector('[data-wf-field="config-type"],#am-config-type,[data-am-cms="config-type"]');var t=el?(el.textContent||"").trim().toLowerCase():"";if(t==="split_method"||t==="splitmethod")return"split_method";if(t==="iframe_embed"||t==="iframe")return"iframe_embed";if(t==="remote_runtime"||t==="runtime")return"remote_runtime";return"";}
function shouldSkipRuntime(){var cfg=readConfigType();if(cfg==="split_method"||cfg==="iframe_embed")return true;return isLegacySplitPage();}
function hasRuntimeMarkers(){if(document.getElementById("ai-page-root"))return true;if(document.querySelector("[data-automaio-page-id],[data-automaio-config],[data-page-id]"))return true;
var nodes=document.querySelectorAll("script[type='application/json'],pre,code,p,span,div,small");for(var k=0;k<nodes.length;k++){var tx=(nodes[k].textContent||"").trim();if(tx.indexOf("pageId")>-1&&parsePageIdFromJson(tx))return true;}return false;}
function render(pageId){var root=ensureRoot();root.setAttribute("data-automaio-page-id",pageId);showLoader(root);function go(){window.AutomaioRuntime.render({pageId:pageId,target:"#ai-page-root",apiBase:u,hideShell:true});}
if(window.AutomaioRuntime)return go();
var sc=document.createElement("script");sc.src=u+"/webflow/runtime.js?v="+v;sc.onload=go;sc.onerror=function(){showStatus("Automaio: failed to load runtime.js from "+u,true);};document.head.appendChild(sc);}
if(shouldSkipRuntime())return;
var pid=findPageId();if(pid){render(pid);return;}
if(!hasRuntimeMarkers())return;
var root=ensureRoot();showLoader(root);
var sl=location.pathname.split("/").filter(Boolean).pop();
if(!sl){showStatus("Automaio: Page ID not found. Bind <strong>Page ID</strong> or <strong>Runtime Config</strong> on your collection template, or add the #ai-page-root embed.",true);return;}
fetch(u+"/api/runtime/resolve?siteId="+encodeURIComponent(s)+"&slug="+encodeURIComponent(sl)).then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});}).then(function(res){if(res.d&&res.d.pageId){render(res.d.pageId);return;}showStatus("Automaio: no page for slug \\""+sl+"\\". Publish from Automaio and ensure CMS slug matches.",true);}).catch(function(){showStatus("Automaio: could not resolve page. Bind Page ID / Runtime Config on your collection template.",true);});})();`
}

function readCollectionsJson(raw: unknown): CollectionsJson {
  if (!raw || typeof raw !== 'object') return {}
  return raw as CollectionsJson
}

function isDuplicateRegisteredScriptError(message: string) {
  return message.includes('duplicate_registered_script') || message.includes('Duplicate registered script')
}

function isAutomaioRuntimeScript(script: { id: string; displayName?: string }) {
  const id = script.id.toLowerCase()
  const name = (script.displayName ?? '').toLowerCase()
  return (
    id.includes('automaio-runtime') ||
    name.includes('automaio runtime bootstrap') ||
    name === RUNTIME_SCRIPT_DISPLAY_NAME.toLowerCase()
  )
}

function nextScriptVersion(existingVersions: string[], preferred = RUNTIME_SCRIPT_VERSION): string {
  if (!existingVersions.includes(preferred)) return preferred
  const [major = 1, minor = 0, patch = 0] = preferred.split('.').map((n) => Number(n) || 0)
  for (let p = patch + 1; p < 100; p++) {
    const candidate = `${major}.${minor}.${p}`
    if (!existingVersions.includes(candidate)) return candidate
  }
  return `${major}.${minor + 1}.0`
}

async function resolveRuntimeScript(
  client: WebflowClient,
  siteId: string,
  sourceCode: string,
  apiUrl: string,
  stored?: AutomaioRuntimeMeta,
): Promise<{ scriptId: string; version: string }> {
  const registered = await client.listRegisteredScripts(siteId)
  const runtimeScripts = registered.filter(isAutomaioRuntimeScript)
  const existingVersions = runtimeScripts.map((s) => s.version).filter(Boolean) as string[]

  if (stored?.scriptId && stored.apiUrl === apiUrl) {
    const stillThere = runtimeScripts.find(
      (s) => s.id === stored.scriptId && s.version === stored.scriptVersion,
    )
    if (stillThere) {
      return { scriptId: stored.scriptId, version: stored.scriptVersion }
    }
  }

  const version = nextScriptVersion(existingVersions, RUNTIME_SCRIPT_VERSION)

  try {
    const created = await client.registerInlineScript(siteId, {
      sourceCode,
      displayName: RUNTIME_SCRIPT_DISPLAY_NAME,
      version,
      canCopy: false,
    })
    return { scriptId: created.id, version }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!isDuplicateRegisteredScriptError(message)) throw err

    const fallback =
      runtimeScripts.find((s) => s.version === version) ??
      runtimeScripts.find((s) => s.version === RUNTIME_SCRIPT_VERSION) ??
      runtimeScripts[0]

    if (fallback) {
      return { scriptId: fallback.id, version: fallback.version ?? RUNTIME_SCRIPT_VERSION }
    }

    throw err
  }
}

export type EnsureAutomaioRuntimeResult =
  | { success: true; automaioRuntime: AutomaioRuntimeMeta; publishedSite?: boolean }
  | { success: false; needsReconnect: true; error: string; recoverable?: boolean }

async function applyCustomCodeScripts(
  client: WebflowClient,
  siteId: string,
  pageId: string | undefined,
  scriptEntry: { id: string; location: string; version: string },
) {
  const registered = await client.listRegisteredScripts(siteId)
  const registeredIds = new Set(registered.map((s) => s.id))

  const sanitize = (scripts: Array<{ id: string; location: string; version: string }>) =>
    scripts.filter((s) => registeredIds.has(s.id) && s.id !== scriptEntry.id)

  const upsert = async (scripts: Array<{ id: string; location: string; version: string }>) => {
    if (pageId) {
      await client.upsertPageCustomCode(pageId, scripts)
    } else {
      await client.upsertSiteCustomCode(siteId, scripts)
    }
  }

  try {
    const current = pageId
      ? await client.getPageCustomCode(pageId)
      : await client.getSiteCustomCode(siteId)
    const scripts = [...sanitize(current.scripts ?? []), scriptEntry]
    await upsert(scripts)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isEmbedRecoverableError(message)) {
      await upsert([scriptEntry])
      return
    }
    throw err
  }
}

async function removeSiteLevelRuntimeScript(
  client: WebflowClient,
  siteId: string,
  scriptId: string,
) {
  try {
    const current = await client.getSiteCustomCode(siteId)
    const scripts = (current.scripts ?? []).filter((s) => s.id !== scriptId)
    await client.upsertSiteCustomCode(siteId, scripts)
  } catch {
    // Site custom code may be empty or inaccessible — safe to ignore.
  }
}

async function removePageLevelRuntimeScript(
  client: WebflowClient,
  pageId: string,
  scriptId: string,
) {
  try {
    const current = await client.getPageCustomCode(pageId)
    const scripts = (current.scripts ?? []).filter((s) => s.id !== scriptId)
    await client.upsertPageCustomCode(pageId, scripts)
  } catch {
    // Page custom code may be empty or inaccessible — safe to ignore.
  }
}

/** Remove runtime bootstrap from site + collection template (legacy modes must not run runtime.js). */
export async function clearAutomaioSiteLevelRuntime(
  integrationId: string,
  collectionId?: string,
): Promise<void> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) return

  const collectionsJson = readCollectionsJson(integration.collections)
  const scriptId = collectionsJson.automaioRuntime?.scriptId
  if (!scriptId) return

  try {
    const client = new WebflowClient(integration.webflowApiKey)
    await removeSiteLevelRuntimeScript(client, integration.webflowSiteId, scriptId)

    const cid = collectionId ?? integration.templatesCollectionId ?? undefined
    if (cid) {
      const templatePage = await client.findCollectionTemplatePage(
        integration.webflowSiteId,
        cid,
      )
      if (templatePage?.id) {
        await removePageLevelRuntimeScript(client, templatePage.id, scriptId)
      }
    }
  } catch {
    // Non-fatal — bootstrap v1.0.3 also no-ops on non-runtime pages.
  }
}
export async function ensureAutomaioRuntimeForIntegration(
  integrationId: string,
  options?: { collectionId?: string; publishSite?: boolean; skipIfConfigured?: boolean },
): Promise<EnsureAutomaioRuntimeResult> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) throw new Error('Integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  const appUrl = getAppBaseUrl()
  const collectionsJson = readCollectionsJson(integration.collections)
  const existing = collectionsJson.automaioRuntime
  const collectionId = options?.collectionId ?? integration.templatesCollectionId ?? undefined

  try {
    if (
      options?.skipIfConfigured &&
      existing?.scriptId &&
      existing.apiUrl === appUrl &&
      existing.scriptVersion === RUNTIME_SCRIPT_VERSION
    ) {
      const registered = await client.listRegisteredScripts(integration.webflowSiteId)
      const stillConfigured = registered.some(
        (s) => s.id === existing.scriptId && s.version === existing.scriptVersion,
      )
      if (stillConfigured) {
        return { success: true, automaioRuntime: existing }
      }
    }

    const sourceCode = buildRuntimeInlineBootstrap(integration.webflowSiteId, appUrl)
    const { scriptId, version: scriptVersion } = await resolveRuntimeScript(
      client,
      integration.webflowSiteId,
      sourceCode,
      appUrl,
      existing,
    )

    let pageId: string | undefined
    let mode: 'page' | 'site' = 'site'

    if (collectionId) {
      const templatePage = await client.findCollectionTemplatePage(
        integration.webflowSiteId,
        collectionId,
      )
      if (templatePage?.id) {
        pageId = templatePage.id
        mode = 'page'
      }
    }

    const scriptEntry = { id: scriptId, location: 'footer' as const, version: scriptVersion }
    // Collection template only — never site-wide (breaks legacy Rich Text / split HTML pages).
    if (pageId) {
      await applyCustomCodeScripts(client, integration.webflowSiteId, pageId, scriptEntry)
      await removeSiteLevelRuntimeScript(client, integration.webflowSiteId, scriptId)
    }

    const automaioRuntime: AutomaioRuntimeMeta = {
      scriptId,
      scriptVersion,
      apiUrl: appUrl,
      pageId,
      collectionId,
      configuredAt: new Date().toISOString(),
      mode,
    }

    await prisma.webflowIntegration.update({
      where: { id: integrationId },
      data: {
        collections: {
          ...collectionsJson,
          automaioRuntime,
        } as object,
      },
    })

    let publishedSite = false
    if (options?.publishSite) {
      await client.publishSite(integration.webflowSiteId)
      publishedSite = true
    }

    return { success: true, automaioRuntime, publishedSite }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isEmbedRecoverableError(message) || isCustomCodePermissionError(message)) {
      return {
        success: false,
        needsReconnect: true,
        recoverable: true,
        error:
          'Reconnect Webflow in Settings to enable automatic runtime setup (custom_code permission required).',
      }
    }
    throw err
  }
}
