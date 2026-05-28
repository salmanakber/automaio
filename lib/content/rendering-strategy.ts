import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'

export type RenderingStrategy = {
  lineCount: number
  strategy: PublishHtmlMode
  htmlMode: PublishHtmlMode
  reason: string
}

export type PublishHtmlModeOverride = PublishHtmlMode | 'auto'

const DELIVERY_MODES: PublishHtmlMode[] = ['remote_runtime', 'split_plain_text', 'iframe_embed']

export function normalizePublishHtmlMode(raw: unknown): PublishHtmlModeOverride {
  if (raw === 'auto') return 'auto'
  if (DELIVERY_MODES.includes(raw as PublishHtmlMode)) return raw as PublishHtmlMode
  // Legacy modes map to closest delivery option
  if (raw === 'rich_text_html' || raw === 'custom_code') return 'split_plain_text'
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
 * Resolve delivery mode (only remote runtime, split HTML, or iframe embed).
 */
export function resolveRenderingStrategy(
  _html: string,
  _hasCustomCodeAccess: boolean,
  _threshold?: number,
  options?: RenderingStrategyOptions,
): RenderingStrategy {
  const lineCount = countHtmlLines(_html)

  if (options?.hasRemoteRuntimeFields) {
    return {
      lineCount,
      strategy: 'remote_runtime',
      htmlMode: 'remote_runtime',
      reason: 'Remote runtime — Webflow stores Page ID; content loads from Automaio API',
    }
  }

  if (options?.hasSplitPlainTextFields) {
    return {
      lineCount,
      strategy: 'split_plain_text',
      htmlMode: 'split_plain_text',
      reason: 'Split HTML/CSS/JS — content in Plain Text CMS fields (html, css, js)',
    }
  }

  if (options?.hasIframeEmbedFields) {
    return {
      lineCount,
      strategy: 'iframe_embed',
      htmlMode: 'iframe_embed',
      reason: 'Iframe embed — iframe-url Plain Text field loads hosted page',
    }
  }

  return {
    lineCount,
    strategy: 'remote_runtime',
    htmlMode: 'remote_runtime',
    reason: 'Default — use remote runtime (add Page ID field or create collection via Automaio)',
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
      remote_runtime: 'Manual: remote runtime (Page ID + runtime.js on collection template)',
      split_plain_text: 'Manual: split HTML/CSS/JS in Plain Text fields (html, css, js)',
      iframe_embed: 'Manual: iframe embed via iframe-url Plain Text field',
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
