import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncWebflowIntegration } from '@/lib/integrations/webflow'
import { syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const refresh = searchParams.get('refresh') === '1'

    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    }

    // Verify access
    const hasAccess = await prisma.organization.findFirst({
      where: {
        AND: [
          { id: orgId },
          {
            OR: [
              { ownerId: user.id },
              { teamMembers: { some: { userId: user.id } } },
            ],
          },
        ],
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let integrations = await prisma.webflowIntegration.findMany({
      where: { organizationId: orgId },
    })

    if (refresh && integrations.length > 0) {
      for (const integration of integrations) {
        try {
          await syncWebflowIntegrationV2(orgId, integration.id)
        } catch (err) {
          console.error('[Automaio] Webflow refresh failed:', integration.id, err)
        }
      }
      integrations = await prisma.webflowIntegration.findMany({
        where: { organizationId: orgId },
      })
    }

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId, webflowSiteId, webflowApiKey } = await req.json()

    if (!orgId || !webflowSiteId || !webflowApiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify access
    const hasAccess = await prisma.organization.findFirst({
      where: {
        AND: [
          { id: orgId },
          {
            OR: [
              { ownerId: user.id },
              { teamMembers: { some: { userId: user.id } } },
            ],
          },
        ],
      },
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if integration already exists
    const existing = await prisma.webflowIntegration.findFirst({
      where: {
        AND: [
          { organizationId: orgId },
          { webflowSiteId },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Integration already exists' },
        { status: 409 }
      )
    }

    // Create integration
    const integration = await prisma.webflowIntegration.create({
      data: {
        organizationId: orgId,
        webflowSiteId,
        webflowApiKey,
      },
    })

    try {
      await syncWebflowIntegrationV2(orgId, integration.id)
    } catch {
      try {
        await syncWebflowIntegration(orgId, integration.id)
      } catch (syncError) {
        console.error('[Automaio] Webflow sync error:', syncError)
      }
    }

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }
}
