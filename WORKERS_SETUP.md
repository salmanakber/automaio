# BullMQ Worker Setup Guide

## Overview

This application uses **BullMQ** with **ioredis** for managing background jobs. Workers process campaigns, generate content, schedule tasks, and optimize costs asynchronously.

## Installation

All dependencies are already installed:
- `bullmq` - Job queue library
- `ioredis` - Redis client
- `express` - Worker health check server
- `tsx` - TypeScript execution
- `concurrently` - Run multiple processes

## Architecture

### Queues (8 Total)

1. **campaign-generation** - Generate full campaigns (Priority: 10)
2. **content-generation** - Generate individual content assets (Priority: 8)
3. **campaign-schedule** - Execute scheduled campaigns (Priority: 9)
4. **analytics** - Process campaign analytics (Priority: 5)
5. **webflow-sync** - Sync with Webflow (Priority: 7)
6. **prompt-optimization** - Optimize prompts (Priority: 6)
7. **cost-optimization** - Optimize AI costs (Priority: 4)
8. **trend-analysis** - Analyze trends (Priority: 5)

### Workers (6 Implemented)

- `campaign-generation.worker.ts` - Processes campaign generation jobs (concurrency: 3)
- `content-generation.worker.ts` - Generates content assets (concurrency: 5)
- `campaign-schedule.worker.ts` - Executes scheduled campaigns (concurrency: 2)
- `analytics.worker.ts` - Processes analytics (concurrency: 5)
- `webflow-sync.worker.ts` - Manages Webflow syncing (concurrency: 2)
- `cost-optimization.worker.ts` - Optimizes costs (concurrency: 2)

## Running Workers

### Development Mode (with hot reload)
```bash
pnpm run worker:dev
```
This runs both the Next.js app and worker server with file watching.

### Production Mode (worker only)
```bash
pnpm run worker:start
```

### Background Mode
```bash
pnpm run worker:background
```

## Environment Variables

```env
# Redis Connection
REDIS_URL=redis://localhost:6379

# Worker Server Port
WORKER_PORT=3001
```

## Job Structure

### Campaign Generation Job
```typescript
{
  campaignId: string
  organizationId: string
  industry: string
  targetAudience: string
  goals: string[]
}
```

### Content Generation Job
```typescript
{
  campaignId: string
  assetType: 'headline' | 'body_copy' | 'cta' | 'subject_line' | 'visual_description'
  prompt: string
  aiModel?: string
}
```

### Campaign Schedule Job
```typescript
{
  scheduleId: string
  campaignId: string
  organizationId: string
  channel: string // 'email' | 'social' | 'webflow' | 'multi'
  scheduledFor: Date
}
```

### Analytics Job
```typescript
{
  campaignId: string
  startDate: Date
  endDate: Date
}
```

## API Endpoints

### Enqueue a Job
**POST** `/api/queue/jobs`
```json
{
  "jobType": "campaign-generation",
  "data": {
    "campaignId": "...",
    "organizationId": "...",
    "industry": "SaaS",
    "targetAudience": "B2B",
    "goals": ["engagement", "conversion"]
  }
}
```

### Check Queue Status
**GET** `/api/queue/jobs?queue=campaign-generation`

Response:
```json
{
  "queueName": "campaign-generation",
  "counts": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 0,
    "delayed": 0
  }
}
```

## Adding Jobs from Your Code

```typescript
import { campaignGenerationQueue, addJob } from '@/lib/queue/queues'

// Enqueue a campaign generation job
await addJob(campaignGenerationQueue, 'generate', {
  campaignId: 'campaign-123',
  organizationId: 'org-456',
  industry: 'SaaS',
  targetAudience: 'B2B',
  goals: ['engagement', 'conversion'],
})

// With delay (schedule for later)
await addJob(campaignGenerationQueue, 'generate', data, {
  delay: 5000, // 5 seconds
})

// Recurring job
await addJob(analyticsQueue, 'process', data, {
  repeat: { pattern: '0 0 * * *' }, // Daily at midnight
})
```

## Job Retry Configuration

All jobs are configured with:
- **Max Attempts**: 3
- **Backoff**: Exponential (2s initial, doubles each attempt)
- **Auto-remove**: On completion
- **Stalled Timeout**: 30 seconds

## Monitoring

### Queue Health Check
**GET** `/health` (Worker Server)

Response:
```json
{
  "status": "healthy",
  "workers": {
    "campaign-generation": {
      "isPaused": false,
      "isRunning": true,
      "currentJobsCount": 2
    }
  }
}
```

### Queue Status Dashboard
Access at `/admin/queue-management` in the application.

Shows:
- Jobs waiting/active/completed/failed per queue
- Real-time job counts
- Worker status
- Instructions to start workers

## Database Integration

All workers integrate with Prisma:
- Store generated content in `ContentAsset`
- Log job execution in `AIObservabilityLog`
- Update campaign status and analytics
- Track performance metrics

## Error Handling

Failed jobs:
- Automatically retried up to 3 times
- Logged in `AIObservabilityLog` with error reason
- Failed status updated in database
- Can be manually retried through queue management UI

## Best Practices

1. **Keep jobs small** - Break large operations into smaller jobs
2. **Use priorities** - Critical jobs get higher priority
3. **Monitor queues** - Check queue management dashboard regularly
4. **Set proper timeouts** - Jobs have implicit 30-second locks
5. **Log everything** - All jobs logged to AIObservabilityLog
6. **Handle failures** - Check failed jobs and retry manually if needed

## Troubleshooting

### Workers not processing jobs
1. Check Redis connection: `REDIS_URL` env var
2. Verify worker server is running: `pnpm run worker:start`
3. Check `/health` endpoint on worker server
4. Review worker logs for errors

### Jobs stuck in "active" state
1. Worker process crashed - restart workers
2. Job timeout - increase job timeout in queue config
3. Stalled job - auto-recovered after 30 seconds

### High memory usage
1. Reduce concurrency in worker configuration
2. Process completed jobs faster
3. Monitor with `pnpm run worker --profile`

## Production Deployment

1. Set `REDIS_URL` to production Redis instance
2. Run workers in separate process/container
3. Set up monitoring and alerting
4. Enable job persistence
5. Configure scaling based on queue depth

```bash
# Production startup
REDIS_URL=redis://prod-redis:6379 \
WORKER_PORT=3001 \
node --max-old-space-size=2048 server/worker-server.ts
```

## Next Steps

1. Implement missing job processors (prompt optimization, trend analysis)
2. Add WebSocket support for real-time job status
3. Create job scheduling UI
4. Add job retry management dashboard
5. Implement job rate limiting per organization
