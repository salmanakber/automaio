import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildLandingPageSchema } from '@/lib/runtime/build-page-schema'
import type { LandingPageSchema } from '@/lib/runtime/types'

type RouteParams = { params: Promise<{ pageId: string }> }

const RUNTIME_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Public runtime API — Webflow pages fetch page schema by project/page id. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { pageId } = await params
    if (!pageId?.trim()) {
      return NextResponse.json({ error: 'pageId required' }, { status: 400, headers: RUNTIME_CORS })
    }

    const project = await prisma.contentProject.findUnique({
      where: { id: pageId },
      include: { template: { select: { name: true, templateStructure: true } } },
    })

    if (!project) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404, headers: RUNTIME_CORS })
    }

    if (project.status !== 'published' && !project.webflowCmsItemId) {
      return NextResponse.json({ error: 'Page not published yet' }, { status: 403, headers: RUNTIME_CORS })
    }

    const params_ = (project.parameters as Record<string, unknown>) ?? {}
    let schema: LandingPageSchema

    const stored = params_.pageSchema
    if (typeof stored === 'string' && stored.trim()) {
      try {
        schema = JSON.parse(stored) as LandingPageSchema
        if (!schema.render?.htmlContent) {
          schema = buildLandingPageSchema(project)
        }
      } catch {
        schema = buildLandingPageSchema(project)
      }
    } else {
      schema = buildLandingPageSchema(project)
    }

    return NextResponse.json(schema, {
      headers: {
        ...RUNTIME_CORS,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runtime fetch failed'
    return NextResponse.json({ error: message }, { status: 500, headers: RUNTIME_CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: RUNTIME_CORS })
}
