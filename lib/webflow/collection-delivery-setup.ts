import { getAppBaseUrl } from '@/lib/app-url'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { prisma } from '@/lib/prisma'
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
import { ensureAutomaioRuntimeForIntegration } from '@/lib/webflow/runtime-site-embed'

const IFRAME_SCRIPT_NAME = 'Automaio Iframe Embed Renderer'

const SCRIPT_VERSION = '1.1.0'

type CollectionsJson = {
  collections?: Array<{ id: string; fields?: Array<{ slug: string; name: string; type: string }> }>
  automaioRuntime?: { scriptId?: string; scriptVersion?: string }
  automaioDelivery?: {
    mode?: DeliveryMode
    scriptId?: string
    scriptVersion?: string
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

    const delivery = collectionsJson.automaioDelivery
    return Boolean(
      delivery?.mode === mode && delivery.scriptId && onPage.has(delivery.scriptId),
    )
  } catch {
    return false
  }
}

async function removeScriptsFromTemplatePage(
  client: WebflowClient,
  siteId: string,
  pageId: string,
  scriptIdsToRemove: Set<string>,
) {
  try {
    const current = await client.getPageCustomCode(pageId)
    const scripts = (current.scripts ?? []).filter((s) => !scriptIdsToRemove.has(s.id))
    await client.upsertPageCustomCode(pageId, scripts)
  } catch {
    // Template page may have no custom code yet
  }
}

async function applyScriptToTemplatePage(
  client: WebflowClient,
  siteId: string,
  pageId: string,
  entry: { id: string; version: string },
  stripIds: Set<string>,
) {
  try {
    const current = await client.getPageCustomCode(pageId)
    const scripts = (current.scripts ?? []).filter((s) => !stripIds.has(s.id))
    scripts.push({ id: entry.id, location: 'footer', version: entry.version })
    await client.upsertPageCustomCode(pageId, scripts)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isEmbedRecoverableError(message)) {
      await client.upsertPageCustomCode(pageId, [
        { id: entry.id, location: 'footer', version: entry.version },
      ])
      return
    }
    throw err
  }

  await removeScriptsFromSite(client, siteId, stripIds)
}

