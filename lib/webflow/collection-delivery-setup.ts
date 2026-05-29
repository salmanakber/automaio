import { getAppBaseUrl } from '@/lib/app-url'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { prisma } from '@/lib/prisma'
import { isWebflowNotFoundError } from '@/lib/integrations/webflow-client'
import { isCustomCodePermissionError, isEmbedRecoverableError } from '@/lib/webflow/embed-permissions'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { CollectionField } from '@/lib/webflow/field-mapper'
import {
  DELIVERY_FIELD_DEFINITIONS,
  UNIFIED_LANDING_CMS_FIELDS,
  type DeliveryMode,
  collectionHasDeliveryFields,
  syncCollectionFieldsCache,
} from '@/lib/webflow/cms-collection-schema'
import { buildIframeInlineBootstrap } from '@/lib/webflow/delivery-bootstrap'
import {
  buildWebflowIframeCollectionEmbed,
  buildWebflowSplitMethodTemplateEmbed,
} from '@/lib/webflow/template-embeds'
import { buildWebflowRuntimeCollectionEmbed } from '@/lib/webflow/runtime-embed'
import {
  buildTemplateShellHeadBootstrap,
  TEMPLATE_SHELL_SCRIPT_NAME,
  TEMPLATE_SHELL_VERSION,
  buildCollectionTemplateBodySnippet,
  buildSeoCollectionTemplateCanvas,
} from '@/lib/webflow/collection-template-shell'
import {
  buildUnifiedDeliveryBootstrap,
  UNIFIED_DELIVERY_SCRIPT_NAME,
  UNIFIED_DELIVERY_VERSION,
} from '@/lib/webflow/unified-delivery-bootstrap'

const IFRAME_SCRIPT_NAME = 'Automaio Iframe Embed Renderer'

const SCRIPT_VERSION = '1.3.0'

type CollectionsJson = {
  collections?: Array<{ id: string; fields?: Array<{ slug: string; name: string; type: string }> }>
  automaioRuntime?: { scriptId?: string; scriptVersion?: string }
  automaioDelivery?: {
    mode?: DeliveryMode
    scriptId?: string
    scriptVersion?: string
    splitScriptId?: string
    iframeScriptId?: string
    shellScriptId?: string
    unifiedScriptId?: string
    configuredAt?: string
  }
}

function readCollectionsJson(raw: unknown): CollectionsJson {
  if (!raw || typeof raw !== 'object') return {}
  return raw as CollectionsJson
}

function isAutomaioDeliveryScript(script: { id: string; displayName?: string }) {
  const name = (script.displayName ?? '').toLowerCase()
  return (
    name.includes('automaio runtime') ||
    name.includes('automaio split') ||
    name.includes('automaio iframe') ||
    name.includes('automaio content embed') ||
    name.includes('automaio template shell') ||
    name.includes('automaio page delivery')
  )
}

async function listAutomaioScriptIds(client: WebflowClient, siteId: string): Promise<string[]> {
  const registered = await client.listRegisteredScripts(siteId)
  return registered.filter(isAutomaioDeliveryScript).map((s) => s.id)
}

/** True when the collection template page already has the active delivery script attached. */
export async function collectionTemplateHasDeliveryScript(
  client: WebflowClient,
  siteId: string,
  collectionId: string,
  mode: DeliveryMode,
  collectionsJson: CollectionsJson,
): Promise<boolean> {
  const templatePage = await client.findCollectionTemplatePage(siteId, collectionId)
  if (!templatePage?.id) return false

  try {
    const current = await client.getPageCustomCode(templatePage.id)
    const onPage = new Set((current.scripts ?? []).map((s) => s.id))

    if (mode === 'remote_runtime') {
      const runtimeId = collectionsJson.automaioRuntime?.scriptId
      if (runtimeId && onPage.has(runtimeId)) return true
      const delivery = collectionsJson.automaioDelivery
      return delivery?.mode === 'remote_runtime' && Boolean(delivery.scriptId && onPage.has(delivery.scriptId))
    }

    const unifiedId = collectionsJson.automaioDelivery?.unifiedScriptId
    if (unifiedId && onPage.has(unifiedId)) return true

    if (mode === 'split_plain_text') {
      const splitId = collectionsJson.automaioDelivery?.splitScriptId
      return Boolean(splitId && onPage.has(splitId))
    }

    const iframeId = collectionsJson.automaioDelivery?.iframeScriptId ?? collectionsJson.automaioDelivery?.scriptId
    return Boolean(
      collectionsJson.automaioDelivery?.mode === mode && iframeId && onPage.has(iframeId),
    )
  } catch {
    return false
  }
}

