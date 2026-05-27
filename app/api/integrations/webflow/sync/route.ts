import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { integrationId } = await req.json()
    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId required' }, { status: 400 })
    }

    const integration = await prisma.webflowIntegration.findFirst({
      where: {
        id: integrationId,
        organization: {
          OR: [
            { ownerId: user!.id },
            { teamMembers: { some: { userId: user!.id } } },
          ],
        },
      },
    })

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const result = await syncWebflowIntegrationV2(integration.organizationId, integrationId)
    const refreshed = await prisma.webflowIntegration.findUnique({ where: { id: integrationId } })

    return NextResponse.json({ ...result, integration: refreshed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
