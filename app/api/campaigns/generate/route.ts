import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCampaignContent } from '@/lib/ai/campaign-generator'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await req.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Campaign not found or forbidden' }, { status: 403 })
    }

    // Generate content using AI
    const generatedAssets = await generateCampaignContent({
      name: campaign.name,
      industry: campaign.industry,
      targetAudience: campaign.targetAudience,
      goals: campaign.goals,
      organizationId: campaign.organizationId,
    })

    // Save generated content to database
    const savedAssets = await Promise.all(
      generatedAssets.map((asset) =>
        prisma.contentAsset.create({
          data: {
            campaignId,
            assetType: asset.assetType,
            content: asset.content,
            aiGenerated: true,
          },
        })
      )
    )

    return NextResponse.json({ assets: savedAssets }, { status: 201 })
  } catch (error) {
    console.error('Error generating content:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate content'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
