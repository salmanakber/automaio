import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import {
  cancelScheduledPublish,
  scheduleWebflowPublish,
} from '@/lib/campaigns/schedule-webflow-publish'

async function getCampaignForUser(campaignId: string, userId: string) {
  return prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organization: {
        OR: [
          { ownerId: userId },
          { teamMembers: { some: { userId } } },
        ],
      },
    },
    include: { organization: true },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { campaignId } = await params
    const campaign = await getCampaignForUser(campaignId, user!.id)

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const channel = req.nextUrl.searchParams.get('channel')
    const schedules = await prisma.campaignSchedule.findMany({
      where: {
        campaignId,
        ...(channel ? { channel } : {}),
      },
      orderBy: { scheduledFor: 'asc' },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { campaignId } = await params
    const body = await req.json()
    const {
      scheduledFor,
      channel,
      integrationId,
      publishSite = false,
      optimizationStrategy,
    } = body

    if (!scheduledFor || !channel) {
      return NextResponse.json({ error: 'scheduledFor and channel required' }, { status: 400 })
    }

    const validChannels = ['email', 'social', 'webflow', 'multi']
    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    const campaign = await getCampaignForUser(campaignId, user!.id)

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const scheduledDate = new Date(scheduledFor)
    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 })
    }

    if (channel === 'webflow') {
      if (!integrationId) {
        return NextResponse.json({ error: 'integrationId required for webflow channel' }, { status: 400 })
      }

      const result = await scheduleWebflowPublish({
        campaignId,
        organizationId: campaign.organizationId,
        integrationId,
        publishSite: Boolean(publishSite),
        scheduledFor: scheduledDate,
      })

      return NextResponse.json(
        { schedule: result.schedule, jobId: result.jobId },
        { status: 201 },
      )
    }

    const schedule = await prisma.campaignSchedule.create({
      data: {
        campaignId,
        scheduledFor: scheduledDate,
        channel,
        optimizationStrategy: optimizationStrategy || {},
      },
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create schedule'
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { campaignId } = await params
    const scheduleId = req.nextUrl.searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId query param required' }, { status: 400 })
    }

    const campaign = await getCampaignForUser(campaignId, user!.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const result = await cancelScheduledPublish(scheduleId, campaignId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel schedule'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { campaignId } = await params
    const { scheduleId, ...updates } = await req.json()

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId required' }, { status: 400 })
    }

    const campaign = await getCampaignForUser(campaignId, user!.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const schedule = await prisma.campaignSchedule.findFirst({
      where: { id: scheduleId, campaignId },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const updated = await prisma.campaignSchedule.update({
      where: { id: scheduleId },
      data: updates,
    })

    return NextResponse.json({ schedule: updated })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}
