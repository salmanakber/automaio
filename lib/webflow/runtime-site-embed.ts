import { getAppBaseUrl } from '@/lib/app-url'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { prisma } from '@/lib/prisma'
import { isCustomCodePermissionError, isEmbedRecoverableError } from '@/lib/webflow/embed-permissions'

const RUNTIME_SCRIPT_VERSION = '1.0.0'
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
  return `(function(){var u="${base}",s="${webflowSiteId}";
function mkRoot(){var r=document.getElementById("ai-page-root");if(!r){r=document.createElement("div");r.id="ai-page-root";var m=document.querySelector("main")||document.querySelector("[role=main]")||document.body;if(m.firstChild)m.insertBefore(r,m.firstChild);else m.appendChild(r);}return r;}
function findPageId(){var r=document.getElementById("ai-page-root");if(r){var p=r.getAttribute("data-automaio-page-id")||r.dataset.automaioPageId;if(p&&p.trim()&&!/\\{\\{/.test(p))return p.trim();}
var els=document.querySelectorAll("[data-automaio-page-id],[data-page-id]");
for(var i=0;i<els.length;i++){var v=(els[i].getAttribute("data-automaio-page-id")||els[i].getAttribute("data-page-id")||"").trim();if(v&&!/\\{\\{/.test(v)&&v.length>=20)return v;}
var rx=/^[a-z0-9]{20,32}$/i;
var nodes=document.querySelectorAll("p,span,div,h1,h2,h3,h4,h5,h6,small,pre,code");
for(var j=0;j<nodes.length;j++){var t=(nodes[j].textContent||"").trim();if(t.length>=20&&t.length<=32&&rx.test(t)&&t.indexOf(" ")===-1)return t;}
return null;}
function render(pageId){mkRoot();function go(){window.AutomaioRuntime.render({pageId:pageId,target:"#ai-page-root",apiBase:u});}
if(window.AutomaioRuntime)return go();
var sc=document.createElement("script");sc.src=u+"/webflow/runtime.js";sc.defer=true;sc.onload=go;document.head.appendChild(sc);}
var pid=findPageId();if(pid){render(pid);return;}
var sl=location.pathname.split("/").filter(Boolean).pop();if(!sl)return;
fetch(u+"/api/runtime/resolve?siteId="+encodeURIComponent(s)+"&slug="+encodeURIComponent(sl)).then(function(r){return r.json();}).then(function(d){if(d.pageId)render(d.pageId);}).catch(function(){});})();`
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

/** Register + apply Automaio runtime bootstrap on collection template (no manual embed paste). */
export async function ensureAutomaioRuntimeForIntegration(
  integrationId: string,
  options?: { collectionId?: string; publishSite?: boolean },
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
    await applyCustomCodeScripts(client, integration.webflowSiteId, pageId, scriptEntry)

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
