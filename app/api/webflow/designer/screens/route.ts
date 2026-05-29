import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { buildWebflowSplitMethodTemplateEmbed } from '@/lib/webflow/template-embeds'
import {
  buildDesignerScreenSummaries,
  type DesignerScreenSummary,
} from '@/lib/webflow/designer-screens'

/** List published landing screens for a Webflow site (Designer extension). */
export async function GET(req: NextRequest) {
  try {
    const { user, response: authResponse } = await requireUser(req)
    if (authResponse) return authResponse

    const siteId = req.nextUrl.searchParams.get('siteId')?.trim()
    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 })
    }

    const integration = await prisma.webflowIntegration.findFirst({
      where: {
        webflowSiteId: siteId,
        organization: {
          OR: [{ ownerId: user.id }, { teamMembers: { some: { userId: user.id } } }],
        },
      },
    })

    if (!integration) {
      return NextResponse.json({ screens: [], siteId, integrationFound: false })
    }

    const projects = await prisma.contentProject.findMany({
      where: {
        webflowIntegrationId: integration.id,
        contentType: { not: 'blog_post' },
        OR: [{ status: 'published' }, { webflowCmsItemId: { not: null } }],
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    const cmsBindingSnippet = buildWebflowSplitMethodTemplateEmbed()
    const screens: DesignerScreenSummary[] = buildDesignerScreenSummaries(projects, cmsBindingSnippet)

    return NextResponse.json({
      siteId,
      integrationFound: true,
      integrationId: integration.id,
      siteName: integration.siteName,
      screens,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load screens'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
