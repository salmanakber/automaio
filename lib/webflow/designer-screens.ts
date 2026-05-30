import { renderProjectHtml } from '@/lib/content/render-project-html'
import { applyLayoutControlsToHtml, parseLayoutControls } from '@/lib/webflow/layout-controls'
import {
  assembleLandingPageForWebflow,
  buildDocumentFromSplitParts,
} from '@/lib/webflow/landing-page-assembler'
import { buildWebflowSplitMethodTemplateEmbed } from '@/lib/webflow/template-embeds'
import { configTypeForHtmlMode } from '@/lib/webflow/delivery-config-type'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import { prisma } from '@/lib/prisma'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function parsePublishHtmlMode(raw: unknown): PublishHtmlMode | null {
  if (raw === 'remote_runtime' || raw === 'split_plain_text' || raw === 'iframe_embed') {
    return raw
  }
  return null
}

export type DesignerScreenSummary = {
  id: string
  name: string
  slug: string
  status: string
  configType: string
  htmlMode: PublishHtmlMode | null
  webflowCmsItemId: string | null
  updatedAt: string
  previewUrl: string
  cmsBindingSnippet: string
  seoTitle?: string
  seoDescription?: string
}

type ProjectRow = {
  id: string
  name: string
  status: string
  parameters: unknown
  webflowCmsItemId: string | null
  updatedAt: Date
}

export function buildDesignerScreenSummaries(
  projects: ProjectRow[],
  cmsBindingSnippet: string,
): DesignerScreenSummary[] {
  return projects.map((project) => {
    const params = (project.parameters as Record<string, unknown>) ?? {}
    const htmlMode = parsePublishHtmlMode(params.publishHtmlMode ?? params.lastPublishedHtmlMode)
    const slug = slugify(String(params.slug ?? project.name ?? ''))
    return {
      id: project.id,
      name: project.name,
      slug,
      status: project.status,
      configType: htmlMode ? configTypeForHtmlMode(htmlMode) : 'split_method',
      htmlMode,
      webflowCmsItemId: project.webflowCmsItemId,
      updatedAt: project.updatedAt.toISOString(),
      previewUrl: `/webflow/designer/screen/${project.id}`,
      cmsBindingSnippet,
      seoTitle: typeof params.seoTitle === 'string' ? params.seoTitle : undefined,
      seoDescription: typeof params.seoDescription === 'string' ? params.seoDescription : undefined,
    }
  })
}

/** Load one screen split preview payload (html/css/js). */
export async function loadDesignerScreenPreview(projectId: string, userId: string) {
  const project = await prisma.contentProject.findFirst({
    where: {
      id: projectId,
      organization: {
        OR: [{ ownerId: userId }, { teamMembers: { some: { userId } } }],
      },
    },
    include: { template: true },
  })

  if (!project) return null

  const params = (project.parameters as Record<string, string>) ?? {}
  let html = project.renderedHtml?.trim() || renderProjectHtml(project, params)
  const layoutControls = parseLayoutControls(params)
  html = applyLayoutControlsToHtml(html, layoutControls)
  if (!html.trim()) return null

  const assembled = assembleLandingPageForWebflow(html, {
    scopeId: project.id,
    allowJs: true,
  })

  const htmlMode = parsePublishHtmlMode(params.publishHtmlMode ?? params.lastPublishedHtmlMode)
  const configType = htmlMode ? configTypeForHtmlMode(htmlMode) : 'split_method'

  return {
    project,
    assembled,
    configType,
    htmlMode,
    documentHtml: buildDocumentFromSplitParts(assembled, project.name),
    cmsBindingSnippet: buildWebflowSplitMethodTemplateEmbed(),
  }
}
