import { prisma } from '@/lib/prisma'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import {
  buildCampaignTemplateData,
  getTemplateHtml,
  renderTemplateHtml,
} from '@/lib/webflow/template-renderer'
import {
  buildWebflowFieldData,
  formatWebflowValidationError,
  type AutomaioContentPayload,
} from '@/lib/webflow/field-mapper'
import { ensureAutomaioTemplateDeliverySetup } from '@/lib/webflow/collection-delivery-setup'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

async function getCollectionFields(
  integration: { webflowApiKey: string; collections: unknown },
  collectionId: string,
) {
  const cached = (
    integration.collections as {
      collections?: Array<{ id: string; fields?: Array<{ slug: string; name: string; type: string }> }>
    } | null
  )?.collections?.find((c) => c.id === collectionId)

  if (cached?.fields?.length) return cached.fields

  const client = new WebflowClient(integration.webflowApiKey)
  const detail = await client.getCollection(collectionId)
  return detail.fields?.map((f) => ({ slug: f.slug, name: f.displayName, type: f.type })) ?? []
}

export async function syncWebflowIntegrationV2(organizationId: string, integrationId: string) {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })

  if (!integration) throw new Error('Integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  const sites = await client.listSites()
  const site = sites.find((s) => s.id === integration.webflowSiteId)

  if (!site) throw new Error('Webflow site not found for this token')

  const collections = await client.listCollections(integration.webflowSiteId)
  const collectionDetails = await Promise.all(
    collections.map(async (c) => {
      try {
        const detail = await client.getCollection(c.id)
        return {
          id: c.id,
          name: c.displayName,
          slug: c.slug,
          fields: detail.fields?.map((f) => ({
            id: f.id,
            slug: f.slug,
            name: f.displayName,
            type: f.type,
          })),
        }
      } catch {
        return { id: c.id, name: c.displayName, slug: c.slug, fields: [] }
      }
    }),
  )

  let staticPages: Array<{ id: string; title?: string; slug?: string }> = []
  try {
    const pages = await client.listPages(integration.webflowSiteId)
    staticPages = pages
      .filter((p) => !p.collectionId)
      .map((p) => ({ id: p.id, title: p.title, slug: p.title?.toLowerCase().replace(/\s+/g, '-') }))
  } catch {
    staticPages = []
  }

  const existingJson =
    integration.collections && typeof integration.collections === 'object'
      ? (integration.collections as Record<string, unknown>)
      : {}

  await prisma.webflowIntegration.update({
    where: { id: integrationId },
    data: {
      siteName: site.displayName,
      collections: {
        ...existingJson,
        siteShortName: site.shortName,
        collections: collectionDetails,
        staticPages,
      },
      syncedAt: new Date(),
    },
  })

  let embedSetup: Awaited<ReturnType<typeof ensureAutomaioTemplateDeliverySetup>> | null = null
  try {
    embedSetup = await ensureAutomaioTemplateDeliverySetup(integrationId, {
      collectionId: integration.templatesCollectionId ?? undefined,
      publishSite: false,
    })
  } catch (embedErr) {
    console.warn('[Automaio] Template delivery auto-setup skipped:', embedErr)
  }

  return {
    collections: collectionDetails.length,
    siteName: site.displayName,
    embedAutoConfigured: embedSetup?.templateAutoConfigured === true,
    embedNeedsReconnect: embedSetup?.success === false && embedSetup.needsReconnect,
    runtimeAutoConfigured: embedSetup?.templateAutoConfigured === true,
  }
}

export async function publishCampaignToWebflowCms(
  campaignId: string,
  integrationId: string,
  options?: { publishSite?: boolean },
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: true, contentAssets: true },
  })

  if (!campaign) throw new Error('Campaign not found')

  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })

  if (!integration) throw new Error('Webflow integration not found')
  if (!integration.campaignsCollectionId) {
    throw new Error('Configure a Webflow CMS collection in organization settings first')
  }

  const templateData = buildCampaignTemplateData(campaign)

  let html = campaign.renderedHtml ?? ''
  if (!html && campaign.template) {
    const structure = campaign.template.templateStructure as import('@/lib/templates/starter-templates').TemplateStructure
    html = renderTemplateHtml(
      getTemplateHtml(campaign.template.templateStructure),
      templateData,
      structure.theme,
    )
  }
  if (!html) {
    throw new Error('No template HTML — select a template when creating the campaign')
  }

  const headline =
    campaign.contentAssets.find((a) => a.assetType === 'headline')?.content ?? campaign.name
  const bodyCopy =
    campaign.contentAssets.find((a) => a.assetType === 'body_copy')?.content ??
    campaign.description ??
    ''

  const payload: AutomaioContentPayload = {
    name: campaign.name,
    slug: slugify(campaign.name),
    headline,
    bodyHtml: bodyCopy,
    templateHtml: html,
    industry: campaign.industry,
    status: campaign.status,
    targetAudience: campaign.targetAudience,
    automaioId: campaign.id,
    automaioTemplateId: campaign.templateId ?? undefined,
  }

  const collectionFields = await getCollectionFields(integration, integration.campaignsCollectionId)
  const fieldData = buildWebflowFieldData(
    payload,
    collectionFields,
    integration.cmsFieldMapping,
    integration.campaignsCollectionId,
  )

  const client = new WebflowClient(integration.webflowApiKey)
  let cmsItemId = campaign.webflowCmsItemId

  try {
    if (cmsItemId) {
      await client.updateCollectionItem(integration.campaignsCollectionId, cmsItemId, fieldData)
    } else {
      const created = await client.createCollectionItem(
        integration.campaignsCollectionId,
        fieldData,
        { isDraft: campaign.status === 'draft' },
      )
      cmsItemId = created.id
    }
  } catch (err) {
    throw new Error(formatWebflowValidationError(err))
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      renderedHtml: html,
      webflowCmsItemId: cmsItemId,
      status: 'active',
    },
  })

  if (options?.publishSite) {
    await client.publishSite(integration.webflowSiteId)
  }

  return {
    success: true,
    webflowCmsItemId: cmsItemId,
    collectionId: integration.campaignsCollectionId,
    previewHtml: html,
  }
}

export async function previewCampaignHtml(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: true, contentAssets: true },
  })

  if (!campaign) throw new Error('Campaign not found')

  const templateData = buildCampaignTemplateData(campaign)
  let html = campaign.renderedHtml ?? ''

  if (campaign.template) {
    const structure = campaign.template.templateStructure as import('@/lib/templates/starter-templates').TemplateStructure
    html = renderTemplateHtml(
      getTemplateHtml(campaign.template.templateStructure),
      templateData,
      structure.theme,
    )
  }

  return { html, templateData }
}