/** Merge a registered script onto the collection template footer without removing other Automaio scripts. */
async function appendScriptToTemplatePage(
  client: WebflowClient,
  siteId: string,
  pageId: string,
  entry: { id: string; version: string },
) {
  const registered = await client.listRegisteredScripts(siteId)
  const registeredIds = new Set(registered.map((s) => s.id))
  if (!registeredIds.has(entry.id)) return

  const scriptEntry = { id: entry.id, location: 'footer' as const, version: entry.version }

  try {
    const current = await client.getPageCustomCode(pageId)
    const scripts = (current.scripts ?? []).filter(
      (s) => registeredIds.has(s.id) && s.id !== entry.id,
    )
    scripts.push(scriptEntry)
    await client.upsertPageCustomCode(pageId, scripts)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isEmbedRecoverableError(message)) {
      try {
        await client.upsertPageCustomCode(pageId, [scriptEntry])
      } catch {
        // Template page may be missing or inaccessible — non-fatal.
      }
      return
    }
    throw err
  }
}

/** Attach script to collection template header (runs before body render). */
async function appendScriptToTemplatePageHeader(
  client: WebflowClient,
  siteId: string,
  pageId: string,
  entry: { id: string; version: string },
) {
  const registered = await client.listRegisteredScripts(siteId)
  const registeredIds = new Set(registered.map((s) => s.id))
  if (!registeredIds.has(entry.id)) return

  const scriptEntry = { id: entry.id, location: 'header' as const, version: entry.version }

  try {
    const current = await client.getPageCustomCode(pageId)
    const scripts = (current.scripts ?? []).filter(
      (s) => registeredIds.has(s.id) && s.id !== entry.id,
    )
    scripts.push(scriptEntry)
    await client.upsertPageCustomCode(pageId, scripts)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isEmbedRecoverableError(message)) {
      try {
        await client.upsertPageCustomCode(pageId, [scriptEntry])
      } catch {
        // Non-fatal
      }
    }
  }
}

function isAutomaioShellScript(script: { displayName?: string }) {
  return (script.displayName ?? '').toLowerCase().includes('automaio template shell')
}

async function registerDeliveryScript(
  client: WebflowClient,
  siteId: string,
  displayName: string,
  sourceCode: string,
  version = SCRIPT_VERSION,
  options?: { forceRefresh?: boolean },
): Promise<{ scriptId: string; version: string }> {
  const registered = await client.listRegisteredScripts(siteId)
  const existing = registered.find(
    (s) => (s.displayName ?? '').toLowerCase() === displayName.toLowerCase(),
  )

  let scriptVersion = version
  if (displayName === TEMPLATE_SHELL_SCRIPT_NAME) scriptVersion = TEMPLATE_SHELL_VERSION
  if (displayName === UNIFIED_DELIVERY_SCRIPT_NAME) scriptVersion = UNIFIED_DELIVERY_VERSION

  if (existing && !options?.forceRefresh) {
    return { scriptId: existing.id, version: existing.version ?? scriptVersion }
  }

  if (existing && options?.forceRefresh) {
    const used = new Set(
      registered.filter((s) => (s.displayName ?? '').toLowerCase() === displayName.toLowerCase()).map((s) => s.version),
    )
    const parts = scriptVersion.split('.').map((n) => Number(n) || 0)
    let patch = parts[2] ?? 0
    while (used.has(scriptVersion)) {
      patch += 1
      scriptVersion = `${parts[0]}.${parts[1]}.${patch}`
    }
  }

  const created = await client.registerInlineScript(siteId, {
    sourceCode,
    displayName,
    version: scriptVersion,
    canCopy: false,
  })
  return { scriptId: created.id, version: scriptVersion }
}

