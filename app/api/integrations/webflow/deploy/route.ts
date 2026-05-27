import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deployCampaignToWebflow } from '@/lib/integrations/webflow'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, webflowIntegrationId, collectionId } = await req.json()

    if (!campaignId || !webflowIntegrationId || !collectionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        AND: [
          { id: campaignId },
          {
            organization: {
              OR: [
                { ownerId: user.id },
                { teamMembers: { some: { userId: user.id } } },
              ],
            },
          },
        ],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify integration belongs to same organization
    const integration = await prisma.webflowIntegration.findFirst({
      where: {
        AND: [
          { id: webflowIntegrationId },
          { organizationId: campaign.organizationId },
        ],
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Deploy campaign
    const result = await deployCampaignToWebflow(
      campaignId,
      webflowIntegrationId,
      collectionId
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error deploying campaign:', error)
    const message = error instanceof Error ? error.message : 'Failed to deploy campaign'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
