import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const body = await req.json()

    const integration = await prisma.webflowIntegration.findFirst({
      where: {
        id,
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

    const updated = await prisma.webflowIntegration.update({
      where: { id },
      data: {
        ...(body.campaignsCollectionId != null
          ? { campaignsCollectionId: body.campaignsCollectionId }
          : {}),
        ...(body.templatesCollectionId != null
          ? { templatesCollectionId: body.templatesCollectionId }
          : {}),
        ...(body.cmsFieldMapping != null ? { cmsFieldMapping: body.cmsFieldMapping } : {}),
      },
    })

    if (body.sync) {
      await syncWebflowIntegrationV2(integration.organizationId, id)
    }

    return NextResponse.json({ integration: updated })
  } catch (error) {
    console.error('[Automaio] Webflow integration update error:', error)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params

    const integration = await prisma.webflowIntegration.findFirst({
      where: {
        id,
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

    await prisma.webflowIntegration.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
  }
}
