import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'

/** CMS `config-type` values — identifies which HTML delivery method is active for an item. */
export const CONFIG_TYPE_REMOTE_RUNTIME = 'remote_runtime'
export const CONFIG_TYPE_SPLIT_METHOD = 'split_method'
export const CONFIG_TYPE_IFRAME_EMBED = 'iframe_embed'

export type DeliveryConfigType =
  | typeof CONFIG_TYPE_REMOTE_RUNTIME
  | typeof CONFIG_TYPE_SPLIT_METHOD
  | typeof CONFIG_TYPE_IFRAME_EMBED

/** Map publish HTML mode → CMS config-type field value. */
export function configTypeForHtmlMode(htmlMode: PublishHtmlMode): DeliveryConfigType {
  if (htmlMode === 'split_plain_text') return CONFIG_TYPE_SPLIT_METHOD
  if (htmlMode === 'iframe_embed') return CONFIG_TYPE_IFRAME_EMBED
  return CONFIG_TYPE_REMOTE_RUNTIME
}

/** Resolve publish HTML mode from a stored config-type CMS value. */
export function htmlModeFromConfigType(value: string | null | undefined): PublishHtmlMode | null {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return null
  if (normalized === CONFIG_TYPE_SPLIT_METHOD || normalized === 'splitmethod') {
    return 'split_plain_text'
  }
  if (normalized === CONFIG_TYPE_IFRAME_EMBED || normalized === 'iframe') {
    return 'iframe_embed'
  }
  if (normalized === CONFIG_TYPE_REMOTE_RUNTIME || normalized === 'runtime') {
    return 'remote_runtime'
  }
  return null
}