async function removeScriptsFromSite(
  client: WebflowClient,
  siteId: string,
  scriptIds: Set<string>,
) {
  try {
    const current = await client.getSiteCustomCode(siteId)
    const scripts = (current.scripts ?? []).filter((s) => !scriptIds.has(s.id))
    await client.upsertSiteCustomCode(siteId, scripts)
  } catch {
    // ignore
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
 * Switch collection template delivery: clear conflicting runners, ensure fields, apply mode script.
 */
export async function ensureCollectionDeliverySetup(
  integrationId: string,
  options: {
    collectionId: string
    mode: PublishHtmlMode
    publishSite?: boolean
    force?: boolean
  },
): Promise<EnsureDeliverySetupResult> {
  const mode = options.mode as DeliveryMode
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) throw new Error('Integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  const appUrl = getAppBaseUrl()
  const collectionsJson = readCollectionsJson(integration.collections)
  const previousMode = collectionsJson.automaioDelivery?.mode

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

  const modeChanged = Boolean(previousMode && previousMode !== mode)
  const hasTemplateScript = await collectionTemplateHasDeliveryScript(
    client,
    integration.webflowSiteId,
    options.collectionId,
    mode,
    collectionsJson,
  )
  const shouldReconfigure =
    options.force || modeChanged || !hasTemplateScript || collectionsJson.automaioDelivery?.mode !== mode

  if (mode === 'remote_runtime') {
    try {
      if (shouldReconfigure) {
        const templatePage = await client.findCollectionTemplatePage(
          integration.webflowSiteId,
          options.collectionId,
        )
        if (templatePage?.id) {
          const automaioIds = new Set(
            await listAutomaioScriptIds(client, integration.webflowSiteId),
          )
          if (automaioIds.size > 0) {
            await removeScriptsFromTemplatePage(
              client,
              integration.webflowSiteId,
              templatePage.id,
              automaioIds,
            )
          }
        }
      }

      const runtimeResult = await ensureAutomaioRuntimeForIntegration(integrationId, {
        collectionId: options.collectionId,
        publishSite: options.publishSite ?? false,
        skipIfConfigured: !shouldReconfigure,
      })

      if (!runtimeResult.success) {
        return {
          success: false,
          mode,
          fields,
          collectionTemplateSnippet: snippet,
          needsReconnect: runtimeResult.needsReconnect,
          error: runtimeResult.error,
        }
      }

      await prisma.webflowIntegration.update({
        where: { id: integrationId },
        data: {
          collections: {
            ...collectionsJson,
            automaioDelivery: {
              mode,
              scriptId: runtimeResult.automaioRuntime?.scriptId,
              scriptVersion: runtimeResult.automaioRuntime?.scriptVersion,
              configuredAt: new Date().toISOString(),
            },
          } as object,
        },
      })

      await syncCollectionFieldsCache(integrationId, options.collectionId, fields)

      return {
        success: true,
        mode,
        fields,
        collectionTemplateSnippet: snippet,
        templateAutoConfigured: true,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (isCustomCodePermissionError(message) || isEmbedRecoverableError(message)) {
        return {
          success: false,
          mode,
          fields,
          collectionTemplateSnippet: snippet,
          needsReconnect: true,
          error: message,
        }
      }
      throw err
    }
  }

  // Split or iframe — runtime bootstrap stays optional (config-type gated); mode-specific runner when needed
  try {
    await ensureAutomaioRuntimeForIntegration(integrationId, {
      collectionId: options.collectionId,
      publishSite: options.publishSite ?? false,
      skipIfConfigured: !shouldReconfigure,
    })
  } catch {
    // non-fatal — runtime is optional per config-type
  }

  const templatePage = await client.findCollectionTemplatePage(
    integration.webflowSiteId,
    options.collectionId,
  )

  const automaioIds = new Set(await listAutomaioScriptIds(client, integration.webflowSiteId))

  if (mode === 'split_plain_text') {
    await prisma.webflowIntegration.update({
      where: { id: integrationId },
      data: {
        collections: {
          ...collectionsJson,
          automaioDelivery: {
            mode,
            configuredAt: new Date().toISOString(),
          },
        },
      } as object,
    })

    await syncCollectionFieldsCache(integrationId, options.collectionId, fields)

    return {
      success: true,
      mode,
      fields,
      collectionTemplateSnippet: snippet,
      templateAutoConfigured: false,
    }
  }

  const scriptName = IFRAME_SCRIPT_NAME
  const sourceCode = buildIframeInlineBootstrap(appUrl, integration.webflowSiteId)

  try {
    const { scriptId, version } = await registerDeliveryScript(
      client,
      integration.webflowSiteId,
      scriptName,
      sourceCode,
    )

    if (templatePage?.id && shouldReconfigure) {
      await applyScriptToTemplatePage(
        client,
        integration.webflowSiteId,
        templatePage.id,
        { id: scriptId, version },
        automaioIds,
      )
    }

    await prisma.webflowIntegration.update({
      where: { id: integrationId },
      data: {
        collections: {
          ...collectionsJson,
          automaioDelivery: {
            mode,
            scriptId,
            scriptVersion: version,
            configuredAt: new Date().toISOString(),
          },
        },
      } as object,
    })

    await syncCollectionFieldsCache(integrationId, options.collectionId, fields)

    if (options.publishSite) {
      await client.publishSite(integration.webflowSiteId)
    }

    return {
      success: true,
      mode,
      fields,
      collectionTemplateSnippet: snippet,
      templateAutoConfigured: Boolean(templatePage?.id && shouldReconfigure),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isCustomCodePermissionError(message) || isEmbedRecoverableError(message)) {
      return {
        success: false,
        mode,
        fields,
        collectionTemplateSnippet: snippet,
        needsReconnect: true,
        error: message,
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
