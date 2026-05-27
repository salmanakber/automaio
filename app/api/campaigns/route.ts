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
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    }

    // Check if user has access to this organization
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

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contentAssets: true, campaignAnalytics: true },
        },
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, industry, targetAudience, goals, organizationId, templateId } =
      await req.json()

    // Validate required fields
    if (!name || !industry || !targetAudience || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check user access
    const hasAccess = await prisma.organization.findFirst({
      where: {
        AND: [
          { id: organizationId },
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

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        industry,
        targetAudience,
        goals: goals || [],
        organizationId,
        createdById: user.id,
        templateId: templateId || null,
      },
      include: { template: true },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
