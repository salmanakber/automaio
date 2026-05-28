import { renderProjectHtml } from '@/lib/content/render-project-html'
import { tagTextElements, groupElementsBySection } from '@/lib/ai/dom-patcher'
import { assembleLandingPageForWebflow } from '@/lib/webflow/landing-page-assembler'
import { applyThemeToHtml, resolveTemplateTheme } from '@/lib/templates/theme'
import type { TemplateStructure } from '@/lib/templates/starter-templates'
import type { LandingPageSchema, LandingPageSection, LandingPageSectionType } from '@/lib/runtime/types'

type ProjectLike = {
  id: string
  name: string
  templateId?: string | null
  renderedHtml?: string | null
  parameters?: unknown
  template?: { templateStructure: unknown; name?: string } | null
}

function sectionTypeFromKey(key: string): LandingPageSectionType {
  const allowed: LandingPageSectionType[] = [
    'hero',
    'features',
    'testimonials',
    'faq',
    'pricing',
    'cta',
    'contact',
    'footer',
  ]
  if (allowed.includes(key as LandingPageSectionType)) return key as LandingPageSectionType
  return 'custom'
}

function buildSectionsFromHtml(html: string): LandingPageSection[] {
  const { elements } = tagTextElements(html)
  const groups = groupElementsBySection(elements)
  const sections: LandingPageSection[] = []

  for (const [key, els] of Object.entries(groups)) {
    if (key === 'general' && els.length === 0) continue

    const content: Record<string, string> = {}
    els.forEach((el, idx) => {
      const fieldKey =
        el.tag === 'h1' || el.tag === 'h2'
          ? 'title'
          : el.tag === 'h3'
            ? `heading_${idx}`
            : el.tag === 'p'
              ? `text_${idx}`
              : el.tag === 'a' || el.tag === 'button'
                ? 'cta'
                : `text_${idx}`
      if (!content[fieldKey] || fieldKey.startsWith('text_') || fieldKey.startsWith('heading_')) {
        content[fieldKey] = el.text
      }
    })

    if (Object.keys(content).length === 0) continue

    sections.push({
      id: `${key}-${sections.length}`,
      type: sectionTypeFromKey(key),
      content,
    })
  }

  return sections
}

/** Build platform-side page schema from a project (source of truth for runtime). */
export function buildLandingPageSchema(project: ProjectLike, htmlOverride?: string): LandingPageSchema {
  const params = (project.parameters as Record<string, string>) ?? {}
  const html =
    htmlOverride?.trim() ||
    project.renderedHtml?.trim() ||
    renderProjectHtml(project, params)

  const structure = project.template?.templateStructure as TemplateStructure | undefined
  const theme = resolveTemplateTheme(structure)
  const htmlWithTheme = applyThemeToHtml(html, theme)

  const assembled = assembleLandingPageForWebflow(htmlWithTheme, {
    scopeId: project.id,
    allowJs: true,
  })

  const sections = buildSectionsFromHtml(htmlWithTheme)

  return {
    version: 1,
    pageId: project.id,
    templateId: project.templateId ?? null,
    templateSlug: project.template?.name ?? params.templateSlug ?? null,
    seo: {
      title: params.seoTitle ?? project.name,
      description: params.seoDescription ?? params.body ?? undefined,
    },
    sections,
    render: {
      scopeClass: assembled.scopeClass,
      htmlContent: assembled.htmlContent,
      cssContent: assembled.cssContent,
      jsContent: assembled.jsContent,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function buildRuntimeConfigJson(pageId: string): string {
  return JSON.stringify({ v: 1, pageId })
}