/** Write Automaio template scripts in one request, preserving non-Automaio page scripts. */
async function syncTemplatePageCustomCode(
  client: WebflowClient,
  siteId: string,
  pageId: string,
  entries: Array<{ id: string; version: string; location: 'header' | 'footer' }>,
) {
  const registered = await client.listRegisteredScripts(siteId)
  const registeredIds = new Set(registered.map((s) => s.id))
  const automaioIds = new Set(registered.filter(isAutomaioDeliveryScript).map((s) => s.id))
  const ourScripts = entries
    .filter((e) => registeredIds.has(e.id))
    .map((e) => ({ id: e.id, location: e.location, version: e.version }))

  if (!ourScripts.length) return

  let preserved: Array<{ id: string; location: string; version: string }> = []
  try {
    const current = await client.getPageCustomCode(pageId)
    preserved = (current.scripts ?? []).filter(
      (s) => registeredIds.has(s.id) && !automaioIds.has(s.id),
    )
  } catch {
    // Page may have no custom code yet.
  }

  try {
    await client.upsertPageCustomCode(pageId, [...preserved, ...ourScripts])
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!isEmbedRecoverableError(message)) throw err
  }
}

/** Create all optional delivery CMS fields (unified schema) on connect / install. */
export async function ensureDeliveryCmsFields(
  client: WebflowClient,
  collectionId: string,
  mode?: DeliveryMode,
): Promise<CollectionField[]> {
  const collection = await client.getCollection(collectionId)
  const existingSlugs = new Set(collection.fields.map((f) => f.slug))
  const defs = mode ? DELIVERY_FIELD_DEFINITIONS[mode] : UNIFIED_LANDING_CMS_FIELDS
  const allDefs = UNIFIED_LANDING_CMS_FIELDS
  const toCreate = new Map<string, (typeof allDefs)[number]>()

  for (const def of allDefs) {
    if (def.slug) toCreate.set(def.slug, def)
  }
  for (const def of defs) {
    if (def.slug) toCreate.set(def.slug, def)
  }

  for (const def of toCreate.values()) {
    const expectedSlug = def.slug
    if (expectedSlug && existingSlugs.has(expectedSlug)) continue
    try {
      const created = await client.createCollectionField(collectionId, {
        type: def.type,
        displayName: def.displayName,
        isRequired: def.isRequired,
      })
      if (created?.slug) existingSlugs.add(created.slug)
      else if (expectedSlug) existingSlugs.add(expectedSlug)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.toLowerCase().includes('already') && !message.includes('409')) {
        console.warn(`[ensureDeliveryCmsFields] Could not create field ${expectedSlug ?? def.displayName}:`, message)
      }
    }
  }

  const refreshed = await client.getCollection(collectionId)
  const fields = refreshed.fields.map((f) => ({
    slug: f.slug,
    name: f.displayName,
    type: f.type,
  }))

  return fields
}

/** Ensure CMS fields exist for a delivery mode before publish (creates missing fields in Webflow). */
export async function ensureCollectionFieldsForMode(
  integrationId: string,
  collectionId: string,
  mode: DeliveryMode,
): Promise<CollectionField[]> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) throw new Error('Integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  let fields = await ensureDeliveryCmsFields(client, collectionId, mode)

  if (!collectionHasDeliveryFields(fields, mode)) {
    fields = await ensureDeliveryCmsFields(client, collectionId, mode)
  }

  await syncCollectionFieldsCache(integrationId, collectionId, fields)
  return fields
}

export type EnsureDeliverySetupResult = {
  success: boolean
  mode: DeliveryMode
  fields: CollectionField[]
  collectionTemplateSnippet: string
  collectionTemplateBodySnippet?: string
  needsDesignerShell?: boolean
  needsReconnect?: boolean
  error?: string
  templateAutoConfigured?: boolean
}

