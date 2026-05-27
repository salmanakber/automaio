import { Worker, Job } from 'bullmq'
import redis from '@/lib/queue/redis'
import prisma from '@/lib/prisma'
import { CampaignGenerationJob } from '@/lib/queue/queues'
import { generateCampaign } from '@/lib/ai/campaign-generator'

export async function createCampaignGenerationWorker() {
  const worker = new Worker<CampaignGenerationJob>(
    'campaign-generation',
    async (job: Job<CampaignGenerationJob>) => {
      console.log(`[Worker] Processing campaign generation: ${job.id}`)

      try {
        const { campaignId, organizationId, industry, targetAudience, goals } = job.data

        // Update campaign status
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: 'active',
          },
        })

        // Generate campaign content using AI
        const generatedContent = await generateCampaign({
          industry,
          targetAudience,
          goals,
          organizationId,
        })

        // Store generated content in database
        if (generatedContent) {
          await prisma.contentAsset.createMany({
            data: generatedContent.map((asset) => ({
              campaignId,
              assetType: asset.type as any,
              content: asset.content,
              aiGenerated: true,
            })),
          })
        }

        // Log success
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'campaign-generator',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            requestStatus: 'success',
            campaignId,
          },
        })

        return {
          success: true,
          campaignId,
          assetsGenerated: generatedContent?.length || 0,
        }
      } catch (error) {
        console.error(`[Worker] Error processing campaign ${job.id}:`, error)

        // Log failure
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'campaign-generator',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            failureReason: (error as Error).message,
            requestStatus: 'failed',
          },
        })

        throw error
      }
    },
    {
      connection: redis,
      concurrency: 3, // Process 3 jobs in parallel
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Campaign generation completed: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Campaign generation failed: ${job?.id}`, err.message)
  })

  return worker
}
