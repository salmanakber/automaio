import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'

/** Default delivery for new projects, collections, and Auto mode resolution. */
export const DEFAULT_PUBLISH_DELIVERY_MODE: PublishHtmlMode = 'remote_runtime'

/** Legacy delivery modes — require explicit user opt-in in publish UI. */
export const LEGACY_PUBLISH_DELIVERY_MODES: PublishHtmlMode[] = [
  'split_plain_text',
  'iframe_embed',
]

export function isLegacyDeliveryMode(mode: string): boolean {
  return LEGACY_PUBLISH_DELIVERY_MODES.includes(mode as PublishHtmlMode)
}

/**
 * Webflow Marketplace / Data Client compliance notes (see Webflow App Store guidelines).
 * - OAuth only (no site API tokens for custom code)
 * - custom_code: registered inline scripts on collection template pages only
 * - CMS: metadata + Page ID — not arbitrary executable code from CMS fields
 * - No eval() or CMS-driven script execution in production embeds
 */
export const WEBFLOW_MARKETPLACE_POLICY = {
  appName: 'Automaio',
  oauthRequired: true,
  customCodeUsage:
    'Registers a single reviewed inline script on the user’s collection template via Webflow custom_code API. Never injects site-wide arbitrary scripts.',
  cmsDataModel:
    'Webflow CMS stores Page ID, SEO fields, and status. Full page content lives as JSON page schema on Automaio and is rendered server-side.',
  prohibitedPatterns: [
    'eval() or Function() on CMS field values',
    'Executing user-authored JavaScript from CMS Plain Text fields',
    'Site-wide script injection outside collection template scope',
  ],
} as const

export const LEGACY_DELIVERY_WARNINGS: {
  split_plain_text: string
  iframe_embed: string
} = {
  split_plain_text:
    'Legacy mode: HTML/CSS are injected from CMS. JavaScript from CMS is not executed (Webflow App Store policy). Use Remote runtime for JSON schema + AutomaioRuntime enhancements.',
  iframe_embed:
    'Legacy mode: content loads in an iframe. Crawlers may not index iframe content. Remote runtime is recommended for marketplace and SEO.',
}

export const RECOMMENDED_DELIVERY_BLURB =
  'JSON page schema on Automaio → server-rendered HTML → Webflow stores Page ID + SEO only. AutomaioRuntime adds animations after load (optional).'
