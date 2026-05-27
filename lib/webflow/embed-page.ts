import { prisma } from '@/lib/prisma'
import { renderProjectHtml } from '@/lib/content/render-project-html'
import { applyLayoutControlsToHtml, parseLayoutControls } from '@/lib/webflow/layout-controls'
import { extractHeadAssets } from '@/lib/webflow/html-assets'

export const EMBED_RESIZE_SCRIPT = `(function(){function h(){var x=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);if(window.parent!==window)window.parent.postMessage({type:"automaio-embed-resize",height:x},"*");}window.addEventListener("load",h);if(typeof ResizeObserver!=="undefined")new ResizeObserver(h).observe(document.body);h();})();`

export function buildProjectIframeUrl(baseUrl: string, projectId: string) {
  return `${baseUrl.replace(/\/$/, '')}/webflow/embed/project/${encodeURIComponent(projectId)}`
}

export function buildSlugIframeUrl(baseUrl: string, siteId: string, slug: string) {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/webflow/embed/view?siteId=${encodeURIComponent(siteId)}&slug=${encodeURIComponent(slug)}`
}

/**
 * Extract just the meaningful body content from full template HTML.
 * Strips: <nav>, <header> (nav-like), <footer>, and full-document wrappers.
 * Keeps: all <style> blocks and the inner content sections.
 */
function extractCleanBody(html: string): { headAssets: string; inlineStyles: string; body: string } {
  const trimmed = html.trim()
  const headAssets = extractHeadAssets(trimmed)

  const styleBlocks = [...trimmed.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[0])
  const inlineStyles = styleBlocks.join('\n')

  let body = trimmed
  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) {
    body = bodyMatch[1].trim()
  } else if (/<!DOCTYPE|<html[\s>]/i.test(trimmed)) {
    body = trimmed
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .trim()
  }

  body = body.replace(/<nav[\s\S]*?<\/nav>/gi, '')
  body = body.replace(/<header[\s\S]*?<\/header>/gi, '')
  body = body.replace(/<footer[\s\S]*?<\/footer>/gi, '')

  return { headAssets, inlineStyles, body: body.trim() }
}

export function buildEmbedHtmlDocument(contentHtml: string, title = 'Automaio') {
  if (!contentHtml?.trim()) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>html,body{margin:0;padding:0;}</style>
  <script>${EMBED_RESIZE_SCRIPT}<\/script>
</head>
<body>
  <p style="font-family:system-ui;padding:2rem;color:#64748b;text-align:center">No content yet. Publish from the Automaio dashboard.</p>
</body>
</html>`
  }

  const { headAssets, inlineStyles, body } = extractCleanBody(contentHtml)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  ${headAssets}
  ${inlineStyles}
  <style>html,body{margin:0;padding:0;background:transparent;}</style>
  <script>${EMBED_RESIZE_SCRIPT}<\/script>
</head>
<body>${body}</body>
</html>`
}

export async function getProjectEmbedHtml(projectId: string) {
  const project = await prisma.contentProject.findUnique({
    where: { id: projectId },
    include: { template: true },
  })
  if (!project) return null

  const params = (project.parameters as Record<string, string>) ?? {}
  let html = project.renderedHtml ?? renderProjectHtml(project, params)
  const layoutControls = parseLayoutControls(params)
  html = applyLayoutControlsToHtml(html ?? '', layoutControls)
  return { html: html ?? '', name: project.name }
}

export async function getSlugEmbedHtml(siteId: string, slug: string, collectionId?: string) {
  const integration = await prisma.webflowIntegration.findFirst({
    where: { webflowSiteId: siteId },
  })
  if (!integration) return null

  const normalizedSlug = slug.toLowerCase()
  const projects = await prisma.contentProject.findMany({
    where: {
      webflowIntegrationId: integration.id,
      status: 'published',
      ...(collectionId ? { cmsCollectionId: collectionId } : {}),
    },
    include: { template: true },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const project = projects.find((p) => {
    const params = (p.parameters as Record<string, string> | null) ?? {}
    const projectSlug = (params.slug ?? p.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return projectSlug === normalizedSlug
  })

  if (!project) return null

  const params = (project.parameters as Record<string, string>) ?? {}
  const html = project.renderedHtml ?? renderProjectHtml(project, params)
  return { html: html ?? '', name: project.name, projectId: project.id }
}

export function embedHtmlResponse(html: string, title?: string) {
  return new Response(buildEmbedHtmlDocument(html, title), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Content-Security-Policy': 'frame-ancestors *',
      'X-Frame-Options': 'ALLOWALL',
    },
  })
}
