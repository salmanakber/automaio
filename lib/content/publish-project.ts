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
import { buildWebflowLiveUrl } from '@/lib/webflow/live-url'
import { getAppBaseUrl } from '@/lib/app-url'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'

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

  const payload = await buildProjectPayload(project)
  const collectionFields = await getCollectionFields(
    integration,
    project.cmsCollectionId,
  )

  let htmlMode: PublishHtmlMode = 'iframe_embed'
  if (integration && payload.templateHtml?.trim() && project.contentType !== 'blog_post') {
    const access = await checkCustomCodeAccess(integration.webflowApiKey, integration.webflowSiteId)
    if (!access.ok) htmlMode = 'rich_text_html'
  }

  const plan = buildWebflowFieldPlan(
    payload,
    collectionFields,
    integration?.cmsFieldMapping,
    project.cmsCollectionId,
    { htmlMode },
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
    embedFieldSlug: plan.embedFieldSlug,
    embedSnippet: buildProjectEmbedSnippet(appUrl, projectId),
    collectionEmbedSnippet:
      plan.usesEmbed
        ? buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId)
        : null,
    projectEmbedSnippet: buildProjectEmbedSnippet(appUrl, projectId),
  }
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

  if (isBlogPost) {
    return {
      name: params.name ?? project.name,
      slug: params.slug ?? slugify(project.name),
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
      custom: params,
    }
  }

  if (!html && !params.body && !project.description) {
    return {
      name: params.name ?? project.name,
      slug: params.slug ?? slugify(project.name),
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
      custom: params,
    }
  }

  const bodyHtml = params.body ?? project.description ?? (html ? htmlToPlainSummary(html) : '')

  return {
    name: params.name ?? project.name,
    slug: params.slug ?? slugify(project.name),
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
    custom: params,
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

  const payload = await buildProjectPayload(project)
  if (!payload.templateHtml && !payload.bodyHtml) {
    throw new Error('Add content or pick a template before publishing')
  }

  const collectionFields = await getCollectionFields(integration, project.cmsCollectionId)

  const isHtmlPage = project.contentType !== 'blog_post' && Boolean(payload.templateHtml?.trim())
  let htmlMode: PublishHtmlMode = 'iframe_embed'
  if (isHtmlPage) {
    const customCode = await checkCustomCodeAccess(
      integration.webflowApiKey,
      integration.webflowSiteId,
    )
    if (!customCode.ok) htmlMode = 'rich_text_html'
  }

  let plan = buildWebflowFieldPlan(
    payload,
    collectionFields,
    integration.cmsFieldMapping,
    project.cmsCollectionId,
    { htmlMode: isHtmlPage ? htmlMode : undefined },
  )
  let fieldData = plan.fieldData

  const client = new WebflowClient(integration.webflowApiKey)
  let cmsItemId = project.webflowCmsItemId ?? project.sourceCmsItemId

  const upsertCms = async (data: Record<string, unknown>) => {
    if (cmsItemId) {
      await client.updateCollectionItem(project.cmsCollectionId!, cmsItemId, data)
    } else {
      const created = await client.createCollectionItem(
        project.cmsCollectionId!,
        data,
        { isDraft: !project.showOnWebsite },
      )
      cmsItemId = created.id
    }
  }

  try {
    await upsertCms(fieldData)
  } catch (err) {
    throw new Error(formatWebflowValidationError(err))
  }

  const shouldPublishSite = options?.publishSite ?? project.publishSite ?? true

  const html = payload.templateHtml ?? payload.bodyHtml ?? ''

  await prisma.contentProject.update({
    where: { id: projectId },
    data: {
      renderedHtml: html,
      webflowCmsItemId: cmsItemId,
      status: 'published',
    },
  })

  let embedAutoConfigured = false
  let embedNeedsReconnect = false
  let embedMessage = ''
  let usedRichTextFallback = plan.htmlMode === 'rich_text_html'

  if (usedRichTextFallback && isHtmlPage) {
    embedMessage =
      'HTML page published to CMS Rich Text field. Bind a Rich Text element to your body field on the collection template in Webflow Designer.'
  }

  if (html.trim() && plan.usesEmbed) {
    let embedResult: Awaited<ReturnType<typeof ensureAutomaioEmbedForIntegration>>
    try {
      embedResult = await ensureAutomaioEmbedForIntegration(integration.id, {
        collectionId: project.cmsCollectionId,
        publishSite: shouldPublishSite,
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
      if (shouldPublishSite) {
        await client.publishSite(integration.webflowSiteId)
      }
    }
  } else if (shouldPublishSite) {
    await client.publishSite(integration.webflowSiteId)
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

  return {
    cmsItemId,
    html,
    liveUrl,
    mappedFields: Object.keys(fieldData),
    embedAutoConfigured,
    embedNeedsReconnect,
    embedMessage,
    usedRichTextFallback,
    htmlMode: plan.htmlMode,
    usesEmbed: plan.usesEmbed,
    embedFieldSlug: plan.embedFieldSlug,
    embedSnippet: buildProjectEmbedSnippet(getAppBaseUrl(), projectId),
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
