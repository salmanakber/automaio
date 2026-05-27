import type { TemplateStructure } from '@/lib/templates/starter-templates'
import { applyThemeToHtml, resolveTemplateTheme } from '@/lib/templates/theme'

/** Default showcase text when a template has no custom previewSample. */
export const DEFAULT_PREVIEW_SAMPLE: Record<string, string> = {
  '{{company_name}}': 'Automaio Demo Co.',
  '{{headline}}': 'Grow faster with AI marketing',
  '{{subheadline}}': 'Launch Webflow campaigns in minutes.',
  '{{cta_text}}': 'Start free trial',
  '{{offer}}': 'Save 30% this week only',
  '{{location}}': '123 Market Street, San Francisco',
  '{{year}}': String(new Date().getFullYear()),
}

const PLACEHOLDER_RE = /\{\{[^}]+\}\}/g

/** Tokens found in HTML, e.g. ['{{headline}}', '{{cta_text}}'] */
export function extractPlaceholders(html: string): string[] {
  return [...new Set([...html.matchAll(PLACEHOLDER_RE)].map((m) => m[0]))]
}

/** Merge template-specific preview copy with platform defaults. */
export function resolvePreviewSample(
  structure?: Pick<TemplateStructure, 'previewSample' | 'html'> | null,
): Record<string, string> {
  const tokens = structure?.html ? extractPlaceholders(structure.html) : []
  const merged = { ...DEFAULT_PREVIEW_SAMPLE, ...(structure?.previewSample ?? {}) }

  const sample: Record<string, string> = {}
  for (const token of tokens) {
    sample[token] =
      merged[token] ??
      token.replace(/^\{\{|\}\}$/g, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return sample
}

/**
 * UI / picker preview — replaces {{tokens}} with sample copy.
 * Stored HTML in the database always keeps {{placeholders}}.
 */
export function renderTemplatePreview(
  html: string,
  sample?: Record<string, string>,
  theme?: TemplateStructure['theme'],
): string {
  const values = sample ?? DEFAULT_PREVIEW_SAMPLE
  let output = applyThemeToHtml(html, resolveTemplateTheme({ theme }))
  for (const [token, value] of Object.entries(values)) {
    if (value != null) output = output.replaceAll(token, value)
  }
  return output
}

export function renderStructurePreview(structure: TemplateStructure | null | undefined): string {
  if (!structure?.html) return ''
  return renderTemplatePreview(
    structure.html,
    resolvePreviewSample(structure),
    structure.theme,
  )
}

/** Build default previewSample object for newly imported templates. */
export function buildDefaultPreviewSample(html: string): Record<string, string> {
  return resolvePreviewSample({ html, previewSample: {} })
}
