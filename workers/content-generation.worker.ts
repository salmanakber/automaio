import { Worker, Job } from 'bullmq'
import redis from '@/lib/queue/redis'
import prisma from '@/lib/prisma'
import { ContentGenerationJob } from '@/lib/queue/queues'
import { orchestrateAI } from '@/lib/ai/orchestrator'

export async function createContentGenerationWorker() {
  const worker = new Worker<ContentGenerationJob>(
    'content-generation',
    async (job: Job<ContentGenerationJob>) => {
      console.log(`[Worker] Processing content generation: ${job.id}`)

      try {
        const { campaignId, assetType, prompt, aiModel } = job.data

        // Generate content using AI orchestrator
        const generatedContent = await orchestrateAI(
          prompt,
          aiModel || 'gpt-4o-mini',
          2000
        )

        // Store the generated asset
        const asset = await prisma.contentAsset.create({
          data: {
            campaignId,
            assetType: assetType as any,
            content: generatedContent,
            aiGenerated: true,
          },
        })

        // Log success
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: aiModel || 'gpt-4o-mini',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: generatedContent.length,
            requestStatus: 'success',
            campaignId,
          },
        })

        return {
          success: true,
          assetId: asset.id,
          content: generatedContent,
        }
      } catch (error) {
        console.error(`[Worker] Error generating content ${job.id}:`, error)

        // Log failure
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'content-generator',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            failureReason: (error as Error).message,
            requestStatus: 'failed',
            campaignId: job.data.campaignId,
          },
        })

        throw error
      }
    },
    {
      connection: redis,
      concurrency: 5, // Process 5 content generation jobs in parallel
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Content generation completed: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Content generation failed: ${job?.id}`, err.message)
  })

  return worker
}
