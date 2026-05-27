import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccess } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { WebflowClient } from '@/lib/integrations/webflow-client'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const integrationId = req.nextUrl.searchParams.get('integrationId')
    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId required' }, { status: 400 })
    }

    const integration = await prisma.webflowIntegration.findUnique({
      where: { id: integrationId },
    })
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccess(user, integration.organizationId)

    const client = new WebflowClient(integration.webflowApiKey)
    const pages = await client.listPages(integration.webflowSiteId)

    return NextResponse.json({
      pages: pages
        .filter((p) => !p.collectionId)
        .map((p) => ({ id: p.id, title: p.title ?? 'Untitled page' })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list pages'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
