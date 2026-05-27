import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderProjectHtml } from '@/lib/content/render-project-html'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
}

/** Resolve published HTML by Webflow site + CMS item slug (used by auto-embed script). */
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')
  const slug = req.nextUrl.searchParams.get('slug')
  const collectionId = req.nextUrl.searchParams.get('collectionId')

  if (!siteId || !slug) {
    return NextResponse.json(
      { error: 'siteId and slug required' },
      { status: 400, headers: corsHeaders },
    )
  }

  const integration = await prisma.webflowIntegration.findFirst({
    where: { webflowSiteId: siteId },
  })

  if (!integration) {
    return NextResponse.json({ html: '', found: false }, { headers: corsHeaders })
  }

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

  const normalizedSlug = slug.toLowerCase()
  const project = projects.find((p) => {
    const params = (p.parameters as Record<string, string> | null) ?? {}
    const projectSlug = (params.slug ?? p.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return projectSlug === normalizedSlug
  })

  if (project) {
    const params = (project.parameters as Record<string, string>) ?? {}
    const html = project.renderedHtml ?? renderProjectHtml(project, params)
    return NextResponse.json(
      { html: html ?? '', found: true, projectId: project.id, name: project.name },
      { headers: corsHeaders },
    )
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      organizationId: integration.organizationId,
      webflowCmsItemId: { not: null },
    },
    include: { template: true },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  const campaign = campaigns.find((c) => {
    const campaignSlug = c.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return campaignSlug === normalizedSlug
  })

  if (campaign?.renderedHtml) {
    return NextResponse.json(
      {
        html: campaign.renderedHtml,
        found: true,
        campaignId: campaign.id,
        name: campaign.name,
      },
      { headers: corsHeaders },
    )
  }

  return NextResponse.json({ html: '', found: false }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
