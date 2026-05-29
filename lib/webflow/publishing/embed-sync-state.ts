import { prisma } from '@/lib/prisma'
import { RENDER_EMBED_VERSION, type RenderEmbedSyncState } from '@/lib/webflow/publishing/types'

type CollectionsJson = {
  automaioDelivery?: {
    renderEmbed?: RenderEmbedSyncState
  }
}

function readCollectionsJson(raw: unknown): CollectionsJson {
  if (!raw || typeof raw !== 'object') return {}
  return raw as CollectionsJson
}

export async function getRenderEmbedSyncState(
  integrationId: string,
  collectionId: string,
): Promise<RenderEmbedSyncState> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) return { installed: false }

  const json = readCollectionsJson(integration.collections)
  const state = json.automaioDelivery?.renderEmbed
  if (!state?.installed || state.collectionId !== collectionId) {
    return { installed: false, collectionId }
  }
  return state
}

export async function markRenderEmbedInstalled(
  integrationId: string,
  collectionId: string,
): Promise<void> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) return

  const json = readCollectionsJson(integration.collections)

  await prisma.webflowIntegration.update({
    where: { id: integrationId },
    data: {
      collections: {
        ...json,
        automaioDelivery: {
          ...json.automaioDelivery,
          renderEmbed: {
            installed: true,
            collectionId,
            installedAt: new Date().toISOString(),
            embedVersion: RENDER_EMBED_VERSION,
          },
        },
      } as object,
    },
  })
}

export async function clearRenderEmbedInstalled(integrationId: string): Promise<void> {
  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: integrationId },
  })
  if (!integration) return

  const json = readCollectionsJson(integration.collections)
  if (!json.automaioDelivery?.renderEmbed) return

  await prisma.webflowIntegration.update({
    where: { id: integrationId },
    data: {
      collections: {
        ...json,
        automaioDelivery: {
          ...json.automaioDelivery,
          renderEmbed: { installed: false },
        },
      } as object,
    },
  })
}
