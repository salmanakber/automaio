import {
  WebflowClient,
  isWebflowNotFoundError,
  isWebflowPublishNoopError,
} from '@/lib/integrations/webflow-client'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readItemSlug(fieldData?: Record<string, unknown> | null): string | null {
  if (!fieldData) return null
  for (const key of ['slug', 'Slug']) {
    const val = fieldData[key]
    if (typeof val === 'string' && val.trim()) return val.trim()
  }
  return null
}

/** Ensure a CMS item exists on Webflow live (not just staged). */
export async function ensureWebflowCmsItemIsLive(
  client: WebflowClient,
  collectionId: string,
  itemId: string,
  itemSlug: string,
  fieldData: Record<string, unknown>,
): Promise<{ itemId: string; liveSlug: string; isLive: boolean }> {
  const normalizedSlug = itemSlug.trim()
  let live = normalizedSlug
    ? await client.findLiveCollectionItemBySlug(collectionId, normalizedSlug)
    : null

  if (live?.id) {
    return {
      itemId: live.id,
      liveSlug: readItemSlug(live.fieldData) ?? normalizedSlug,
      isLive: true,
    }
  }

  try {
    await client.publishCollectionItems(collectionId, [itemId])
  } catch (err) {
    if (!isWebflowPublishNoopError(err)) {
      // Continue — item may already be live under a different path.
    }
  }

  await sleep(1200)
  live = normalizedSlug ? await client.findLiveCollectionItemBySlug(collectionId, normalizedSlug) : null
  if (live?.id) {
    return {
      itemId: live.id,
      liveSlug: readItemSlug(live.fieldData) ?? normalizedSlug,
      isLive: true,
    }
  }

  try {
    await client.updateLiveCollectionItem(collectionId, itemId, fieldData)
  } catch (updateErr) {
    if (!isWebflowNotFoundError(updateErr)) throw updateErr
    try {
      const created = await client.createLiveCollectionItem(collectionId, fieldData)
      await sleep(800)
      live = normalizedSlug
        ? await client.findLiveCollectionItemBySlug(collectionId, normalizedSlug)
        : null
      return {
        itemId: created.id,
        liveSlug: readItemSlug(live?.fieldData) ?? normalizedSlug,
        isLive: Boolean(live?.id),
      }
    } catch (createErr) {
      if (!isWebflowNotFoundError(createErr)) throw createErr
    }
  }

  await sleep(800)
  live = normalizedSlug ? await client.findLiveCollectionItemBySlug(collectionId, normalizedSlug) : null
  return {
    itemId: live?.id ?? itemId,
    liveSlug: readItemSlug(live?.fieldData) ?? normalizedSlug,
    isLive: Boolean(live?.id),
  }
}
