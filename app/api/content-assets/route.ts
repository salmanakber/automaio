import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assets = await prisma.contentAsset.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Error fetching content assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, content } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
    }

    // Verify user has access to asset's campaign
    const asset = await prisma.contentAsset.findFirst({
      where: {
        id,
        campaign: {
          organization: {
            OR: [
              { ownerId: user.id },
              { teamMembers: { some: { userId: user.id } } },
            ],
          },
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const updated = await prisma.contentAsset.update({
      where: { id },
      data: { content, aiGenerated: false }, // Mark as manually edited
    })

    return NextResponse.json({ asset: updated })
  } catch (error) {
    console.error('Error updating content asset:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}
