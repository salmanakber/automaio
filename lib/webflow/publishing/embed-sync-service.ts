import { getAppBaseUrl } from '@/lib/app-url'
import { CONFIG_TYPE_SPLIT_METHOD } from '@/lib/webflow/delivery-config-type'
import { buildSplitRenderEmbedMarkup } from '@/lib/webflow/publishing/embed-template'
import { getRenderEmbedSyncState } from '@/lib/webflow/publishing/embed-sync-state'
import type { EmbedSyncResult } from '@/lib/webflow/publishing/types'

export type EmbedSyncRequest = {
  integrationId: string
  collectionId: string
  configType: string
}

/**
 * Determines whether the collection template needs a one-time Embed install in Designer.
 * Future publishes only update CMS fields — embed markup is static {{wf}} bindings.
 */
export async function resolveEmbedSync(request: EmbedSyncRequest): Promise<EmbedSyncResult> {
  const embedMarkup = buildSplitRenderEmbedMarkup()

  if (request.configType !== CONFIG_TYPE_SPLIT_METHOD) {
    return {
      needsInstall: false,
      installed: true,
      embedMarkup,
      message: 'Direct render embed applies only to split_method collections.',
    }
  }

  const state = await getRenderEmbedSyncState(request.integrationId, request.collectionId)

  return {
    needsInstall: !state.installed,
    installed: state.installed,
    embedMarkup,
    message: state.installed
      ? 'Render embed already installed — publishes update CMS fields only.'
      : 'Open Webflow Designer with Automaio to auto-install the render embed once.',
  }
}

export function getRuntimeDesignerSnippet(): string {
  return buildSplitRenderEmbedMarkup()
}

export function getAppEmbedContext() {
  return { appUrl: getAppBaseUrl() }
}
