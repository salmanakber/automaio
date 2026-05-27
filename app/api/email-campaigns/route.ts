import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    await requireOrgAccess(user, orgId)

    const campaigns = await prisma.emailCampaign.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      include: {
        schedules: {
          where: { status: 'scheduled' },
          orderBy: { scheduledFor: 'asc' },
          take: 3,
        },
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch email campaigns'
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, name, subject, htmlBody, frequency = 'once', campaignId } = body

    if (!organizationId || !name || !subject || !htmlBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await requireOrgAccess(user, organizationId)

    const campaign = await prisma.emailCampaign.create({
      data: {
        organizationId,
        name,
        subject,
        htmlBody,
        frequency,
        campaignId: campaignId || null,
        createdById: user.id,
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create email campaign'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
