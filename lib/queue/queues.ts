import { Queue } from 'bullmq'
import redis from './redis'

// Define all job types
export interface CampaignGenerationJob {
  campaignId: string
  organizationId: string
  industry: string
  targetAudience: string
  goals: string[]
}

export interface ContentGenerationJob {
  campaignId: string
  assetType: 'headline' | 'body_copy' | 'cta' | 'subject_line' | 'visual_description'
  prompt: string
  aiModel?: string
}

export interface CampaignScheduleJob {
  scheduleId: string
  campaignId: string
  organizationId: string
  channel: string
  scheduledFor: Date
  integrationId?: string
  publishSite?: boolean
}

export interface AnalyticsJob {
  campaignId: string
  startDate: Date
  endDate: Date
}

export interface WebflowSyncJob {
  integrationId: string
  organizationId: string
  action: 'sync' | 'deploy' | 'update'
}

export interface PromptOptimizationJob {
  promptId: string
  organizationId: string
  performanceData: any
}

export interface CostOptimizationJob {
  organizationId: string
  campaignId?: string
  analysisType: 'daily' | 'weekly' | 'monthly'
}

export interface TrendAnalysisJob {
  industry: string
  organizationId?: string
  timeRange: 'daily' | 'weekly' | 'monthly'
}

// Queue factory with proper configuration
const createQueue = <T>(
  name: string,
  options?: {
    defaultJobOptions?: any
    settings?: any
  }
) => {
  return new Queue<T>(name, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      ...options?.defaultJobOptions,
    },
    settings: {
      stalledInterval: 5000,
      maxStalledCount: 2,
      lockDuration: 30000,
      lockRenewTime: 15000,
      ...options?.settings,
    },
  })
}

// Initialize all queues
export const campaignGenerationQueue = createQueue<CampaignGenerationJob>(
  'campaign-generation',
  {
    defaultJobOptions: {
      priority: 10,
    },
  }
)

export const contentGenerationQueue = createQueue<ContentGenerationJob>(
  'content-generation',
  {
    defaultJobOptions: {
      priority: 8,
    },
  }
)

export const campaignScheduleQueue = createQueue<CampaignScheduleJob>(
  'campaign-schedule',
  {
    defaultJobOptions: {
      priority: 9,
    },
  }
)

export const analyticsQueue = createQueue<AnalyticsJob>('analytics', {
  defaultJobOptions: {
    priority: 5,
  },
})

export const webflowSyncQueue = createQueue<WebflowSyncJob>('webflow-sync', {
  defaultJobOptions: {
    priority: 7,
  },
})

export const promptOptimizationQueue = createQueue<PromptOptimizationJob>(
  'prompt-optimization',
  {
    defaultJobOptions: {
      priority: 6,
    },
  }
)

export const costOptimizationQueue = createQueue<CostOptimizationJob>(
  'cost-optimization',
  {
    defaultJobOptions: {
      priority: 4,
    },
  }
)

export const trendAnalysisQueue = createQueue<TrendAnalysisJob>('trend-analysis', {
  defaultJobOptions: {
    priority: 5,
  },
})

// Export all queues
export const allQueues = [
  campaignGenerationQueue,
  contentGenerationQueue,
  campaignScheduleQueue,
  analyticsQueue,
  webflowSyncQueue,
  promptOptimizationQueue,
  costOptimizationQueue,
  trendAnalysisQueue,
]

// Helper to add jobs to queues
export async function addJob<T>(
  queue: Queue<T>,
  jobName: string,
  data: T,
  options?: {
    delay?: number
    priority?: number
    repeat?: { pattern: string }
  }
) {
  try {
    const job = await queue.add(jobName, data, {
      ...options,
    })
    console.log(`[Queue] Job added: ${jobName} (ID: ${job.id})`)
    return job
  } catch (error) {
    console.error(`[Queue] Failed to add job: ${jobName}`, error)
    throw error
  }
}

// Health check for queues
export async function checkQueuesHealth() {
  const health: Record<string, any> = {}

  for (const queue of allQueues) {
    try {
      const counts = await queue.getJobCounts()
      health[queue.name] = {
        status: 'healthy',
        ...counts,
      }
    } catch (error) {
      health[queue.name] = {
        status: 'unhealthy',
        error: (error as Error).message,
      }
    }
  }

  return health
}
