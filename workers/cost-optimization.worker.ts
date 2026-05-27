import { Worker, Job } from 'bullmq'
import redis from '@/lib/queue/redis'
import prisma from '@/lib/prisma'
import { CostOptimizationJob } from '@/lib/queue/queues'

export async function createCostOptimizationWorker() {
  const worker = new Worker<CostOptimizationJob>(
    'cost-optimization',
    async (job: Job<CostOptimizationJob>) => {
      console.log(`[Worker] Processing cost optimization: ${job.id}`)

      try {
        const { organizationId, campaignId, analysisType } = job.data

        // Determine date range based on analysis type
        const now = new Date()
        let startDate = new Date()

        if (analysisType === 'daily') {
          startDate.setDate(startDate.getDate() - 1)
        } else if (analysisType === 'weekly') {
          startDate.setDate(startDate.getDate() - 7)
        } else {
          startDate.setMonth(startDate.getMonth() - 1)
        }

        // Fetch all AI cost data
        const costs = await prisma.aICostAnalytics.findMany({
          where: {
            organizationId,
            ...(campaignId && { campaignId }),
            costDate: {
              gte: startDate,
              lte: now,
            },
          },
        })

        // Calculate total costs
        const totalCost = costs.reduce((sum, c) => sum + c.costPerCampaign?.toNumber() || 0, 0)
        const avgCostPerCampaign = costs.length > 0 ? totalCost / costs.length : 0
        const totalTokens = costs.reduce((sum, c) => sum + c.totalTokensUsed, 0)

        // Identify cost optimization opportunities
        const optimization = {
          totalCost,
          avgCostPerCampaign,
          totalTokens,
          recommendedOptimizations: [] as string[],
        }

        // Add recommendations
        if (avgCostPerCampaign > 50) {
          optimization.recommendedOptimizations.push(
            'Consider switching to more cost-effective models for non-critical campaigns'
          )
        }

        if (totalTokens > 100000) {
          optimization.recommendedOptimizations.push(
            'Enable prompt caching to reduce token usage'
          )
        }

        // Store optimization analysis
        await prisma.aICostAnalytics.create({
          data: {
            organizationId,
            ...(campaignId && { campaignId }),
            costDate: new Date(),
            totalTokensUsed: totalTokens,
            costPerToken: costs.length > 0 ? totalCost / totalTokens : 0,
            costPerCampaign: avgCostPerCampaign,
          },
        })

        // Log success
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'cost-optimizer',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            requestStatus: 'success',
          },
        })

        return {
          success: true,
          optimization,
        }
      } catch (error) {
        console.error(`[Worker] Cost optimization failed ${job.id}:`, error)
        throw error
      }
    },
    {
      connection: redis,
      concurrency: 2,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Cost optimization completed: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Cost optimization failed: ${job?.id}`, err.message)
  })

  return worker
}
