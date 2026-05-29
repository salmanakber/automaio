import { assembleLandingPageForWebflow } from '@/lib/webflow/landing-page-assembler'
import type { SplitCmsPayload } from '@/lib/webflow/publishing/types'

export type BuildSplitPayloadOptions = {
  scopeId: string
  /** When false, strips inline JS from CMS payload (recommended for SEO embed). */
  includeJs?: boolean
}

/**
 * Platform-agnostic split payload from builder HTML.
 * Sanitizes HTML (no scripts), scopes CSS, strips JS by default for direct embed mode.
 */
export function buildSplitCmsPayload(
  builderHtml: string,
  options: BuildSplitPayloadOptions,
): SplitCmsPayload {
  const assembled = assembleLandingPageForWebflow(builderHtml, {
    scopeId: options.scopeId,
    allowJs: options.includeJs ?? false,
  })

  return {
    generatedHtml: assembled.htmlContent,
    generatedCss: assembled.cssContent,
    legacyHtml: assembled.htmlContent,
    legacyCss: assembled.cssContent,
  }
}
