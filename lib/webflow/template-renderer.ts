import type { TemplateStructure } from '@/lib/templates/starter-templates'
import { applyThemeToHtml, resolveTemplateTheme } from '@/lib/templates/theme'

/** Re-export — publish path uses real campaign data, not preview samples. */
export { renderTemplatePreview, renderStructurePreview } from '@/lib/templates/preview'

export type CampaignTemplateData = {
  companyName?: string
  headline?: string
  subheadline?: string
  ctaText?: string
  offer?: string
  location?: string
  industry?: string
  targetAudience?: string
  description?: string
  year?: string
}

export function buildCampaignTemplateData(campaign: {
  name: string
  description?: string | null
  industry: string
  targetAudience: string
  goals?: string[]
}): CampaignTemplateData {
  return {
    companyName: campaign.name,
    headline: campaign.name,
    subheadline: campaign.description ?? campaign.targetAudience,
    ctaText: 'Get started',
    offer: campaign.goals?.[0] ?? 'Learn more',
    location: campaign.targetAudience,
    industry: campaign.industry,
    targetAudience: campaign.targetAudience,
    description: campaign.description ?? undefined,
    year: String(new Date().getFullYear()),
  }
}

const PLACEHOLDER_MAP: Record<string, keyof CampaignTemplateData> = {
  '{{company_name}}': 'companyName',
  '{{headline}}': 'headline',
  '{{subheadline}}': 'subheadline',
  '{{cta_text}}': 'ctaText',
  '{{offer}}': 'offer',
  '{{location}}': 'location',
  '{{year}}': 'year',
}

export function renderTemplateHtml(
  html: string,
  data: CampaignTemplateData,
  theme?: TemplateStructure['theme'],
): string {
  let output = applyThemeToHtml(html, resolveTemplateTheme({ theme }))

  for (const [token, key] of Object.entries(PLACEHOLDER_MAP)) {
    const value = data[key]
    if (value != null) {
      output = output.replaceAll(token, value)
    }
  }

  return output
}

export function getTemplateHtml(templateStructure: unknown): string {
  if (!templateStructure || typeof templateStructure !== 'object') return ''
  const structure = templateStructure as TemplateStructure
  return structure.html ?? ''
}
