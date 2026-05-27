import { Worker, Job } from 'bullmq'
import redis from '@/lib/queue/redis'
import prisma from '@/lib/prisma'
import { AnalyticsJob } from '@/lib/queue/queues'

export async function createAnalyticsWorker() {
  const worker = new Worker<AnalyticsJob>(
    'analytics',
    async (job: Job<AnalyticsJob>) => {
      console.log(`[Worker] Processing analytics: ${job.id}`)

      try {
        const { campaignId, startDate, endDate } = job.data

        // Fetch campaign data
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: {
            campaignAnalytics: {
              where: {
                metricDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        })

        if (!campaign) {
          throw new Error(`Campaign not found: ${campaignId}`)
        }

        // Calculate metrics
        const totalImpressions = campaign.campaignAnalytics.reduce((sum, a) => sum + (a.impressions || 0), 0)
        const totalClicks = campaign.campaignAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0)
        const totalConversions = campaign.campaignAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0)
        const totalRevenue = campaign.campaignAnalytics.reduce((sum, a) => sum + (a.revenue?.toNumber() || 0), 0)

        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
        const roi = totalRevenue > 0 ? ((totalRevenue - 100) / 100) * 100 : 0 // Assume $100 cost

        // Update or create intelligence record
        await prisma.campaignIntelligence.upsert({
          where: { campaignId },
          update: {
            ctaEffectiveness: conversionRate,
            engagementToConversion: ctr,
          },
          create: {
            campaignId,
            ctaEffectiveness: conversionRate,
            engagementToConversion: ctr,
          },
        })

        // Log success
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'analytics-processor',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            requestStatus: 'success',
            campaignId,
          },
        })

        return {
          success: true,
          campaignId,
          metrics: {
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
            revenue: totalRevenue,
            ctr,
            conversionRate,
            roi,
          },
        }
      } catch (error) {
        console.error(`[Worker] Error processing analytics ${job.id}:`, error)
        throw error
      }
    },
    {
      connection: redis,
      concurrency: 5, // Process 5 analytics jobs in parallel
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Analytics processed: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Analytics failed: ${job?.id}`, err.message)
  })

  return worker
}
