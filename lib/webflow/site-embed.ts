import { getAppBaseUrl } from '@/lib/app-url'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { prisma } from '@/lib/prisma'
import { isCustomCodePermissionError, isEmbedRecoverableError } from '@/lib/webflow/embed-permissions'

const SCRIPT_VERSION = '1.1.0'
const SCRIPT_DISPLAY_NAME = 'Automaio Content Embed'

export type AutomaioEmbedMeta = {
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
  automaioEmbed?: AutomaioEmbedMeta
}

export function buildAutomaioInlineBootstrap(webflowSiteId: string, apiUrl: string) {
  const base = apiUrl.replace(/\/$/, '')
  // The script:
  // 1. Looks for #automaio-root div (manual embed) or creates one
  // 2. Checks data-automaio-project-id on the root or looks for it in page content
  // 3. Falls back to slug-based lookup
  // 4. Creates an iframe pointing to /webflow/embed/project/{id} or /webflow/embed/view
  return `(function(){var u="${base}",s="${webflowSiteId}";function mk(src,title){var r=document.getElementById("automaio-root");if(!r){r=document.createElement("div");r.id="automaio-root";var m=document.querySelector("main")||document.body;m.appendChild(r);}r.innerHTML="";var f=document.createElement("iframe");f.src=src;f.title=title||"Automaio";f.loading="lazy";f.style.cssText="width:100%;border:0;display:block;min-height:320px;background:transparent";f.setAttribute("allow","fullscreen");r.appendChild(f);window.addEventListener("message",function(e){if(e.data&&e.data.type==="automaio-embed-resize"&&e.data.height>0)f.style.height=e.data.height+"px";});}var r=document.getElementById("automaio-root");var pid=r&&r.dataset.automaioProjectId;if(pid){mk(u+"/webflow/embed/project/"+encodeURIComponent(pid));return;}var sl=location.pathname.split("/").filter(Boolean).pop();if(sl){mk(u+"/webflow/embed/view?siteId="+encodeURIComponent(s)+"&slug="+encodeURIComponent(sl));}})();`
}

function readCollectionsJson(raw: unknown): CollectionsJson {
  if (!raw || typeof raw !== 'object') return {}
  return raw as CollectionsJson
}

function isDuplicateRegisteredScriptError(message: string) {
  return message.includes('duplicate_registered_script') || message.includes('Duplicate registered script')
}

function isAutomaioScript(script: { id: string; displayName?: string }) {
  const id = script.id.toLowerCase()
  const name = (script.displayName ?? '').toLowerCase()
  return (
    id.includes('automaio') ||
    name.includes('automaio content embed') ||
    name === SCRIPT_DISPLAY_NAME.toLowerCase()
  )
}

function nextScriptVersion(existingVersions: string[], preferred = SCRIPT_VERSION): string {
  if (!existingVersions.includes(preferred)) return preferred

  const [major = 1, minor = 0, patch = 0] = preferred.split('.').map((n) => Number(n) || 0)
  for (let p = patch + 1; p < 100; p++) {
    const candidate = `${major}.${minor}.${p}`
    if (!existingVersions.includes(candidate)) return candidate
  }
  return `${major}.${minor + 1}.0`
}

async function resolveAutomaioScript(
  client: WebflowClient,
  siteId: string,
  sourceCode: string,
  apiUrl: string,
  stored?: AutomaioEmbedMeta,
): Promise<{ scriptId: string; version: string }> {
  const registered = await client.listRegisteredScripts(siteId)
  const automaioScripts = registered.filter(isAutomaioScript)
  const existingVersions = automaioScripts.map((s) => s.version).filter(Boolean) as string[]

  // Reuse when same API URL and we already have a matching registration
  if (stored?.scriptId && stored.apiUrl === apiUrl) {
    const stillThere = automaioScripts.find(
      (s) => s.id === stored.scriptId && s.version === stored.scriptVersion,
    )
    if (stillThere) {
      return { scriptId: stored.scriptId, version: stored.scriptVersion }
    }
  }

  if (stored?.apiUrl === apiUrl || !stored?.apiUrl) {
    const sameVersion = automaioScripts.find((s) => s.version === SCRIPT_VERSION)
    if (sameVersion) {
      return { scriptId: sameVersion.id, version: sameVersion.version ?? SCRIPT_VERSION }
    }
  }

  const version =
    stored?.apiUrl && stored.apiUrl !== apiUrl
      ? nextScriptVersion(existingVersions)
      : nextScriptVersion(existingVersions, SCRIPT_VERSION)

  try {
    const created = await client.registerInlineScript(siteId, {
      sourceCode,
      displayName: SCRIPT_DISPLAY_NAME,
      version,
      canCopy: false,
    })
    return { scriptId: created.id, version }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!isDuplicateRegisteredScriptError(message)) throw err

    const fallback =
      automaioScripts.find((s) => s.version === version) ??
      automaioScripts.find((s) => s.version === SCRIPT_VERSION) ??
      automaioScripts[0]

    if (fallback) {
      return { scriptId: fallback.id, version: fallback.version ?? SCRIPT_VERSION }
    }

    // Race: registered between list and POST — refresh list once
    const refreshed = (await client.listRegisteredScripts(siteId)).filter(isAutomaioScript)
    const latest = refreshed.find((s) => s.version === version) ?? refreshed[0]
    if (latest) {
      return { scriptId: latest.id, version: latest.version ?? SCRIPT_VERSION }
    }

    throw err
  }
}

export type EnsureAutomaioEmbedResult =
  | { success: true; automaioEmbed: AutomaioEmbedMeta; publishedSite?: boolean }
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
    // Stale script refs on page — apply only our script
    if (isEmbedRecoverableError(message)) {
      await upsert([scriptEntry])
      return
    }
    throw err
  }
}

/** Register + apply Automaio embed script on the Webflow collection template (or site). */
export async function ensureAutomaioEmbedForIntegration(
  integrationId: string,
  options?: { collectionId?: string; publishSite?: boolean },
): Promise<EnsureAutomaioEmbedResult> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) throw new Error('Integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  const appUrl = getAppBaseUrl()
  const collectionsJson = readCollectionsJson(integration.collections)
  const existing = collectionsJson.automaioEmbed
  const collectionId = options?.collectionId

  try {
    const sourceCode = buildAutomaioInlineBootstrap(integration.webflowSiteId, appUrl)
    const { scriptId, version: scriptVersion } = await resolveAutomaioScript(
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

    const automaioEmbed: AutomaioEmbedMeta = {
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
          automaioEmbed,
        } as object,
      },
    })

    let publishedSite = false
    if (options?.publishSite) {
      await client.publishSite(integration.webflowSiteId)
      publishedSite = true
    }

    return { success: true, automaioEmbed, publishedSite }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isEmbedRecoverableError(message)) {
      return {
        success: false,
        needsReconnect: true,
        recoverable: true,
        error:
          message.includes('404') || message.includes('Custom code block not found')
            ? 'Could not apply iframe embed to this Webflow template — HTML will be saved to Rich Text instead.'
            : 'Reconnect Webflow in Settings to enable automatic embed (custom_code permission required).',
      }
    }
    throw err
  }
}