/**
 * Auto-install all delivery scripts on the collection template custom code (footer).
 * Called on OAuth connect, collection create, and publish — zero manual Designer steps.
 */
export async function ensureAutomaioTemplateDeliverySetup(
  integrationId: string,
  options?: {
    collectionId?: string
    publishSite?: boolean
    force?: boolean
  },
): Promise<EnsureDeliverySetupResult> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) throw new Error('Integration not found')

  const collectionId = options?.collectionId ?? integration.templatesCollectionId ?? undefined
  if (!collectionId) {
    return {
      success: false,
      mode: 'remote_runtime',
      fields: [],
      collectionTemplateSnippet: buildWebflowRuntimeCollectionEmbed(getAppBaseUrl()),
      error: 'No pages collection configured yet.',
    }
  }

  return ensureCollectionDeliverySetup(integrationId, {
    collectionId,
    mode: 'remote_runtime',
    publishSite: options?.publishSite,
    force: options?.force ?? true,
    installAllScripts: true,
  })
}

type EnsureCollectionDeliveryOptions = {
  collectionId: string
  mode: PublishHtmlMode
  publishSite?: boolean
  force?: boolean
  /** When true, install runtime + split + iframe scripts on template (default on install). */
  installAllScripts?: boolean
}

/**
 * Ensure CMS fields + auto-install delivery scripts on collection template custom code.
 */
