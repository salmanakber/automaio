import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { DeliveryConfigType } from '@/lib/webflow/delivery-config-type'

/** Canonical CMS slugs for direct (split) rendering. */
export const GENERATED_HTML_SLUG = 'generated-html'
export const GENERATED_CSS_SLUG = 'generated-css'

/** Marker attribute inside collection-template Embed — used for idempotent Designer install. */
export const RENDER_EMBED_MARKER = 'data-automaio-render-embed'
export const RENDER_EMBED_VERSION = 'v1'

export type PublishDeliveryRoute = PublishHtmlMode

export type SplitCmsPayload = {
  generatedHtml: string
  generatedCss: string
  /** Legacy aliases — kept in sync for older templates. */
  legacyHtml?: string
  legacyCss?: string
}

export type CmsPublishInput = {
  configType: DeliveryConfigType
  projectId: string
  templateId?: string | null
  /** Raw builder HTML (full document or fragment). */
  builderHtml: string
  scopeId: string
}

export type RenderEmbedSyncState = {
  installed: boolean
  collectionId?: string
  installedAt?: string
  embedVersion?: string
}

export type EmbedSyncResult = {
  needsInstall: boolean
  installed: boolean
  embedMarkup: string
  message?: string
}
