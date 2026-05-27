import { Worker, Job } from 'bullmq'
import redis from '@/lib/queue/redis'
import prisma from '@/lib/prisma'
import { WebflowSyncJob } from '@/lib/queue/queues'
import { syncWebflowCollections, deployToWebflow } from '@/lib/integrations/webflow'

export async function createWebflowSyncWorker() {
  const worker = new Worker<WebflowSyncJob>(
    'webflow-sync',
    async (job: Job<WebflowSyncJob>) => {
      console.log(`[Worker] Processing Webflow sync: ${job.id}`)

      try {
        const { integrationId, organizationId, action } = job.data

        // Fetch integration details
        const integration = await prisma.webflowIntegration.findUnique({
          where: { id: integrationId },
        })

        if (!integration) {
          throw new Error(`Webflow integration not found: ${integrationId}`)
        }

        let result: any = {}

        if (action === 'sync') {
          // Sync Webflow collections
          result = await syncWebflowCollections(integration.webflowApiKey, integration.webflowSiteId)

          // Update integration with synced collections
          await prisma.webflowIntegration.update({
            where: { id: integrationId },
            data: {
              collections: result,
              syncedAt: new Date(),
            },
          })
        } else if (action === 'deploy') {
          // Deploy campaign to Webflow
          console.log(`[Worker] Deploying campaign to Webflow: ${integration.webflowSiteId}`)
          // TODO: Implement deployment logic
        } else if (action === 'update') {
          // Update existing Webflow page
          console.log(`[Worker] Updating Webflow content`)
          // TODO: Implement update logic
        }

        // Log success
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'webflow-sync',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            requestStatus: 'success',
            webflowSyncStatus: 'completed',
          },
        })

        return {
          success: true,
          integrationId,
          action,
          result,
        }
      } catch (error) {
        console.error(`[Worker] Webflow sync failed ${job.id}:`, error)

        // Log failure
        await prisma.aIObservabilityLog.create({
          data: {
            requestId: job.id || '',
            modelName: 'webflow-sync',
            latencyMs: Date.now() - job.timestamp,
            tokenCount: 0,
            failureReason: (error as Error).message,
            requestStatus: 'failed',
            webflowSyncStatus: 'failed',
          },
        })

        throw error
      }
    },
    {
      connection: redis,
      concurrency: 2,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Webflow sync completed: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Webflow sync failed: ${job?.id}`, err.message)
  })

  return worker
}
