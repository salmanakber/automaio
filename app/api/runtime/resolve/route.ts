import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import {
  extractPageIdFromCmsFields,
  pickRuntimeCollectionIds,
  slugify,
} from '@/lib/webflow/resolve-page-id'

const RUNTIME_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function resolveFromWebflowCms(
  integration: {
    webflowApiKey: string
    templatesCollectionId: string | null
    campaignsCollectionId: string | null
    collections: unknown
  },
  slug: string,
  collectionIdHint?: string | null,
) {
  const client = new WebflowClient(integration.webflowApiKey)
  const collectionIds = pickRuntimeCollectionIds(integration, collectionIdHint)

  for (const collectionId of collectionIds) {
    try {
      let item = await client.findLiveCollectionItemBySlug(collectionId, slug)
      if (!item) {
        item = await client.findStagedCollectionItemBySlug(collectionId, slug)
      }
      if (!item?.fieldData) continue

      const pageId = extractPageIdFromCmsFields(item.fieldData)
      if (pageId) {
        return { pageId, cmsItemId: item.id, collectionId, source: 'webflow_cms' as const }
      }
    } catch {
      // Try next collection
    }
  }

  return null
}

function resolveFromAutomaioDb(
  projects: Array<{
    id: string
    name: string
    parameters: unknown
    webflowCmsItemId: string | null
  }>,
  normalizedSlug: string,
) {
  const match = projects.find((project) => {
    const params = (project.parameters as Record<string, string>) ?? {}
    const paramSlug = params.cmsSlug?.trim() || params.slug?.trim()
    if (paramSlug && slugify(paramSlug) === normalizedSlug) return true
    return slugify(project.name) === normalizedSlug
  })

  if (!match) return null
  return { pageId: match.id, cmsItemId: match.webflowCmsItemId, source: 'automaio_db' as const }
}

/** Resolve published page ID by Webflow site + CMS item slug. */
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get('siteId')?.trim()
    const slug = req.nextUrl.searchParams.get('slug')?.trim()
    const collectionIdHint = req.nextUrl.searchParams.get('collectionId')?.trim()

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

    // 1) Webflow CMS is source of truth — read page-id from the item with this slug
    const cmsMatch = await resolveFromWebflowCms(integration, slug, collectionIdHint)
    if (cmsMatch) {
      return NextResponse.json(
        { pageId: cmsMatch.pageId, slug: normalizedSlug, source: cmsMatch.source },
        {
          headers: {
            ...RUNTIME_CORS,
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
          },
        },
      )
    }

    // 2) Fallback — Automaio DB slug/name match
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

    const dbMatch = resolveFromAutomaioDb(projects, normalizedSlug)
    if (dbMatch) {
      return NextResponse.json(
        { pageId: dbMatch.pageId, slug: normalizedSlug, source: dbMatch.source },
        {
          headers: {
            ...RUNTIME_CORS,
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
          },
        },
      )
    }

    return NextResponse.json(
      {
        error: `No page found for slug "${slug}". Publish this item from Automaio so Page ID is saved to Webflow CMS, or create the CMS item from Automaio (not manually in Webflow).`,
      },
      { status: 404, headers: RUNTIME_CORS },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resolve failed'
    return NextResponse.json({ error: message }, { status: 500, headers: RUNTIME_CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: RUNTIME_CORS })
}