export async function ensureCollectionDeliverySetup(
  integrationId: string,
  options: EnsureCollectionDeliveryOptions,
): Promise<EnsureDeliverySetupResult> {
  const mode = options.mode as DeliveryMode
  const installAll = options.installAllScripts ?? true
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) throw new Error('Integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  const appUrl = getAppBaseUrl()
  const collectionsJson = readCollectionsJson(integration.collections)

  let fields = await ensureDeliveryCmsFields(client, options.collectionId, mode)
  if (!collectionHasDeliveryFields(fields, mode)) {
    fields = await ensureDeliveryCmsFields(client, options.collectionId, mode)
  }

  const snippet =
    mode === 'remote_runtime'
      ? buildWebflowRuntimeCollectionEmbed(appUrl)
      : mode === 'split_plain_text'
        ? buildWebflowSplitMethodTemplateEmbed()
        : buildWebflowIframeCollectionEmbed()

  const templatePage = await client.findCollectionTemplatePage(
    integration.webflowSiteId,
    options.collectionId,
  )

  const shouldReconfigure = options.force ?? false

  try {
    let splitScriptId = collectionsJson.automaioDelivery?.splitScriptId
    let iframeScriptId = collectionsJson.automaioDelivery?.iframeScriptId
    let shellScriptId = collectionsJson.automaioDelivery?.shellScriptId
    let unifiedScriptId = collectionsJson.automaioDelivery?.unifiedScriptId

    const needsIframeScript = installAll || mode === 'iframe_embed'
    const templateScripts: Array<{ id: string; version: string; location: 'header' | 'footer' }> =
      []

    if (templatePage?.id) {
      try {
        const shell = await registerDeliveryScript(
          client,
          integration.webflowSiteId,
          TEMPLATE_SHELL_SCRIPT_NAME,
          buildTemplateShellHeadBootstrap(),
          TEMPLATE_SHELL_VERSION,
          { forceRefresh: shouldReconfigure },
        )
        shellScriptId = shell.scriptId
        templateScripts.push({ id: shell.scriptId, version: shell.version, location: 'header' })

        if (mode === 'remote_runtime' || installAll) {
          const unified = await registerDeliveryScript(
            client,
            integration.webflowSiteId,
            UNIFIED_DELIVERY_SCRIPT_NAME,
            buildUnifiedDeliveryBootstrap(appUrl, integration.webflowSiteId),
            UNIFIED_DELIVERY_VERSION,
            { forceRefresh: shouldReconfigure },
          )
          unifiedScriptId = unified.scriptId
          templateScripts.push({ id: unified.scriptId, version: unified.version, location: 'footer' })
        }
      } catch (shellErr) {
        const message = shellErr instanceof Error ? shellErr.message : String(shellErr)
        if (!isEmbedRecoverableError(message) && !isWebflowNotFoundError(shellErr)) throw shellErr
      }

      if (needsIframeScript) {
        try {
          const iframe = await registerDeliveryScript(
            client,
            integration.webflowSiteId,
            IFRAME_SCRIPT_NAME,
            buildIframeInlineBootstrap(appUrl, integration.webflowSiteId),
            SCRIPT_VERSION,
            { forceRefresh: shouldReconfigure },
          )
          iframeScriptId = iframe.scriptId
          templateScripts.push({ id: iframe.scriptId, version: iframe.version, location: 'footer' })
        } catch (iframeErr) {
          const message = iframeErr instanceof Error ? iframeErr.message : String(iframeErr)
          if (!isEmbedRecoverableError(message) && !isWebflowNotFoundError(iframeErr)) {
            throw iframeErr
          }
        }
      }

      if (templateScripts.length) {
        await syncTemplatePageCustomCode(
          client,
          integration.webflowSiteId,
          templatePage.id,
          templateScripts,
        )
      }
    }

    await prisma.webflowIntegration.update({
      where: { id: integrationId },
      data: {
        collections: {
          ...collectionsJson,
          automaioDelivery: {
            mode: installAll ? 'remote_runtime' : mode,
            scriptId: unifiedScriptId ?? collectionsJson.automaioDelivery?.scriptId,
            scriptVersion: UNIFIED_DELIVERY_VERSION,
            splitScriptId,
            iframeScriptId,
            shellScriptId,
            unifiedScriptId,
            configuredAt: new Date().toISOString(),
          },
        },
      } as object,
    })

    await syncCollectionFieldsCache(integrationId, options.collectionId, fields)

    if (options.publishSite) {
      await client.publishSite(integration.webflowSiteId)
    }

    const templateAutoConfigured = Boolean(
      templatePage?.id && (unifiedScriptId || iframeScriptId || shellScriptId),
    )

    const missingTemplatePage = !templatePage?.id
    const blankTemplateWarning = templatePage?.id
      ? mode === 'split_plain_text'
        ? 'Split delivery needs the SEO template shell on the canvas ({{wf}} bindings). Open Automaio Designer → Install template shell, then publish the site in Webflow.'
        : 'Webflow collection templates must have at least one element on the canvas or CMS item URLs may 404. Open the Automaio Designer panel → Install template shell, or add a Div/Embed with the shell snippet, then publish the site.'
      : undefined
    const templatePageWarning = missingTemplatePage
      ? 'No Collection Template page found in Webflow for this collection. Open Webflow Designer → Pages → CMS Collection pages, open the template for this collection, then publish the site so item URLs work.'
      : blankTemplateWarning

    return {
      success: true,
      mode,
      fields,
      collectionTemplateSnippet: snippet,
      collectionTemplateBodySnippet:
        mode === 'split_plain_text'
          ? buildSeoCollectionTemplateCanvas()
          : buildCollectionTemplateBodySnippet(),
      needsDesignerShell: Boolean(templatePage?.id),
      templateAutoConfigured,
      error: templatePageWarning,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      isCustomCodePermissionError(message) ||
      isEmbedRecoverableError(message) ||
      isWebflowNotFoundError(err)
    ) {
      return {
        success: false,
        mode,
        fields,
        collectionTemplateSnippet: snippet,
        needsReconnect: true,
        error: isWebflowNotFoundError(err)
          ? 'Webflow could not find the collection template page or site. Sync Webflow in Settings, confirm the CMS collection still exists, then publish again.'
          : message,
      }
    }
    throw err
  }
}

export function getCollectionTemplateSnippet(mode: PublishHtmlMode, appUrl?: string): string {
  if (mode === 'remote_runtime') return buildWebflowRuntimeCollectionEmbed(appUrl)
  if (mode === 'split_plain_text') return buildWebflowSplitMethodTemplateEmbed()
  if (mode === 'iframe_embed') return buildWebflowIframeCollectionEmbed()
  return buildWebflowSplitMethodTemplateEmbed()
}
