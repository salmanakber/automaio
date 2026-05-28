import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import {
  DEFAULT_PUBLISH_DELIVERY_MODE,
  isLegacyDeliveryMode,
  RECOMMENDED_DELIVERY_BLURB,
} from '@/lib/webflow/marketplace-policy'

export type RenderingStrategy = {
  lineCount: number
  strategy: PublishHtmlMode
  htmlMode: PublishHtmlMode
  reason: string
}

export type PublishHtmlModeOverride = PublishHtmlMode | 'auto'

const DELIVERY_MODES: PublishHtmlMode[] = [
  'remote_runtime',
  'split_plain_text',
  'iframe_embed',
]

export function normalizePublishHtmlMode(raw: unknown): PublishHtmlModeOverride {
  if (raw === 'auto') return 'auto'
  if (DELIVERY_MODES.includes(raw as PublishHtmlMode)) return raw as PublishHtmlMode
  // Deprecated stored modes → recommended remote runtime (JSON schema path)
  if (raw === 'rich_text_html' || raw === 'custom_code') {
    return DEFAULT_PUBLISH_DELIVERY_MODE
  }
  return 'auto'
}

export function countHtmlLines(html: string): number {
  if (!html?.trim()) return 0
  return html.split('\n').length
}

export type RenderingStrategyOptions = {
  hasRemoteRuntimeFields?: boolean
  hasSplitPlainTextFields?: boolean
  hasIframeEmbedFields?: boolean
}

/**
 * Auto mode always resolves to remote runtime (JSON schema + CMS metadata).
 * Legacy split/iframe are opt-in only via explicit publishHtmlMode override.
 */
export function resolveRenderingStrategy(
  _html: string,
  _hasCustomCodeAccess: boolean,
  _threshold?: number,
  _options?: RenderingStrategyOptions,
): RenderingStrategy {
  const lineCount = countHtmlLines(_html)

  return {
    lineCount,
    strategy: DEFAULT_PUBLISH_DELIVERY_MODE,
    htmlMode: DEFAULT_PUBLISH_DELIVERY_MODE,
    reason: `Recommended — ${RECOMMENDED_DELIVERY_BLURB}`,
  }
}

export function resolveHtmlModeWithOverride(
  html: string,
  hasCustomCodeAccess: boolean,
  override: PublishHtmlModeOverride | undefined,
  threshold: number,
  options?: RenderingStrategyOptions,
): RenderingStrategy {
  const normalized = normalizePublishHtmlMode(override)

  if (normalized !== 'auto' && DELIVERY_MODES.includes(normalized)) {
    const lineCount = countHtmlLines(html)
    const reasons: Record<PublishHtmlMode, string> = {
      remote_runtime: `Recommended — ${RECOMMENDED_DELIVERY_BLURB}`,
      split_plain_text:
        'Legacy — HTML/CSS in CMS Plain Text fields. CMS JavaScript is not executed (Webflow App Store policy).',
      iframe_embed:
        'Legacy — iframe-url field embeds hosted preview. Use remote runtime for production SEO.',
    }
    return {
      lineCount,
      strategy: normalized,
      htmlMode: normalized,
      reason: reasons[normalized],
    }
  }

  return resolveRenderingStrategy(html, hasCustomCodeAccess, threshold, options)
}

export { isLegacyDeliveryMode }
