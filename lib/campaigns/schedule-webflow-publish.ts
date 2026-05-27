import { prisma } from '@/lib/prisma'
import { campaignScheduleQueue } from '@/lib/queue/queues'
import type { CampaignScheduleJob } from '@/lib/queue/queues'

export type WebflowScheduleInput = {
  campaignId: string
  organizationId: string
  integrationId: string
  publishSite: boolean
  scheduledFor: Date
}

export async function scheduleWebflowPublish(input: WebflowScheduleInput) {
  const { campaignId, organizationId, integrationId, publishSite, scheduledFor } = input

  const now = Date.now()
  const scheduledMs = scheduledFor.getTime()
  if (scheduledMs <= now + 30_000) {
    throw new Error('Scheduled time must be at least 1 minute in the future')
  }

  const delay = scheduledMs - now

  const schedule = await prisma.campaignSchedule.create({
    data: {
      campaignId,
      scheduledFor,
      channel: 'webflow',
      status: 'scheduled',
      optimizationStrategy: {
        type: 'webflow_publish',
        integrationId,
        publishSite,
      },
    },
  })

  const jobData: CampaignScheduleJob = {
    scheduleId: schedule.id,
    campaignId,
    organizationId,
    channel: 'webflow',
    scheduledFor,
    integrationId,
    publishSite,
  }

  const job = await campaignScheduleQueue.add('webflow-publish', jobData, { delay })

  await prisma.campaignSchedule.update({
    where: { id: schedule.id },
    data: {
      optimizationStrategy: {
        type: 'webflow_publish',
        integrationId,
        publishSite,
        bullJobId: job.id,
      },
    },
  })

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'scheduled' },
  })

  return { schedule, jobId: job.id }
}

export async function cancelScheduledPublish(scheduleId: string, campaignId: string) {
  const schedule = await prisma.campaignSchedule.findFirst({
    where: { id: scheduleId, campaignId, status: 'scheduled' },
  })

  if (!schedule) {
    throw new Error('Schedule not found or already processed')
  }

  const strategy = schedule.optimizationStrategy as {
    bullJobId?: string
  } | null

  if (strategy?.bullJobId) {
    const job = await campaignScheduleQueue.getJob(strategy.bullJobId)
    if (job) {
      const state = await job.getState()
      if (state === 'delayed' || state === 'waiting') {
        await job.remove()
      }
    }
  }

  await prisma.campaignSchedule.update({
    where: { id: scheduleId },
    data: { status: 'cancelled' },
  })

  const remaining = await prisma.campaignSchedule.count({
    where: { campaignId, status: 'scheduled', channel: 'webflow' },
  })

  if (remaining === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'draft' },
    })
  }

  return { cancelled: true }
}
