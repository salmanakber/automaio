import type { CampaignTemplateData } from '@/lib/webflow/template-renderer'
import {
  getTemplateHtml,
  renderTemplateHtml,
} from '@/lib/webflow/template-renderer'
import type { TemplateStructure } from '@/lib/templates/starter-templates'

type ProjectLike = {
  name: string
  description?: string | null
  category?: string
  template?: { templateStructure: unknown } | null
  renderedHtml?: string | null
}

export function buildProjectTemplateData(
  project: ProjectLike,
  params: Record<string, string>,
): CampaignTemplateData {
  return {
    companyName: params.companyName ?? project.name,
    headline: params.headline ?? project.name,
    subheadline: params.subheadline ?? params.body ?? project.description ?? '',
    ctaText: params.ctaText ?? params.cta ?? 'Learn more',
    offer: params.offer ?? project.category ?? 'Learn more',
    location: params.location ?? params.audience ?? '',
    industry: params.industry ?? project.category ?? 'General',
    targetAudience: params.audience ?? params.targetAudience ?? '',
    description: params.body ?? project.description ?? undefined,
    year: params.year ?? String(new Date().getFullYear()),
  }
}

/** Render template HTML for a project (template + parameters). */
export function renderProjectHtml(
  project: ProjectLike,
  params: Record<string, string>,
): string {
  if (project.renderedHtml?.trim()) return project.renderedHtml

  if (!project.template) return ''

  const structure = project.template.templateStructure as TemplateStructure
  const rawHtml = getTemplateHtml(project.template.templateStructure)
  if (!rawHtml) return ''

  const templateData = buildProjectTemplateData(project, params)
  return renderTemplateHtml(rawHtml, templateData, structure.theme)
}

export function htmlToPlainSummary(html: string, maxLen = 280): string {
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}
