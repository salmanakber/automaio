import { WebflowClient, isWebflowNotFoundError } from '@/lib/integrations/webflow-client'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isWebflowRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /429|rate limit|too many requests/i.test(msg)
}

export function isWebflowSitePublishError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return (
    isWebflowRateLimitError(error) ||
    isWebflowNotFoundError(error) ||
    /403|forbidden|missing_scopes|sites:write|not authorized/i.test(msg)
  )
}

/** Publish site to webflow.io subdomain (+ optional custom domains). Webflow queues async. */
export async function publishWebflowSiteWithRetry(
  client: WebflowClient,
  siteId: string,
  options?: { retries?: number; waitAfterMs?: number },
) {
  const retries = options?.retries ?? 2
  let customDomainIds: string[] = []

  try {
    const domains = await client.listCustomDomains(siteId)
    customDomainIds = domains.map((d) => d.id).filter(Boolean)
  } catch {
    customDomainIds = []
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await client.publishSite(siteId, {
        publishToWebflowSubdomain: true,
        customDomainIds,
      })
      if (options?.waitAfterMs) {
        await sleep(options.waitAfterMs)
      }
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
