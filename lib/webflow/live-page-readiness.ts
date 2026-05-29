import { WebflowClient } from '@/lib/integrations/webflow-client'

export type LivePageReadiness = {
  liveItemFound: boolean
  templatePageFound: boolean
  sitePublished: boolean
  warnings: string[]
}

/** Check why a Webflow CMS item URL may 404 after publish. */
export async function verifyWebflowLivePageReadiness(opts: {
  client: WebflowClient
  siteId: string
  collectionId: string
  itemSlug: string
  sitePublishAttempted: boolean
  goLive: boolean
}): Promise<LivePageReadiness> {
  const warnings: string[] = []

  let liveItemFound = false
  if (opts.goLive) {
    try {
      const liveItem = await opts.client.findLiveCollectionItemBySlug(
        opts.collectionId,
        opts.itemSlug,
      )
      liveItemFound = Boolean(liveItem)
      if (!liveItemFound) {
        warnings.push(
          'CMS item is not live on Webflow yet. Enable "Visible on Live Website" and publish again.',
        )
      }
    } catch {
      warnings.push('Could not verify the live CMS item in Webflow. Try publishing again.')
    }
  }

  let templatePageFound = false
  try {
    const templatePage = await opts.client.findCollectionTemplatePage(
      opts.siteId,
      opts.collectionId,
    )
    templatePageFound = Boolean(templatePage?.id)
    if (!templatePageFound) {
      warnings.push(
        'No Collection Template page found in Webflow. Open Webflow Designer → Pages → CMS Collection pages, select this collection, then publish the site.',
      )
    }
  } catch {
    warnings.push('Could not verify the Webflow collection template page.')
  }

  if (opts.goLive && !opts.sitePublishAttempted) {
    warnings.push(
      'The Webflow site was not republished. Turn on "Trigger Master Webflow Site Publish" and publish again — CMS URLs stay 404 until the site is published.',
    )
  }

  return {
    liveItemFound,
    templatePageFound,
    sitePublished: opts.sitePublishAttempted,
    warnings,
  }
}

export function formatLivePageReadinessWarnings(warnings: string[]): string {
  return warnings.join(' ')
}
