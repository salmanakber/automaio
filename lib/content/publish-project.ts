import { prisma } from '@/lib/prisma'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import {
  buildWebflowFieldData,
  buildWebflowFieldPlan,
  formatWebflowValidationError,
  previewFieldMapping,
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
import { ensureAutomaioEmbedForIntegration } from '@/lib/webflow/site-embed'
import { ensureAutomaioRuntimeForIntegration } from '@/lib/webflow/runtime-site-embed'
import { buildWebflowLiveUrl } from '@/lib/webflow/live-url'
import { getAppBaseUrl } from '@/lib/app-url'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import { resolveHtmlModeWithOverride, type PublishHtmlModeOverride } from '@/lib/content/rendering-strategy'
import { getHtmlLineThreshold } from '@/lib/platform/rendering-settings'
import { buildProjectIframeUrl } from '@/lib/webflow/embed-page'
import { applyLayoutControlsToHtml, parseLayoutControls } from '@/lib/webflow/layout-controls'
import { assembleLandingPageForWebflow } from '@/lib/webflow/landing-page-assembler'
import {
  collectionSupportsRemoteRuntime,
  collectionSupportsSplitPlainText,
} from '@/lib/webflow/cms-collection-schema'
import { buildWebflowCollectionTemplateEmbed } from '@/lib/webflow/collection-template-snippet'
import { buildWebflowRuntimeCollectionEmbed } from '@/lib/webflow/runtime-embed'
import { buildLandingPageSchema } from '@/lib/runtime/build-page-schema'
import {
  publishWebflowCmsItems,
  publishWebflowSiteWithRetry,
  isWebflowRateLimitError,
} from '@/lib/webflow/publish-site'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export type PublishProjectOptions = {
  publishSite?: boolean
}

function parsePublishHtmlMode(params: Record<string, unknown>): PublishHtmlModeOverride {
  const raw = params.publishHtmlMode
  if (
    raw === 'iframe_embed' ||
    raw === 'rich_text_html' ||
    raw === 'custom_code' ||
    raw === 'split_plain_text' ||
    raw === 'remote_runtime' ||
    raw === 'auto'
  ) {
    return raw
  }
  return 'auto'
}

async function prepareProjectHtml(
  project: NonNullable<Awaited<ReturnType<typeof prisma.contentProject.findUnique>>> & {
    template?: { templateStructure: unknown } | null
  },
): Promise<{ payload: AutomaioContentPayload; htmlForStrategy: string }> {
  const payload = await buildProjectPayload(project)
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
  const collectionFields = await getCollectionFields(
    integration,
    project.cmsCollectionId,
  )

  const params = (project.parameters as Record<string, unknown>) ?? {}
  const publishHtmlMode = parsePublishHtmlMode(params)
  const threshold = await getHtmlLineThreshold()
  const hasRuntimeFields = collectionSupportsRemoteRuntime(collectionFields)
  const hasSplitFields = collectionSupportsSplitPlainText(collectionFields)

  let htmlMode: PublishHtmlMode = 'remote_runtime'
  if (integration && htmlForStrategy.trim() && project.contentType !== 'blog_post') {
    const access = await checkCustomCodeAccess(integration.webflowApiKey, integration.webflowSiteId)
    const strategy = resolveHtmlModeWithOverride(
      htmlForStrategy,
      access.ok,
      publishHtmlMode,
      threshold,
      { hasRemoteRuntimeFields: hasRuntimeFields, hasSplitPlainTextFields: hasSplitFields },
    )
    htmlMode = strategy.htmlMode
  }

  let pageSchema
  let assembledLanding
  if (htmlForStrategy.trim() && project.contentType !== 'blog_post') {
    pageSchema = buildLandingPageSchema(project, htmlForStrategy)
    if (hasSplitFields && htmlMode === 'split_plain_text') {
      assembledLanding = assembleLandingPageForWebflow(htmlForStrategy, {
        scopeId: project.id,
        allowJs: true,
      })
    }
  }

  const plan = buildWebflowFieldPlan(
    payload,
    collectionFields,
    integration?.cmsFieldMapping,
    project.cmsCollectionId,
    { htmlMode, assembledLanding, pageSchema },
  )

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
    collectionTemplateSnippet: hasRuntimeFields
      ? buildWebflowRuntimeCollectionEmbed(appUrl)
      : hasSplitFields
        ? buildWebflowCollectionTemplateEmbed()
        : null,
    usesSplitPlainText: plan.htmlMode === 'split_plain_text',
    usesRemoteRuntime: plan.htmlMode === 'remote_runtime',
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
): Promise<AutomaioContentPayload> {
  const params = (project.parameters as Record<string, string>) ?? {}
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
      slug: params.slug?.trim() || slugify(displayName),
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
      slug: params.slug?.trim() || slugify(displayName),
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
    slug: params.slug?.trim() || slugify(displayName),
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

export async function publishContentProject(
  projectId: string,
  options?: PublishProjectOptions,
) {
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

  const { payload, htmlForStrategy } = await prepareProjectHtml(project)
  if (!payload.templateHtml && !payload.bodyHtml) {
    throw new Error('Add content or pick a template before publishing')
  }

  const collectionFields = await getCollectionFields(integration, project.cmsCollectionId)

  const projectParams = (project.parameters as Record<string, unknown>) ?? {}
  const publishHtmlMode = parsePublishHtmlMode(projectParams)
  const threshold = await getHtmlLineThreshold()
  const hasRuntimeFields = collectionSupportsRemoteRuntime(collectionFields)
  const hasSplitFields = collectionSupportsSplitPlainText(collectionFields)

  const isHtmlPage = project.contentType !== 'blog_post' && Boolean(htmlForStrategy.trim())
  let htmlMode: PublishHtmlMode = 'remote_runtime'
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
      { hasRemoteRuntimeFields: hasRuntimeFields, hasSplitPlainTextFields: hasSplitFields },
    )
    htmlMode = strategy.htmlMode
  }

  let pageSchema
  let assembledLanding
  if (isHtmlPage) {
    pageSchema = buildLandingPageSchema(project, htmlForStrategy)
    if (hasSplitFields && htmlMode === 'split_plain_text') {
      assembledLanding = assembleLandingPageForWebflow(htmlForStrategy, {
        scopeId: projectId,
        allowJs: true,
      })
    }
  }

  let plan = buildWebflowFieldPlan(
    payload,
    collectionFields,
    integration.cmsFieldMapping,
    project.cmsCollectionId,
    { htmlMode: isHtmlPage ? htmlMode : undefined, assembledLanding, pageSchema },
  )
  let fieldData = plan.fieldData

  const client = new WebflowClient(integration.webflowApiKey)
  let cmsItemId = project.webflowCmsItemId ?? project.sourceCmsItemId

  const upsertCms = async (data: Record<string, unknown>) => {
    const goLive = project.showOnWebsite !== false

    if (cmsItemId) {
      await client.updateCollectionItem(project.cmsCollectionId!, cmsItemId, data)
      if (goLive) {
        await publishWebflowCmsItems(client, project.cmsCollectionId!, [cmsItemId])
      }
      return
    }

    if (goLive) {
      const created = await client.createLiveCollectionItem(project.cmsCollectionId!, data)
      cmsItemId = created.id
      return
    }

    const created = await client.createCollectionItem(
      project.cmsCollectionId!,
      data,
      { isDraft: true },
    )
    cmsItemId = created.id
  }

  try {
    await upsertCms(fieldData)
  } catch (err) {
    throw new Error(formatWebflowValidationError(err))
  }

  const shouldPublishSite = options?.publishSite ?? project.publishSite ?? true

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

  await prisma.contentProject.update({
    where: { id: projectId },
    data: {
      renderedHtml: html,
      webflowCmsItemId: cmsItemId,
      status: 'published',
      parameters: schemaParams,
    },
  })

  let embedAutoConfigured = false
  let embedNeedsReconnect = false
  let embedMessage = ''
  let runtimeAutoConfigured = false
  let runtimeNeedsReconnect = false
  const usedSplitPlainText = plan.htmlMode === 'split_plain_text'
  const usedRemoteRuntime = plan.htmlMode === 'remote_runtime'
  let usedRichTextFallback = plan.htmlMode === 'rich_text_html'

  if (usedRemoteRuntime) {
    let runtimeResult: Awaited<ReturnType<typeof ensureAutomaioRuntimeForIntegration>>
    try {
      runtimeResult = await ensureAutomaioRuntimeForIntegration(integration.id, {
        collectionId: project.cmsCollectionId ?? undefined,
        publishSite: false,
        skipIfConfigured: true,
      })
    } catch (runtimeErr) {
      runtimeResult = {
        success: false,
        needsReconnect: true,
        recoverable: true,
        error: runtimeErr instanceof Error ? runtimeErr.message : 'Runtime setup failed',
      }
    }

    if (runtimeResult.success) {
      runtimeAutoConfigured = true
      embedAutoConfigured = true
      embedMessage =
        'Published with remote runtime. Automaio automatically configured your collection template — pages render from the platform without pasting embed code.'
    } else if (runtimeResult.needsReconnect) {
      runtimeNeedsReconnect = true
      embedNeedsReconnect = true
      embedMessage =
        'Published with remote runtime. Reconnect Webflow in Settings to enable automatic template setup, or add the runtime embed snippet manually.'
    } else {
      embedMessage =
        'Published with remote runtime. Webflow CMS stores Page ID + SEO only — content updates deploy without republishing CMS HTML.'
    }
  } else if (usedSplitPlainText) {
    embedMessage =
      'Landing page published to HTML/CSS/JS Plain Text CMS fields. Add the Automaio collection template embed to your Webflow Collection Template page.'
  } else if (usedRichTextFallback && isHtmlPage) {
    embedMessage =
      'HTML page published to CMS Rich Text field. Bind a Rich Text element to your body field on the collection template in Webflow Designer.'
  }

  if (html.trim() && plan.usesEmbed) {
    let embedResult: Awaited<ReturnType<typeof ensureAutomaioEmbedForIntegration>>
    try {
      embedResult = await ensureAutomaioEmbedForIntegration(integration.id, {
        collectionId: project.cmsCollectionId,
        publishSite: false,
      })
    } catch (embedErr) {
      embedResult = {
        success: false,
        needsReconnect: true,
        recoverable: true,
        error: embedErr instanceof Error ? embedErr.message : 'Embed setup failed',
      }
    }

    if (embedResult.success) {
      embedAutoConfigured = true
      embedMessage =
        'Content synced to CMS, embed script applied to your collection template, and site published.'
    } else if (embedResult.needsReconnect) {
      // Fallback: push full HTML into Rich Text and skip iframe embed.
      plan = buildWebflowFieldPlan(
        payload,
        collectionFields,
        integration.cmsFieldMapping,
        project.cmsCollectionId,
        { htmlMode: 'rich_text_html' },
      )
      fieldData = plan.fieldData
      try {
        await upsertCms(fieldData)
      } catch (err) {
        throw new Error(formatWebflowValidationError(err))
      }
      usedRichTextFallback = true
      embedNeedsReconnect = false
      embedMessage =
        'Automatic embed unavailable — full HTML saved to your CMS Rich Text field instead. Add a Rich Text block bound to the body field on your collection template.'
    }
  }

  if (shouldPublishSite) {
    try {
      await publishWebflowSiteWithRetry(client, integration.webflowSiteId)
    } catch (publishErr) {
      if (isWebflowRateLimitError(publishErr)) {
        embedMessage =
          embedMessage ||
          'CMS item saved. Webflow site publish hit rate limit — wait ~60 seconds and republish from Webflow, or publish again with "Publish Webflow site" unchecked.'
      } else {
        throw publishErr
      }
    }
  }

  const collectionsJson = integration.collections as {
    siteShortName?: string
    collections?: Array<{ id: string; slug?: string }>
  } | null
  const collectionMeta = collectionsJson?.collections?.find((c) => c.id === project.cmsCollectionId)
  const liveUrl = buildWebflowLiveUrl({
    siteShortName: collectionsJson?.siteShortName,
    collectionSlug: collectionMeta?.slug,
    itemSlug: payload.slug ?? slugify(project.name),
  })

  const appUrl = getAppBaseUrl()
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
    runtimeAutoConfigured,
    runtimeNeedsReconnect,
    usedRichTextFallback,
    usedSplitPlainText,
    usedRemoteRuntime,
    htmlMode: plan.htmlMode,
    usesEmbed: plan.usesEmbed,
    collectionTemplateSnippet: usedRemoteRuntime
      ? buildWebflowRuntimeCollectionEmbed(appUrl)
      : usedSplitPlainText
        ? buildWebflowCollectionTemplateEmbed()
        : null,
    runtimeUrl: `${appUrl}/webflow/runtime.js`,
    runtimeApiUrl: `${appUrl}/api/runtime/pages/${projectId}`,
    embedFieldSlug: plan.embedFieldSlug,
    embedSnippet: buildProjectEmbedSnippet(appUrl, projectId),
    collectionEmbedSnippet:
      plan.usesEmbed
        ? buildCollectionEmbedSnippet(getAppBaseUrl(), integration.webflowSiteId)
        : null,
    projectEmbedSnippet: buildProjectEmbedSnippet(getAppBaseUrl(), projectId),
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
