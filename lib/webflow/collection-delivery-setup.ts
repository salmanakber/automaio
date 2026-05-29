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
import { buildIframeInlineBootstrap, buildSplitInlineBootstrap } from '@/lib/webflow/delivery-bootstrap'
import {
  buildWebflowIframeCollectionEmbed,
  buildWebflowSplitMethodTemplateEmbed,
} from '@/lib/webflow/template-embeds'
import { buildWebflowRuntimeCollectionEmbed } from '@/lib/webflow/runtime-embed'
import { ensureAutomaioRuntimeForIntegration } from '@/lib/webflow/runtime-site-embed'

const SPLIT_SCRIPT_NAME = 'Automaio Split HTML Renderer'
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
    name.includes('automaio content embed')
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

async function registerDeliveryScript(
  client: WebflowClient,
  siteId: string,
  displayName: string,
  sourceCode: string,
): Promise<{ scriptId: string; version: string }> {
  const registered = await client.listRegisteredScripts(siteId)
  const existing = registered.find(
    (s) => (s.displayName ?? '').toLowerCase() === displayName.toLowerCase(),
  )
  if (existing) {
    return { scriptId: existing.id, version: existing.version ?? SCRIPT_VERSION }
  }

  const created = await client.registerInlineScript(siteId, {
    sourceCode,
    displayName,
    version: SCRIPT_VERSION,
    canCopy: false,
  })
  return { scriptId: created.id, version: SCRIPT_VERSION }
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
    const runtimeResult = await ensureAutomaioRuntimeForIntegration(integrationId, {
      collectionId: options.collectionId,
      publishSite: false,
      skipIfConfigured: !shouldReconfigure,
    })

    if (!runtimeResult.success && !installAll && mode === 'remote_runtime') {
      return {
        success: false,
        mode,
        fields,
        collectionTemplateSnippet: snippet,
        needsReconnect: runtimeResult.needsReconnect,
        error: runtimeResult.error,
      }
    }

    let splitScriptId = collectionsJson.automaioDelivery?.splitScriptId
    let iframeScriptId = collectionsJson.automaioDelivery?.iframeScriptId

    const needsSplitScript = installAll || mode === 'split_plain_text'
    const needsIframeScript = installAll || mode === 'iframe_embed'

    if (templatePage?.id && (needsSplitScript || needsIframeScript)) {
      if (needsSplitScript) {
        try {
          const split = await registerDeliveryScript(
            client,
            integration.webflowSiteId,
            SPLIT_SCRIPT_NAME,
            buildSplitInlineBootstrap(appUrl, integration.webflowSiteId),
          )
          splitScriptId = split.scriptId
          await appendScriptToTemplatePage(
            client,
            integration.webflowSiteId,
            templatePage.id,
            { id: split.scriptId, version: split.version },
          )
        } catch (splitErr) {
          const message = splitErr instanceof Error ? splitErr.message : String(splitErr)
          if (!isEmbedRecoverableError(message) && !isWebflowNotFoundError(splitErr)) throw splitErr
        }
      }

      if (needsIframeScript) {
        try {
          const iframe = await registerDeliveryScript(
            client,
            integration.webflowSiteId,
            IFRAME_SCRIPT_NAME,
            buildIframeInlineBootstrap(appUrl, integration.webflowSiteId),
          )
          iframeScriptId = iframe.scriptId
          await appendScriptToTemplatePage(
            client,
            integration.webflowSiteId,
            templatePage.id,
            { id: iframe.scriptId, version: iframe.version },
          )
        } catch (iframeErr) {
          const message = iframeErr instanceof Error ? iframeErr.message : String(iframeErr)
          if (!isEmbedRecoverableError(message) && !isWebflowNotFoundError(iframeErr)) {
            throw iframeErr
          }
        }
      }
    }

    const runtimeMeta = runtimeResult.success ? runtimeResult.automaioRuntime : undefined

    await prisma.webflowIntegration.update({
      where: { id: integrationId },
      data: {
        collections: {
          ...collectionsJson,
          automaioDelivery: {
            mode: installAll ? 'remote_runtime' : mode,
            scriptId: runtimeMeta?.scriptId ?? collectionsJson.automaioDelivery?.scriptId,
            scriptVersion:
              runtimeMeta?.scriptVersion ?? collectionsJson.automaioDelivery?.scriptVersion,
            splitScriptId,
            iframeScriptId,
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
      templatePage?.id &&
        (runtimeResult.success || splitScriptId || iframeScriptId),
    )

    const missingTemplatePage = !templatePage?.id
    const templatePageWarning = missingTemplatePage
      ? 'No Collection Template page found in Webflow for this collection. Open Webflow Designer → Pages → CMS Collection pages, open the template for this collection, then publish the site so item URLs work.'
      : undefined

    return {
      success: true,
      mode,
      fields,
      collectionTemplateSnippet: snippet,
      templateAutoConfigured,
      needsReconnect: runtimeResult.success ? undefined : runtimeResult.needsReconnect,
      error:
        templatePageWarning ??
        (runtimeResult.success ? undefined : runtimeResult.error),
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
