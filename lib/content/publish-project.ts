import { prisma } from '@/lib/prisma'
import { WebflowClient, isWebflowNotFoundError } from '@/lib/integrations/webflow-client'
import {
  buildWebflowFieldData,
  buildWebflowFieldPlan,
  formatWebflowValidationError,
  previewFieldMapping,
  sanitizeFieldDataForCollection,
  type AutomaioContentPayload,
} from '@/lib/webflow/field-mapper'
import {
  htmlToPlainSummary,
  renderProjectHtml,
} from '@/lib/content/render-project-html'
import {
  buildCollectionEmbedSnippet,
  buildProjectEmbedSnippet,
} from '@/lib/webflow/embed-setup'
import { buildWebflowLiveUrl, buildWebflowLiveUrlForItem } from '@/lib/webflow/live-url'
import { ensureWebflowCmsItemIsLive } from '@/lib/webflow/ensure-cms-live'
import { getAppBaseUrl } from '@/lib/app-url'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import {
  normalizePublishHtmlMode,
  resolveHtmlModeWithOverride,
  type PublishHtmlModeOverride,
} from '@/lib/content/rendering-strategy'
import { getHtmlLineThreshold } from '@/lib/platform/rendering-settings'
import { buildProjectIframeUrl } from '@/lib/webflow/embed-page'
import { applyLayoutControlsToHtml, parseLayoutControls } from '@/lib/webflow/layout-controls'
import { assembleLandingPageForWebflow } from '@/lib/webflow/landing-page-assembler'
import {
  collectionSupportsRemoteRuntime,
  collectionSupportsSplitPlainText,
  collectionSupportsIframeEmbed,
} from '@/lib/webflow/cms-collection-schema'
import {
  ensureCollectionDeliverySetup,
  ensureCollectionFieldsForMode,
  getCollectionTemplateSnippet,
} from '@/lib/webflow/collection-delivery-setup'
import type { DeliveryMode } from '@/lib/webflow/cms-collection-schema'
import { DEFAULT_PUBLISH_DELIVERY_MODE } from '@/lib/webflow/marketplace-policy'
import { buildLandingPageSchema } from '@/lib/runtime/build-page-schema'
import { applyHtmlModeFieldCleanup, preserveClearsAfterSanitize } from '@/lib/webflow/html-mode-field-cleanup'
import { buildCmsPublishPlan } from '@/lib/webflow/publishing/cms-publish-service'
import {
  publishWebflowSiteWithRetry,
  isWebflowRateLimitError,
  isWebflowSitePublishError,
} from '@/lib/webflow/publish-site'
import {
  formatLivePageReadinessWarnings,
  verifyWebflowLivePageReadiness,
} from '@/lib/webflow/live-page-readiness'
import { getRenderEmbedSyncState } from '@/lib/webflow/publishing/embed-sync-state'
import { buildDesignerSetupMessage } from '@/lib/webflow/designer-open-guide'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export type PublishProjectOptions = {
  publishSite?: boolean
  /** Fresh HTML from the visual editor — saved before publish when provided. */
  renderedHtmlOverride?: string
  /** Webflow CMS item slug override (editable in publish dialog). */
  slug?: string
  /** Delivery mode selected in publish dialog. */
  publishHtmlMode?: PublishHtmlMode
}

function parsePublishHtmlMode(raw: unknown): PublishHtmlModeOverride {
  const normalized = normalizePublishHtmlMode(raw)
  return normalized === 'auto' ? DEFAULT_PUBLISH_DELIVERY_MODE : normalized
}

