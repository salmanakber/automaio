import { WebflowClient } from '@/lib/integrations/webflow-client'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isWebflowRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /429|rate limit|too many requests/i.test(msg)
}

/** Publish site with short backoff — Webflow allows limited publishes per minute. */
export async function publishWebflowSiteWithRetry(
  client: WebflowClient,
  siteId: string,
  options?: { retries?: number },
) {
  const retries = options?.retries ?? 2

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await client.publishSite(siteId)
      return
    } catch (error) {
      if (!isWebflowRateLimitError(error) || attempt === retries) throw error
      await sleep(2500 * (attempt + 1))
    }
  }
}

/** Push staged CMS items to the live site. */
export async function publishWebflowCmsItems(
  client: WebflowClient,
  collectionId: string,
  itemIds: string[],
) {
  if (!itemIds.length) return
  await client.publishCollectionItems(collectionId, itemIds)
}
