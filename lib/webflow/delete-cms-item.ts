import { prisma } from '@/lib/prisma'
import { WebflowClient } from '@/lib/integrations/webflow-client'

export async function deleteWebflowCmsItemForProject(project: {
  webflowIntegrationId: string | null
  cmsCollectionId: string | null
  webflowCmsItemId: string | null
  sourceCmsItemId: string | null
}) {
  const itemId = project.webflowCmsItemId ?? project.sourceCmsItemId
  if (!itemId || !project.webflowIntegrationId || !project.cmsCollectionId) {
    return { deleted: false, reason: 'no_cms_item' as const }
  }

  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: project.webflowIntegrationId },
  })
  if (!integration) {
    return { deleted: false, reason: 'no_integration' as const }
  }

  const client = new WebflowClient(integration.webflowApiKey)
  try {
    await client.deleteCollectionItem(project.cmsCollectionId, itemId)
    return { deleted: true, cmsItemId: itemId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('404') || message.includes('not found')) {
      return { deleted: false, reason: 'already_removed' as const, cmsItemId: itemId }
    }
    throw err
  }
}
