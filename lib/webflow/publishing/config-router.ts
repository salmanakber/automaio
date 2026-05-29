import type { CollectionField } from '@/lib/webflow/field-mapper'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import {
  CONFIG_TYPE_REMOTE_RUNTIME,
  CONFIG_TYPE_SPLIT_METHOD,
  configTypeForHtmlMode,
  type DeliveryConfigType,
} from '@/lib/webflow/delivery-config-type'
import {
  resolveRuntimeFieldSlug,
  resolveSplitFieldSlug,
} from '@/lib/webflow/cms-collection-schema'
import {
  GENERATED_CSS_SLUG,
  GENERATED_HTML_SLUG,
  type SplitCmsPayload,
} from '@/lib/webflow/publishing/types'

export function resolveDeliveryConfigType(htmlMode: PublishHtmlMode): DeliveryConfigType {
  return configTypeForHtmlMode(htmlMode)
}

export function isDirectRenderMode(configType: DeliveryConfigType): boolean {
  return configType === CONFIG_TYPE_SPLIT_METHOD
}

export function isRuntimeRenderMode(configType: DeliveryConfigType): boolean {
  return configType === CONFIG_TYPE_REMOTE_RUNTIME
}

/** Map split payload → CMS field slugs (canonical + legacy aliases). */
export function mapSplitPayloadToCmsFields(
  payload: SplitCmsPayload,
  collectionFields: CollectionField[],
): Record<string, string> {
  const out: Record<string, string> = {}
  const slugs = new Set(collectionFields.map((f) => f.slug))

  if (slugs.has(GENERATED_HTML_SLUG) && payload.generatedHtml) {
    out[GENERATED_HTML_SLUG] = payload.generatedHtml
  }
  if (slugs.has(GENERATED_CSS_SLUG) && payload.generatedCss) {
    out[GENERATED_CSS_SLUG] = payload.generatedCss
  }

  const htmlSlug = resolveSplitFieldSlug('html', collectionFields)
  const cssSlug = resolveSplitFieldSlug('css', collectionFields)

  if (htmlSlug && htmlSlug !== GENERATED_HTML_SLUG && payload.legacyHtml) {
    out[htmlSlug] = payload.legacyHtml
  }
  if (cssSlug && cssSlug !== GENERATED_CSS_SLUG && payload.legacyCss) {
    out[cssSlug] = payload.legacyCss
  }

  return out
}

/** Runtime CMS fields for remote template rendering. */
export function mapRuntimePayloadToCmsFields(
  pageId: string,
  runtimeConfigJson: string,
  collectionFields: CollectionField[],
): Record<string, string> {
  const out: Record<string, string> = {}
  const pageIdSlug = resolveRuntimeFieldSlug('pageId', collectionFields)
  if (pageIdSlug) out[pageIdSlug] = pageId

  const runtimeSlug = resolveRuntimeFieldSlug('runtimeConfig', collectionFields)
  if (runtimeSlug) out[runtimeSlug] = runtimeConfigJson

  return out
}
