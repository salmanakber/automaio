import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { previewCampaignHtml } from '@/lib/integrations/webflow-cms'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { campaignId } = await params

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

    const preview = await previewCampaignHtml(campaignId)
    return NextResponse.json(preview)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Preview failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
