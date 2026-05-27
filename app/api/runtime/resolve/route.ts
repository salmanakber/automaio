import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RUNTIME_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Resolve published page ID by Webflow site + CMS item slug (runtime bootstrap fallback). */
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get('siteId')?.trim()
    const slug = req.nextUrl.searchParams.get('slug')?.trim()

    if (!siteId || !slug) {
      return NextResponse.json(
        { error: 'siteId and slug required' },
        { status: 400, headers: RUNTIME_CORS },
      )
    }

    const integration = await prisma.webflowIntegration.findFirst({
      where: { webflowSiteId: siteId },
    })

    if (!integration) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404, headers: RUNTIME_CORS })
    }

    const normalizedSlug = slugify(slug)

    const projects = await prisma.contentProject.findMany({
      where: {
        organizationId: integration.organizationId,
        OR: [{ status: 'published' }, { webflowCmsItemId: { not: null } }],
      },
      select: {
        id: true,
        name: true,
        parameters: true,
        webflowCmsItemId: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })

    const match = projects.find((project) => {
      const params = (project.parameters as Record<string, string>) ?? {}
      const paramSlug = params.slug?.trim()
      if (paramSlug && slugify(paramSlug) === normalizedSlug) return true
      return slugify(project.name) === normalizedSlug
    })

    if (!match) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404, headers: RUNTIME_CORS })
    }

    return NextResponse.json(
      { pageId: match.id, slug: normalizedSlug },
      {
        headers: {
          ...RUNTIME_CORS,
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resolve failed'
    return NextResponse.json({ error: message }, { status: 500, headers: RUNTIME_CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: RUNTIME_CORS })
}
