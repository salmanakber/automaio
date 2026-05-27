import { Worker, Job } from 'bullmq'
import redis from '@/lib/queue/redis'
import prisma from '@/lib/prisma'
import { CampaignScheduleJob } from '@/lib/queue/queues'
import { publishCampaignToWebflowCms } from '@/lib/integrations/webflow-cms'
import { publishContentProject } from '@/lib/content/publish-project'
import { sendBulkEmail } from '@/lib/email/send-email'
import {
  rescheduleRecurringEmail,
  rescheduleRecurringProject,
} from '@/lib/campaigns/schedule-content'

export async function createCampaignScheduleWorker() {
  const worker = new Worker<CampaignScheduleJob>(
    'campaign-schedule',
    async (job: Job<CampaignScheduleJob>) => {
      console.log(`[Worker] Processing campaign schedule: ${job.id}`)

      try {
        const { scheduleId, campaignId, channel, integrationId, publishSite, organizationId } =
          job.data

        if (channel === 'project') {
          const schedule = await prisma.projectSchedule.findUnique({
            where: { id: scheduleId },
          })
          if (!schedule || schedule.status === 'cancelled') {
            return { success: false, skipped: true, reason: 'cancelled' }
          }

          await publishContentProject(campaignId, { publishSite })

          await prisma.projectSchedule.update({
            where: { id: scheduleId },
            data: { status: 'sent' },
          })

          if (schedule.frequency !== 'once') {
            await rescheduleRecurringProject(scheduleId)
          }

          return { success: true, channel: 'project', projectId: campaignId }
        }

        if (channel === 'email') {
          const schedule = await prisma.emailSchedule.findUnique({
            where: { id: scheduleId },
            include: { emailCampaign: true },
          })
          if (!schedule || schedule.status === 'cancelled') {
            return { success: false, skipped: true, reason: 'cancelled' }
          }

          const emailCampaign = schedule.emailCampaign
          const orgId = organizationId ?? emailCampaign.organizationId

          const subscribers = await prisma.emailSubscriber.findMany({
            where: { organizationId: orgId, status: 'active' },
          })

          if (subscribers.length === 0) {
            throw new Error('No active subscribers for email campaign')
          }

          const results = await sendBulkEmail(
            subscribers.map((s) => s.email),
            emailCampaign.subject,
            emailCampaign.htmlBody,
          )

          const failed = results.filter((r) => !r.ok).length
          if (failed === results.length) {
            throw new Error('All email sends failed')
          }

          await prisma.emailSchedule.update({
            where: { id: scheduleId },
            data: { status: 'sent' },
          })

          await prisma.emailCampaign.update({
            where: { id: emailCampaign.id },
            data: { status: schedule.frequency === 'once' ? 'completed' : 'active' },
          })

          if (schedule.frequency !== 'once') {
            await rescheduleRecurringEmail(scheduleId)
          }

          return {
            success: true,
            channel: 'email',
            sent: results.filter((r) => r.ok).length,
            failed,
          }
        }

        const schedule = await prisma.campaignSchedule.findUnique({
          where: { id: scheduleId },
        })

        if (!schedule || schedule.status === 'cancelled') {
          return { success: false, skipped: true, reason: 'cancelled' }
        }

        if (channel === 'social') {
          console.log(`[Worker] Publishing to social: ${campaignId}`)
        } else if (channel === 'webflow') {
          const strategy = schedule.optimizationStrategy as {
            integrationId?: string
            publishSite?: boolean
          } | null

          const webflowIntegrationId = integrationId ?? strategy?.integrationId
          if (!webflowIntegrationId) {
            throw new Error('Missing integrationId for scheduled Webflow publish')
          }

          await publishCampaignToWebflowCms(campaignId, webflowIntegrationId, {
            publishSite: publishSite ?? strategy?.publishSite ?? false,
          })

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'active' },
          })
        }

        await prisma.campaignSchedule.update({
          where: { id: scheduleId },
          data: { status: 'sent' },
        })

        await prisma.campaignAnalytics.create({
          data: {
            campaignId,
            metricDate: new Date(),
            impressions: 0,
          },
        })

        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'campaign-schedule',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            requestStatus: 'success',
            campaignId,
          },
        })

        return {
          success: true,
          scheduleId,
          campaignId,
          channel,
          sentAt: new Date(),
        }
      } catch (error) {
        console.error(`[Worker] Error scheduling campaign ${job.id}:`, error)

        const { scheduleId, channel } = job.data

        if (channel === 'project') {
          await prisma.projectSchedule.update({
            where: { id: scheduleId },
            data: { status: 'failed' },
          }).catch(() => {})
        } else if (channel === 'email') {
          await prisma.emailSchedule.update({
            where: { id: scheduleId },
            data: { status: 'failed' },
          }).catch(() => {})
        } else {
          await prisma.campaignSchedule.update({
            where: { id: scheduleId },
            data: { status: 'failed' },
          }).catch(() => {})
        }

        throw error
      }
    },
    {
      connection: redis,
      concurrency: 2,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Campaign scheduled: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Campaign schedule failed: ${job?.id}`, err.message)
  })

  return worker
}
