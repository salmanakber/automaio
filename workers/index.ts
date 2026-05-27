import { Worker } from 'bullmq'
import { createCampaignGenerationWorker } from './campaign-generation.worker'
import { createContentGenerationWorker } from './content-generation.worker'
import { createCampaignScheduleWorker } from './campaign-schedule.worker'
import { createAnalyticsWorker } from './analytics.worker'
import { createWebflowSyncWorker } from './webflow-sync.worker'
import { createCostOptimizationWorker } from './cost-optimization.worker'
import redis from '@/lib/queue/redis'

// Worker registry
const workers: Worker[] = []

export async function startAllWorkers() {
  console.log('[Workers] Starting all workers...')

  try {
    // Create and start all workers
    const campaignWorker = await createCampaignGenerationWorker()
    const contentWorker = await createContentGenerationWorker()
    const scheduleWorker = await createCampaignScheduleWorker()
    const analyticsWorker = await createAnalyticsWorker()
    const webflowWorker = await createWebflowSyncWorker()
    const costWorker = await createCostOptimizationWorker()

    workers.push(campaignWorker, contentWorker, scheduleWorker, analyticsWorker, webflowWorker, costWorker)

    console.log(`[Workers] Started ${workers.length} workers successfully`)

    // Setup graceful shutdown
    setupGracefulShutdown()
  } catch (error) {
    console.error('[Workers] Failed to start workers:', error)
    throw error
  }
}

export async function stopAllWorkers() {
  console.log('[Workers] Stopping all workers...')

  for (const worker of workers) {
    await worker.close()
  }

  console.log('[Workers] All workers stopped')
}

function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    console.log(`[Workers] Received ${signal}, shutting down gracefully...`)
    await stopAllWorkers()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

// Health check
export async function getWorkersHealth() {
  const health: Record<string, any> = {}

  for (const worker of workers) {
    health[worker.name] = {
      isPaused: worker.isPaused(),
      isRunning: worker.isRunning(),
      currentJobsCount: worker.currentJobsCount,
    }
  }

  return health
}

// Export worker creator functions for direct use
export {
  createCampaignGenerationWorker,
  createContentGenerationWorker,
  createCampaignScheduleWorker,
  createAnalyticsWorker,
  createWebflowSyncWorker,
  createCostOptimizationWorker,
}