async function prepareProjectHtml(
  project: NonNullable<Awaited<ReturnType<typeof prisma.contentProject.findUnique>>> & {
    template?: { templateStructure: unknown } | null
  },
  overrides?: { slug?: string },
): Promise<{ payload: AutomaioContentPayload; htmlForStrategy: string }> {
  const payload = await buildProjectPayload(project, overrides)
  const params = (project.parameters as Record<string, unknown>) ?? {}
  const layoutControls = parseLayoutControls(params)

  let htmlForStrategy = payload.templateHtml ?? payload.bodyHtml ?? ''
  if (project.contentType !== 'blog_post' && htmlForStrategy.trim()) {
    htmlForStrategy = applyLayoutControlsToHtml(htmlForStrategy, layoutControls)
    payload.templateHtml = htmlForStrategy
  }

  return { payload, htmlForStrategy }
}

export async function getProjectPublishPreview(projectId: string) {
  const project = await prisma.contentProject.findUnique({
    where: { id: projectId },
    include: { template: true },
  })
  if (!project) throw new Error('Project not found')
  if (!project.cmsCollectionId) throw new Error('Select a CMS collection first')

  const integration = project.webflowIntegrationId
    ? await prisma.webflowIntegration.findUnique({ where: { id: project.webflowIntegrationId } })
    : null

  const { payload, htmlForStrategy } = await prepareProjectHtml(project)
  let collectionFields = await getCollectionFields(
    integration,
    project.cmsCollectionId,
  )

  const params = (project.parameters as Record<string, unknown>) ?? {}
  const publishHtmlMode = parsePublishHtmlMode(params.publishHtmlMode)
  const threshold = await getHtmlLineThreshold()
  const hasRuntimeFields = collectionSupportsRemoteRuntime(collectionFields)
  const hasSplitFields = collectionSupportsSplitPlainText(collectionFields)
  const hasIframeFields = collectionSupportsIframeEmbed(collectionFields)

  let htmlMode: PublishHtmlMode = 'remote_runtime'
  if (integration && htmlForStrategy.trim() && project.contentType !== 'blog_post') {
    const access = await checkCustomCodeAccess(integration.webflowApiKey, integration.webflowSiteId)
    const strategy = resolveHtmlModeWithOverride(
      htmlForStrategy,
      access.ok,
      publishHtmlMode,
      threshold,
      {
        hasRemoteRuntimeFields: hasRuntimeFields,
        hasSplitPlainTextFields: hasSplitFields,
        hasIframeEmbedFields: hasIframeFields,
      },
    )
    htmlMode = strategy.htmlMode

    const ensured = await ensureCollectionFieldsForMode(
      integration.id,
      project.cmsCollectionId,
      htmlMode as DeliveryMode,
    )
    collectionFields = ensured.map((f) => ({
      slug: f.slug,
      name: f.name ?? f.slug,
      type: f.type,
    }))
  }

  let pageSchema
  if (htmlForStrategy.trim() && project.contentType !== 'blog_post') {
    pageSchema = buildLandingPageSchema(project, htmlForStrategy)
  }

  const plan = buildCmsPublishPlan({
    payload,
    collectionFields,
    cmsFieldMapping: integration?.cmsFieldMapping,
    collectionId: project.cmsCollectionId,
    htmlMode,
    builderHtml: htmlForStrategy,
    scopeId: projectId,
    pageSchema,
  })

  const appUrl = getAppBaseUrl()

  return {
    payload: { ...payload, templateHtml: payload.templateHtml?.slice(0, 2000) },
    mapping: previewFieldMapping(
      payload,
      collectionFields,
      integration?.cmsFieldMapping,
      project.cmsCollectionId,
    ),
    collectionFields: collectionFields.map((f) => ({
      slug: f.slug,
      name: f.name,
      type: f.type,
    })),
    canPublish: Object.keys(plan.fieldData).length > 0,
    resolvedFields: Object.keys(plan.fieldData),
    hasTemplateHtml: Boolean(payload.templateHtml?.trim()),
    usesEmbed: plan.usesEmbed,
    htmlMode: plan.htmlMode,
    publishHtmlMode,
    htmlLineThreshold: threshold,
    htmlLineCount: htmlForStrategy ? htmlForStrategy.split('\n').length : 0,
    embedFieldSlug: plan.embedFieldSlug,
    embedSnippet: buildProjectEmbedSnippet(appUrl, projectId),
    collectionEmbedSnippet:
      plan.usesEmbed && integration
        ? buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId)
        : null,
    projectEmbedSnippet: buildProjectEmbedSnippet(appUrl, projectId),
    collectionTemplateSnippet: getCollectionTemplateSnippet(plan.htmlMode, appUrl),
    usesSplitPlainText: plan.htmlMode === 'split_plain_text',
    usesRemoteRuntime: plan.htmlMode === 'remote_runtime',
    usesIframeEmbed: plan.htmlMode === 'iframe_embed',
    runtimeUrl: `${appUrl}/webflow/runtime.js`,
    runtimeConfigured: Boolean(
      (integration?.collections as CollectionsJson | null)?.automaioRuntime?.scriptId,
    ),
  }
}

