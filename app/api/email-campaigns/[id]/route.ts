import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { scheduleEmailCampaign } from '@/lib/campaigns/schedule-content'
import { sendBulkEmail } from '@/lib/email/send-email'

type RouteParams = { params: Promise<{ id: string }> }

async function getEmailCampaign(id: string, userId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { schedules: { orderBy: { scheduledFor: 'desc' } } },
  })
  if (!campaign) return null
  await requireOrgAccessByUserId(userId, campaign.organizationId)
  return campaign
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const campaign = await getEmailCampaign(id, user.id)
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ campaign })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await getEmailCampaign(id, user.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        htmlBody: body.htmlBody,
        frequency: body.frequency,
        status: body.status,
      },
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const action = new URL(req.url).searchParams.get('action')

  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await getEmailCampaign(id, user.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'schedule') {
      const body = await req.json()
      const result = await scheduleEmailCampaign({
        emailCampaignId: id,
        organizationId: existing.organizationId,
        scheduledFor: new Date(body.scheduledFor),
        frequency: body.frequency ?? existing.frequency,
      })
      return NextResponse.json(result, { status: 201 })
    }

    if (action === 'send-now') {
      const subscribers = await prisma.emailSubscriber.findMany({
        where: { organizationId: existing.organizationId, status: 'active' },
      })

      if (subscribers.length === 0) {
        return NextResponse.json({ error: 'No active subscribers' }, { status: 400 })
      }

      const results = await sendBulkEmail(
        subscribers.map((s) => s.email),
        existing.subject,
        existing.htmlBody,
      )

      const sent = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok).length

      await prisma.emailCampaign.update({
        where: { id },
        data: { status: failed === 0 ? 'completed' : 'active' },
      })

      return NextResponse.json({ sent, failed, results })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
