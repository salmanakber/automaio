import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import { DEFAULT_HTML_LINE_THRESHOLD } from '@/lib/platform/rendering-settings'

/** @deprecated Use getHtmlLineThreshold() for admin-configurable value. */
export const HTML_LINE_THRESHOLD = DEFAULT_HTML_LINE_THRESHOLD

export type RenderingStrategy = {
  lineCount: number
  strategy: 'remote_runtime' | 'split_plain_text' | 'custom_code' | 'iframe_embed' | 'rich_text_html'
  htmlMode: PublishHtmlMode
  reason: string
}

export type PublishHtmlModeOverride = PublishHtmlMode | 'auto'

export function countHtmlLines(html: string): number {
  if (!html?.trim()) return 0
  return html.split('\n').length
}

/**
 * Decide how to deliver HTML on Webflow:
 * - Small HTML (< threshold) with custom_code access → custom_code (Plain Text / embed field)
 * - Large HTML (≥ threshold) → iframe_embed (iframe snippet in Rich Text)
 * - No custom_code access → rich_text_html fallback
 */
export type RenderingStrategyOptions = {
  hasRemoteRuntimeFields?: boolean
  hasSplitPlainTextFields?: boolean
}

export function resolveRenderingStrategy(
  html: string,
  hasCustomCodeAccess: boolean,
  threshold: number = DEFAULT_HTML_LINE_THRESHOLD,
  options?: RenderingStrategyOptions,
): RenderingStrategy {
  const lineCount = countHtmlLines(html)

  if (options?.hasRemoteRuntimeFields) {
    return {
      lineCount,
      strategy: 'remote_runtime',
      htmlMode: 'remote_runtime',
      reason:
        'Remote runtime — Webflow stores Page ID only; platform renders via runtime.js',
    }
  }

  if (options?.hasSplitPlainTextFields) {
    return {
      lineCount,
      strategy: 'split_plain_text',
      htmlMode: 'split_plain_text',
      reason:
        'Collection has HTML/CSS/JS Plain Text fields — direct SEO-friendly rendering on Webflow',
    }
  }

  if (!hasCustomCodeAccess) {
    return {
      lineCount,
      strategy: 'rich_text_html',
      htmlMode: 'rich_text_html',
      reason: 'Custom code unavailable — using CMS Rich Text delivery',
    }
  }

  if (lineCount >= threshold) {
    return {
      lineCount,
      strategy: 'iframe_embed',
      htmlMode: 'iframe_embed',
      reason: `HTML exceeds ${threshold} lines — iframe embed in Rich Text field`,
    }
  }

  return {
    lineCount,
    strategy: 'custom_code',
    htmlMode: 'custom_code',
    reason: `HTML under ${threshold} lines — full page HTML in CMS body field`,
  }
}

export function resolveHtmlModeWithOverride(
  html: string,
  hasCustomCodeAccess: boolean,
  override: PublishHtmlModeOverride | undefined,
  threshold: number,
  options?: RenderingStrategyOptions,
): RenderingStrategy {
  if (override && override !== 'auto') {
    const lineCount = countHtmlLines(html)
    const reasons: Record<PublishHtmlMode, string> = {
      remote_runtime: 'Manual: remote runtime (Page ID in CMS, render from platform API)',
      split_plain_text: 'Manual: split HTML/CSS/JS into Plain Text CMS fields (legacy)',
      custom_code: 'Manual: full HTML in CMS body field',
      iframe_embed: 'Manual: iframe embed snippet in Rich Text field',
      rich_text_html: 'Manual: full HTML in Rich Text field',
    }
    return {
      lineCount,
      strategy: override === 'custom_code' ? 'custom_code' : override,
      htmlMode: override,
      reason: reasons[override],
    }
  }
  return resolveRenderingStrategy(html, hasCustomCodeAccess, threshold, options)
}
