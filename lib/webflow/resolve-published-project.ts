import { prisma } from '@/lib/prisma'
import { renderProjectHtml } from '@/lib/content/render-project-html'
import { applyLayoutControlsToHtml, parseLayoutControls } from '@/lib/webflow/layout-controls'
import { assembleLandingPageForWebflow } from '@/lib/webflow/landing-page-assembler'
import { buildProjectIframeUrl } from '@/lib/webflow/embed-page'
import { getAppBaseUrl } from '@/lib/app-url'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Find a published landing project on a Webflow site by CMS slug. */
export async function resolvePublishedProjectBySiteSlug(siteId: string, slug: string) {
  const integration = await prisma.webflowIntegration.findFirst({
    where: { webflowSiteId: siteId },
  })
  if (!integration) return null

  const normalized = slugify(slug)
  if (!normalized) return null

  const projects = await prisma.contentProject.findMany({
    where: {
      webflowIntegrationId: integration.id,
      status: 'published',
      contentType: { not: 'blog_post' },
    },
    include: { template: true },
    orderBy: { updatedAt: 'desc' },
    take: 80,
  })

  return (
    projects.find((p) => {
      const params = (p.parameters as Record<string, string> | null) ?? {}
      const projectSlug = slugify(params.slug?.trim() || p.name || '')
      return projectSlug === normalized
    }) ?? null
  )
}

export async function getSplitDeliveryPayload(siteId: string, slug: string) {
  const project = await resolvePublishedProjectBySiteSlug(siteId, slug)
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

  return {
    projectId: project.id,
    html: assembled.htmlContent,
    css: assembled.cssContent,
    js: assembled.jsContent,
  }
}

export async function getIframeDeliveryPayload(siteId: string, slug: string) {
  const project = await resolvePublishedProjectBySiteSlug(siteId, slug)
  if (!project) return null

  const appUrl = getAppBaseUrl()
  return {
    projectId: project.id,
    url: buildProjectIframeUrl(appUrl, project.id),
  }
}
