import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { publishCampaignToWebflowCms } from '@/lib/integrations/webflow-cms'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { campaignId } = await params
    const { integrationId, publishSite } = await req.json()

    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId required' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organization: {
          OR: [
            { ownerId: user!.id },
            { teamMembers: { some: { userId: user!.id } } },
          ],
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const result = await publishCampaignToWebflowCms(campaignId, integrationId, {
      publishSite: Boolean(publishSite),
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