type CollectionsJson = {
  automaioRuntime?: { scriptId?: string }
}

async function getCollectionFields(
  integration: { webflowApiKey: string; collections: unknown; cmsFieldMapping: unknown } | null,
  collectionId: string,
) {
  const cached = (
    integration?.collections as {
      collections?: Array<{ id: string; fields?: Array<{ slug: string; name: string; type: string }> }>
    } | null
  )?.collections?.find((c) => c.id === collectionId)

  if (cached?.fields?.length) return cached.fields

  if (!integration) throw new Error('Connect Webflow first')
  const client = new WebflowClient(integration.webflowApiKey)
  const detail = await client.getCollection(collectionId)
  return detail.fields?.map((f) => ({ slug: f.slug, name: f.displayName, type: f.type })) ?? []
}

async function buildProjectPayload(
  project: NonNullable<Awaited<ReturnType<typeof prisma.contentProject.findUnique>>> & {
    template?: { templateStructure: unknown } | null
  },
  overrides?: { slug?: string },
): Promise<AutomaioContentPayload> {
  const params = (project.parameters as Record<string, string>) ?? {}
  const itemSlug =
    overrides?.slug?.trim() || params.slug?.trim() || slugify(project.name ?? 'page')
  const isBlogPost = project.contentType === 'blog_post'

  const html = isBlogPost ? '' : (project.renderedHtml?.trim() || renderProjectHtml(project, params))
  const blogBody = params.body ?? project.description ?? ''

  const displayName =
    params.name?.trim() ||
    params.companyName?.trim() ||
    project.name?.trim() ||
    'Landing Page'

  if (isBlogPost) {
    return {
      name: displayName,
      slug: itemSlug,
      headline: params.headline ?? project.name,
      bodyHtml: blogBody,
      templateHtml: '',
      industry: params.industry ?? project.category,
      status: project.showOnWebsite ? 'published' : 'draft',
      targetAudience: params.audience ?? '',
      automaioId: project.id,
      contentType: project.contentType,
      seoTitle: params.seoTitle,
      seoDescription: params.seoDescription,
      ogTitle: params.ogTitle,
      ogDescription: params.ogDescription,
    }
  }

  if (!html && !params.body && !project.description) {
    return {
      name: displayName,
      slug: itemSlug,
      headline: params.headline ?? project.name,
      bodyHtml: '',
      templateHtml: '',
      industry: params.industry ?? project.category,
      status: project.showOnWebsite ? 'published' : 'draft',
      targetAudience: params.audience ?? '',
      automaioId: project.id,
      automaioTemplateId: project.templateId ?? undefined,
      contentType: project.contentType,
      seoTitle: params.seoTitle,
      seoDescription: params.seoDescription,
      ogTitle: params.ogTitle,
      ogDescription: params.ogDescription,
    }
  }

  const bodyHtml = params.body ?? project.description ?? (html ? htmlToPlainSummary(html) : '')

  return {
    name: displayName,
    slug: itemSlug,
    headline: params.headline ?? project.name,
    bodyHtml,
    templateHtml: html || '',
    industry: params.industry ?? project.category,
    status: project.showOnWebsite ? 'published' : 'draft',
    targetAudience: params.audience ?? '',
    automaioId: project.id,
    automaioTemplateId: project.templateId ?? undefined,
    contentType: project.contentType,
    seoTitle: params.seoTitle,
    seoDescription: params.seoDescription,
    ogTitle: params.ogTitle,
    ogDescription: params.ogDescription,
  }
}

