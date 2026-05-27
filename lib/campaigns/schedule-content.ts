import { prisma } from '@/lib/prisma'
import { campaignScheduleQueue } from '@/lib/queue/queues'
import type { CampaignScheduleJob } from '@/lib/queue/queues'
import { getNextScheduleDate } from '@/lib/content/publish-project'

export type ProjectScheduleInput = {
  projectId: string
  organizationId: string
  scheduledFor: Date
  frequency?: string
  publishSite?: boolean
}

export async function scheduleContentProject(input: ProjectScheduleInput) {
  const { projectId, organizationId, scheduledFor, frequency = 'once', publishSite = false } =
    input

  const now = Date.now()
  const scheduledMs = scheduledFor.getTime()
  if (scheduledMs <= now + 30_000) {
    throw new Error('Scheduled time must be at least 1 minute in the future')
  }

  const delay = scheduledMs - now

  const project = await prisma.contentProject.findUnique({ where: { id: projectId } })
  if (!project) throw new Error('Project not found')

  const schedule = await prisma.projectSchedule.create({
    data: {
      projectId,
      scheduledFor,
      frequency,
      status: 'scheduled',
      optimizationStrategy: {
        type: 'project_publish',
        publishSite,
        organizationId,
      },
    },
  })

  const jobData: CampaignScheduleJob = {
    scheduleId: schedule.id,
    campaignId: projectId,
    organizationId,
    channel: 'project',
    scheduledFor,
    publishSite,
  }

  const job = await campaignScheduleQueue.add('project-publish', jobData, { delay })

  await prisma.projectSchedule.update({
    where: { id: schedule.id },
    data: {
      optimizationStrategy: {
        type: 'project_publish',
        publishSite,
        organizationId,
        bullJobId: job.id,
      },
    },
  })

  await prisma.contentProject.update({
    where: { id: projectId },
    data: { status: 'scheduled', scheduledFor, publishSite },
  })

  return { schedule, jobId: job.id }
}

export async function scheduleEmailCampaign(input: {
  emailCampaignId: string
  organizationId: string
  scheduledFor: Date
  frequency?: string
}) {
  const { emailCampaignId, organizationId, scheduledFor, frequency = 'once' } = input

  const now = Date.now()
  const scheduledMs = scheduledFor.getTime()
  if (scheduledMs <= now + 30_000) {
    throw new Error('Scheduled time must be at least 1 minute in the future')
  }

  const delay = scheduledMs - now

  const schedule = await prisma.emailSchedule.create({
    data: {
      emailCampaignId,
      scheduledFor,
      frequency,
      status: 'scheduled',
      optimizationStrategy: { type: 'email_send', organizationId },
    },
  })

  const jobData: CampaignScheduleJob = {
    scheduleId: schedule.id,
    campaignId: emailCampaignId,
    organizationId,
    channel: 'email',
    scheduledFor,
  }

  const job = await campaignScheduleQueue.add('email-send', jobData, { delay })

  await prisma.emailSchedule.update({
    where: { id: schedule.id },
    data: {
      optimizationStrategy: {
        type: 'email_send',
        organizationId,
        bullJobId: job.id,
        frequency,
      },
    },
  })

  await prisma.emailCampaign.update({
    where: { id: emailCampaignId },
    data: { status: 'scheduled', nextSendAt: scheduledFor, frequency },
  })

  return { schedule, jobId: job.id }
}

export async function rescheduleRecurringProject(scheduleId: string) {
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    include: { project: true },
  })
  if (!schedule || schedule.frequency === 'once') return null

  const nextDate = getNextScheduleDate(schedule.scheduledFor, schedule.frequency)
  if (!nextDate) return null

  const strategy = schedule.optimizationStrategy as {
    publishSite?: boolean
    organizationId?: string
  } | null

  return scheduleContentProject({
    projectId: schedule.projectId,
    organizationId: strategy?.organizationId ?? schedule.project.organizationId,
    scheduledFor: nextDate,
    frequency: schedule.frequency,
    publishSite: strategy?.publishSite ?? schedule.project.publishSite,
  })
}

export async function rescheduleRecurringEmail(scheduleId: string) {
  const schedule = await prisma.emailSchedule.findUnique({
    where: { id: scheduleId },
    include: { emailCampaign: true },
  })
  if (!schedule || schedule.frequency === 'once') return null

  const nextDate = getNextScheduleDate(schedule.scheduledFor, schedule.frequency)
  if (!nextDate) return null

  return scheduleEmailCampaign({
    emailCampaignId: schedule.emailCampaignId,
    organizationId: schedule.emailCampaign.organizationId,
    scheduledFor: nextDate,
    frequency: schedule.frequency,
  })
}
