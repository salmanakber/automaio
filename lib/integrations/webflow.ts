import { prisma } from '@/lib/prisma'
export { publishCampaignToWebflowCms, previewCampaignHtml, syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'

interface WebflowCollection {
  id: string
  name: string
  fields: Array<{
    id: string
    name: string
    type: string
  }>
}

interface WebflowPage {
  id: string
  name: string
  slug: string
  lastPublished: string
}

class WebflowAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) {
    const response = await fetch(`https://api.webflow.com/v1${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'accept-version': '1.0',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getSites() {
    const data = await this.request('/sites')
    return data.sites || []
  }

  async getCollections(siteId: string): Promise<WebflowCollection[]> {
    const data = await this.request(`/sites/${siteId}/collections`)
    return data.collections || []
  }

  async getPages(siteId: string): Promise<WebflowPage[]> {
    const data = await this.request(`/sites/${siteId}/pages`)
    return data.pages || []
  }

  async publishSite(siteId: string) {
    const response = await this.request(`/sites/${siteId}/publish`, 'POST', {
      domains: [],
    })
    return response
  }

  async createCollectionItem(
    collectionId: string,
    data: Record<string, any>
  ) {
    return this.request(
      `/collections/${collectionId}/items`,
      'POST',
      { fields: data }
    )
  }

  async updateCollectionItem(
    collectionId: string,
    itemId: string,
    data: Record<string, any>
  ) {
    return this.request(
      `/collections/${collectionId}/items/${itemId}`,
      'PATCH',
      { fields: data }
    )
  }
}

export async function syncWebflowIntegration(
  organizationId: string,
  integrationId: string
) {
  try {
    const integration = await prisma.webflowIntegration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    const api = new WebflowAPI(integration.webflowApiKey)

    // Fetch all sites
    const sites = await api.getSites()
    const currentSite = sites.find(
      (s: any) => s.id === integration.webflowSiteId
    )

    if (!currentSite) {
      throw new Error('Site not found on Webflow')
    }

    // Fetch collections
    const collections = await api.getCollections(integration.webflowSiteId)

    // Fetch pages
    const pages = await api.getPages(integration.webflowSiteId)

    // Update integration with latest metadata
    await prisma.webflowIntegration.update({
      where: { id: integrationId },
      data: {
        siteName: currentSite.name,
        collections: {
          collections: collections.map((c: WebflowCollection) => ({
            id: c.id,
            name: c.name,
            fields: c.fields,
          })),
          pages: pages.map((p: WebflowPage) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          })),
        },
        syncedAt: new Date(),
      },
    })

    return {
      success: true,
      collections: collections.length,
      pages: pages.length,
    }
  } catch (error) {
    console.error('Error syncing Webflow integration:', error)
    throw error
  }
}

export async function deployCampaignToWebflow(
  campaignId: string,
  webflowIntegrationId: string,
  collectionId: string
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { contentAssets: true },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const integration = await prisma.webflowIntegration.findUnique({
      where: { id: webflowIntegrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    const api = new WebflowAPI(integration.webflowApiKey)

    // Prepare campaign data for Webflow
    const campaignData = {
      name: campaign.name,
      description: campaign.description,
      industry: campaign.industry,
      audience: campaign.targetAudience,
      goals: campaign.goals.join(', '),
      status: campaign.status,
      content: campaign.contentAssets
        .map((asset) => `${asset.assetType}: ${asset.content}`)
        .join('\n\n'),
      createdAt: campaign.createdAt.toISOString(),
    }

    // Create item in Webflow collection
    const result = await api.createCollectionItem(collectionId, campaignData)

    // Create funnel page record
    const funnelPage = await prisma.funnelPage.create({
      data: {
        campaignId,
        webflowIntegrationId,
        webflowPageId: result.id,
        pageName: `${campaign.name} - Landing Page`,
        pageType: 'landing',
        contentStructure: {
          title: campaign.name,
          description: campaign.description,
          content: campaignData,
        },
      },
    })

    return {
      success: true,
      funnelPageId: funnelPage.id,
      webflowItemId: result.id,
    }
  } catch (error) {
    console.error('Error deploying campaign to Webflow:', error)
    throw error
  }
}

export async function updateWebflowPage(
  webflowIntegrationId: string,
  collectionId: string,
  itemId: string,
  data: Record<string, any>
) {
  try {
    const integration = await prisma.webflowIntegration.findUnique({
      where: { id: webflowIntegrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    const api = new WebflowAPI(integration.webflowApiKey)

    const result = await api.updateCollectionItem(
      collectionId,
      itemId,
      data
    )

    return { success: true, item: result }
  } catch (error) {
    console.error('Error updating Webflow page:', error)
    throw error
  }
}