async function persistProjectRenderedHtml(
  projectId: string,
  renderedHtml: string,
  existingParams: Record<string, unknown>,
) {
  const pageSchema = buildLandingPageSchema(
    { id: projectId, name: '', renderedHtml, parameters: existingParams },
    renderedHtml,
  )
  await prisma.contentProject.update({
    where: { id: projectId },
    data: {
      renderedHtml,
      parameters: {
        ...existingParams,
        pageSchema: JSON.stringify(pageSchema),
        runtimeVersion: String(pageSchema.version),
      } as object,
    },
  })
}

export async function publishContentProject(
  projectId: string,
  options?: PublishProjectOptions,
) {
  if (options?.renderedHtmlOverride?.trim()) {
    const existing = await prisma.contentProject.findUnique({ where: { id: projectId } })
    if (existing) {
      await persistProjectRenderedHtml(
        projectId,
        options.renderedHtmlOverride.trim(),
        (existing.parameters as Record<string, unknown>) ?? {},
      )
    }
  }

  const project = await prisma.contentProject.findUnique({
    where: { id: projectId },
    include: { template: true },
  })

  if (!project) throw new Error('Project not found')
  if (!project.webflowIntegrationId) throw new Error('Connect Webflow first in Settings → Integrations')
  if (!project.cmsCollectionId) throw new Error('Select a CMS collection for this project')

  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: project.webflowIntegrationId },
  })
  if (!integration) throw new Error('Webflow integration not found')

  const projectParams = (project.parameters as Record<string, unknown>) ?? {}
  if (options?.publishHtmlMode) {
    projectParams.publishHtmlMode = options.publishHtmlMode
  }
  if (options?.slug?.trim()) {
    projectParams.slug = slugify(options.slug.trim())
  }

  const appUrl = getAppBaseUrl()
  const { payload, htmlForStrategy } = await prepareProjectHtml(project, {
    slug: (projectParams.slug as string) || options?.slug,
  })
  if (!payload.templateHtml && !payload.bodyHtml) {
    throw new Error('Add content or pick a template before publishing')
  }
  const publishHtmlMode = parsePublishHtmlMode(
    options?.publishHtmlMode ?? projectParams.publishHtmlMode,
  )
  const threshold = await getHtmlLineThreshold()
  let collectionFields = await getCollectionFields(integration, project.cmsCollectionId)

  const hasRuntimeFields = collectionSupportsRemoteRuntime(collectionFields)
  const hasSplitFields = collectionSupportsSplitPlainText(collectionFields)
  const hasIframeFields = collectionSupportsIframeEmbed(collectionFields)

  const isHtmlPage = project.contentType !== 'blog_post' && Boolean(htmlForStrategy.trim())
  let htmlMode: PublishHtmlMode = 'remote_runtime'
  let deliverySetupWarning = ''
  if (isHtmlPage) {
    const customCode = await checkCustomCodeAccess(
      integration.webflowApiKey,
      integration.webflowSiteId,
    )
    const strategy = resolveHtmlModeWithOverride(
      htmlForStrategy,
      customCode.ok,
      publishHtmlMode,
      threshold,
      {
        hasRemoteRuntimeFields: hasRuntimeFields,
        hasSplitPlainTextFields: hasSplitFields,
        hasIframeEmbedFields: hasIframeFields,
      },
    )
    htmlMode = strategy.htmlMode

    const ensured = await ensureCollectionFieldsForMode(
      integration.id,
      project.cmsCollectionId,
      htmlMode as DeliveryMode,
    )
    collectionFields = ensured.map((f) => ({
      slug: f.slug,
      name: f.name ?? f.slug,
      type: f.type,
    }))
  }

  let pageSchema
  if (isHtmlPage) {
    pageSchema = buildLandingPageSchema(project, htmlForStrategy)
  }

  let plan = buildCmsPublishPlan({
    payload,
    collectionFields,
    cmsFieldMapping: integration?.cmsFieldMapping,
    collectionId: project.cmsCollectionId,
    htmlMode: isHtmlPage ? htmlMode : 'remote_runtime',
    builderHtml: htmlForStrategy,
    scopeId: projectId,
    pageSchema,
  })
  let fieldData = plan.fieldData

  const client = new WebflowClient(integration.webflowApiKey)
  let cmsItemId = project.webflowCmsItemId ?? project.sourceCmsItemId

  try {
    await client.getCollection(project.cmsCollectionId!)
  } catch (err) {
    if (isWebflowNotFoundError(err)) {
      throw new Error(
        'Webflow collection not found. Open project settings, re-select your CMS collection, then publish again.',
      )
    }
    throw err
  }

  const upsertCms = async (data: Record<string, unknown>) => {
    const goLive = project.showOnWebsite !== false
    const result = await client.upsertCollectionItem(
      project.cmsCollectionId!,
      cmsItemId,
      data,
      { goLive },
    )
    cmsItemId = result.id
  }

  try {
    await upsertCms(fieldData)
  } catch (err) {
    const message = formatWebflowValidationError(err)
    const shouldRetryFields =
      isHtmlPage &&
      project.cmsCollectionId &&
      (/missing these fields/i.test(message) ||
        /Field not described|does not match schema|validation_error/i.test(message))

    if (shouldRetryFields) {
      const refreshed = await ensureCollectionFieldsForMode(
        integration.id,
        project.cmsCollectionId,
        plan.htmlMode as DeliveryMode,
      )
      collectionFields = refreshed.map((f) => ({
        slug: f.slug,
        name: f.name ?? f.slug,
        type: f.type,
      }))
      plan = buildCmsPublishPlan({
        payload,
        collectionFields,
        cmsFieldMapping: integration.cmsFieldMapping,
        collectionId: project.cmsCollectionId,
        htmlMode: plan.htmlMode,
        builderHtml: htmlForStrategy,
        scopeId: projectId,
        pageSchema,
      })
      fieldData = plan.fieldData
      await upsertCms(fieldData)
    } else {
      throw new Error(message)
    }
  }

  let liveCmsSlug = payload.slug ?? slugify(project.name)
  if (project.showOnWebsite !== false) {
    try {
      const liveState = await ensureWebflowCmsItemIsLive(
        client,
        project.cmsCollectionId!,
        cmsItemId!,
        liveCmsSlug,
        fieldData,
      )
      cmsItemId = liveState.itemId
      liveCmsSlug = liveState.liveSlug || liveCmsSlug
      if (!liveState.isLive) {
        deliverySetupWarning =
          deliverySetupWarning ||
          'CMS item saved but is not live on Webflow yet. Publish again with "Visible on Live Website" and site publish enabled.'
      }
    } catch (liveErr) {
      deliverySetupWarning =
        deliverySetupWarning ||
        formatWebflowValidationError(liveErr)
    }
  }

  if (isHtmlPage) {
    try {
      const deliveryResult = await ensureCollectionDeliverySetup(integration.id, {
        collectionId: project.cmsCollectionId,
        mode: htmlMode as DeliveryMode,
        publishSite: false,
        force: true,
      })
      collectionFields = deliveryResult.fields.map((f) => ({
        slug: f.slug,
        name: f.name ?? f.slug,
        type: f.type,
      }))
      if (!deliveryResult.success) {
        deliverySetupWarning =
          deliveryResult.error ??
          'CMS item saved. Reconnect Webflow via OAuth (custom_code scope) to install the collection template script.'
      }
    } catch (deliveryErr) {
      deliverySetupWarning = formatWebflowValidationError(deliveryErr)
    }
  }

  const goLive = project.showOnWebsite !== false
  /** Live CMS URLs require a full Webflow site publish — default ON when going live. */
  const shouldPublishSite = goLive && options?.publishSite !== false

  const html = htmlForStrategy || payload.bodyHtml || ''

  const existingParams = (project.parameters as Record<string, unknown>) ?? {}
  const schemaParams = pageSchema
    ? {
        ...existingParams,
        pageSchema: JSON.stringify(pageSchema),
        runtimeVersion: String(pageSchema.version),
        pageId: projectId,
      }
    : existingParams

  const previousHtmlMode = projectParams.lastPublishedHtmlMode as PublishHtmlMode | undefined
  const htmlModeChanged = Boolean(previousHtmlMode && previousHtmlMode !== plan.htmlMode)

  const slugToPersist = liveCmsSlug

  await prisma.contentProject.update({
    where: { id: projectId },
    data: {
      renderedHtml: html,
      webflowCmsItemId: cmsItemId,
      status: 'published',
      parameters: {
        ...schemaParams,
        slug: slugToPersist,
        publishHtmlMode: plan.htmlMode,
        lastPublishedHtmlMode: plan.htmlMode,
        htmlModeChangedAt: htmlModeChanged ? new Date().toISOString() : projectParams.htmlModeChangedAt,
      } as object,
    },
  })

  const usedSplitPlainText = plan.htmlMode === 'split_plain_text'
  const usedRemoteRuntime = plan.htmlMode === 'remote_runtime'
  const usedIframeEmbed = plan.htmlMode === 'iframe_embed'
  const collectionTemplateSnippet = getCollectionTemplateSnippet(plan.htmlMode, appUrl)

  let needsRenderEmbedInstall = false
  if (usedSplitPlainText && project.cmsCollectionId) {
    const embedState = await getRenderEmbedSyncState(integration.id, project.cmsCollectionId)
    needsRenderEmbedInstall = !embedState.installed
  }

  let embedAutoConfigured = isHtmlPage && !deliverySetupWarning
  let embedNeedsReconnect = false
  let runtimeAutoConfigured = usedRemoteRuntime && isHtmlPage
  let runtimeNeedsReconnect = false
  let embedMessage = ''

  if (isHtmlPage) {
    if (usedRemoteRuntime) {
      embedMessage = htmlModeChanged
        ? 'Switched to remote runtime. CMS config-type and page-id updated; stale split HTML/CSS/JS fields cleared.'
        : 'Published with remote runtime. CMS fields and collection template custom code configured automatically.'
    } else if (usedSplitPlainText) {
      embedMessage = htmlModeChanged
        ? 'Switched to direct HTML mode. CMS config-type and generated-html/css updated; stale runtime fields cleared.'
        : needsRenderEmbedInstall
          ? 'Published to CMS with generated-html and generated-css. Open Webflow Designer once — Automaio installs the SEO embed automatically (no copy/paste).'
          : 'Published with direct HTML/CSS. Content updates in CMS; Webflow renders it server-side for SEO.'
    } else if (usedIframeEmbed) {
      embedMessage =
        'Published with iframe embed. iframe-url field set and iframe template script installed. Live page loads the hosted Automaio page.'
    }
    if (deliverySetupWarning) {
      embedMessage = `${embedMessage} ${deliverySetupWarning}`.trim()
      embedNeedsReconnect = true
      runtimeNeedsReconnect = usedRemoteRuntime
    }
  }

  let sitePublishAttempted = false
  let livePageWarning = ''
  if (shouldPublishSite) {
    try {
      await publishWebflowSiteWithRetry(client, integration.webflowSiteId, {
        waitAfterMs: 3000,
      })
      sitePublishAttempted = true
    } catch (publishErr) {
      if (isWebflowRateLimitError(publishErr)) {
        embedMessage =
          embedMessage ||
          'CMS item saved. Webflow site publish hit rate limit (1 per minute) — wait 60 seconds, then publish again with site publish enabled, or publish manually in Webflow Designer.'
      } else if (isWebflowSitePublishError(publishErr)) {
        embedMessage =
          embedMessage ||
          'CMS item saved, but Webflow site publish failed. Open Webflow Designer → Publish, or reconnect Webflow in Settings (sites:write scope required). CMS URLs stay 404 until the site is published.'
        embedNeedsReconnect = /403|forbidden|missing_scopes|not authorized/i.test(
          publishErr instanceof Error ? publishErr.message : String(publishErr),
        )
      } else {
        throw publishErr
      }
    }
  }

  const collectionsJson = integration.collections as {
    siteShortName?: string
    collections?: Array<{ id: string; slug?: string }>
  } | null
  const itemSlug = liveCmsSlug

  let liveUrl: string | null = null
  try {
    liveUrl = await buildWebflowLiveUrlForItem(client, {
      siteId: integration.webflowSiteId,
      siteShortName: collectionsJson?.siteShortName,
      collectionId: project.cmsCollectionId!,
      itemSlug,
    })
  } catch {
    const collectionSlug = collectionsJson?.collections?.find(
      (c) => c.id === project.cmsCollectionId,
    )?.slug
    liveUrl = buildWebflowLiveUrl({
      siteShortName: collectionsJson?.siteShortName,
      collectionSlug,
      itemSlug,
    })
  }

  if (goLive) {
    const readiness = await verifyWebflowLivePageReadiness({
      client,
      siteId: integration.webflowSiteId,
      collectionId: project.cmsCollectionId!,
      itemSlug,
      sitePublishAttempted,
      goLive,
    })
    if (readiness.warnings.length) {
      livePageWarning = formatLivePageReadinessWarnings(readiness.warnings)
      embedMessage = embedMessage ? `${embedMessage} ${livePageWarning}` : livePageWarning
      if (!readiness.templatePageFound || !readiness.liveItemFound || !sitePublishAttempted) {
        embedNeedsReconnect = embedNeedsReconnect || !readiness.templatePageFound
      }
    }
  }

  const previewUrl = buildProjectIframeUrl(appUrl, projectId)

  await prisma.contentProject.update({
    where: { id: projectId },
    data: {
      parameters: {
        ...schemaParams,
        liveUrl,
        previewUrl,
        slug: payload.slug ?? slugify(project.name),
        cmsSlug: payload.slug ?? slugify(project.name),
      },
    },
  })

  return {
    cmsItemId,
    html,
    liveUrl,
    previewUrl,
    mappedFields: Object.keys(fieldData),
    embedAutoConfigured,
    embedNeedsReconnect,
    embedMessage,
    livePageWarning: livePageWarning || undefined,
    runtimeAutoConfigured,
    runtimeNeedsReconnect,
    usedSplitPlainText,
    usedRemoteRuntime,
    usedIframeEmbed,
    htmlMode: plan.htmlMode,
    usesEmbed: plan.usesEmbed,
    collectionTemplateSnippet,
    runtimeUrl: `${appUrl}/webflow/runtime.js`,
    runtimeApiUrl: `${appUrl}/api/runtime/pages/${projectId}`,
    embedFieldSlug: plan.embedFieldSlug,
    embedSnippet: buildProjectEmbedSnippet(appUrl, projectId),
    collectionEmbedSnippet:
      plan.usesEmbed
        ? buildCollectionEmbedSnippet(getAppBaseUrl(), integration.webflowSiteId)
        : null,
    projectEmbedSnippet: buildProjectEmbedSnippet(getAppBaseUrl(), projectId),
    needsRenderEmbedInstall,
    designerSetupMessage: buildDesignerSetupMessage(needsRenderEmbedInstall),
  }
}

export function getNextScheduleDate(from: Date, frequency: string): Date | null {
  const next = new Date(from)
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      return next
    case 'twice_daily':
      next.setHours(next.getHours() + 12)
      return next
    case 'weekly':
      next.setDate(next.getDate() + 7)
      return next
    default:
      return null
  }
}
