# Quick Reference Guide

## 🚀 Start Here

### First Time Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with:
# - DATABASE_URL=postgresql://...
# - REDIS_URL=redis://localhost:6379

# 3. Run migrations (when database is ready)
pnpm prisma migrate deploy

# 4. Start development
pnpm run worker:dev  # Starts both app and workers
```

## 📋 Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Next.js app only |
| `pnpm worker:dev` | Start app + workers with hot reload |
| `pnpm worker:start` | Start workers only (production) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production build |
| `pnpm lint` | Run ESLint |

## 🗄️ Key Files

### Queue System
- `lib/queue/redis.ts` - Redis connection
- `lib/queue/queues.ts` - Queue definitions and factory
- `workers/index.ts` - Worker manager

### Workers (6 types)
- `workers/campaign-generation.worker.ts`
- `workers/content-generation.worker.ts`
- `workers/campaign-schedule.worker.ts`
- `workers/analytics.worker.ts`
- `workers/webflow-sync.worker.ts`
- `workers/cost-optimization.worker.ts`

### Admin Pages (25+)
- `/admin/queue-management` - Monitor jobs
- `/admin/ai-engine` - AI models
- `/admin/campaign-intelligence` - Analytics
- Plus 22 more...

## 📊 Job Queues

```typescript
import { 
  campaignGenerationQueue,
  contentGenerationQueue,
  campaignScheduleQueue,
  analyticsQueue,
  addJob 
} from '@/lib/queue/queues'

// Enqueue a job
await addJob(campaignGenerationQueue, 'generate', {
  campaignId: '...',
  organizationId: '...',
  industry: 'SaaS',
  targetAudience: 'B2B',
  goals: ['engagement']
})
```

## 🔗 API Endpoints

### Queue Management
- `POST /api/queue/jobs` - Enqueue job
- `GET /api/queue/jobs?queue=campaign-generation` - Check status

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign
- `POST /api/campaigns/generate` - Generate content

### Intelligence
- `GET /api/intelligence/templates` - Template insights
- `GET /api/intelligence/campaign-analysis` - Campaign analysis
- `GET /api/intelligence/ai-costs` - Cost analysis
- Plus 10 more...

## 🔒 Authentication

```typescript
import { validateSession } from '@/lib/auth'

// In API routes
const session = await validateSession(token)
if (!session) return 401
```

## 📡 Monitoring

### Queue Status
```bash
# Check queue health
curl http://localhost:3000/api/queue/jobs?queue=campaign-generation

# Check worker health  
curl http://localhost:3001/health
```

### Dashboard
- Admin → Queue Management (`/admin/queue-management`)
- Shows real-time job counts
- Displays worker status
- Instructions to start workers

## 💾 Database Models

### Core (10)
- User, Session, Organization, TeamMember
- Campaign, CampaignTemplate, ContentAsset
- CampaignSchedule, FunnelPage, CampaignAnalytics

### Intelligence (13)
- TemplatePerformance, CampaignIntelligence
- SubscriptionMetrics, AICostAnalytics
- PromptIntelligence, CampaignSimulation
- AgencyClient, AIObservabilityLog
- TrendData, ContentAssetLibrary
- Experiment, AutomationRule, ComplianceRule

### Support (5)
- WebflowIntegration, AIModelConfig
- CampaignSchedule, FunnelPage, CampaignAnalytics

## 🔑 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# Worker
WORKER_PORT=3001

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

## 📖 Documentation Files

- `QUICKSTART.md` - 5-minute setup
- `SETUP.md` - Complete setup guide
- `WORKERS_SETUP.md` - Worker configuration
- `PROJECT_SUMMARY.md` - Architecture overview
- `FINAL_BUILD_SUMMARY.md` - Complete build info
- `ADVANCED_FEATURES_COMPLETE.md` - Feature details

## 🆘 Troubleshooting

### Workers Not Running
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Start workers
pnpm run worker:start

# Check worker health
curl http://localhost:3001/health
```

### Jobs Not Processing
1. Verify `REDIS_URL` is set
2. Check worker logs for errors
3. Monitor queue: `curl http://localhost:3000/api/queue/jobs?queue=campaign-generation`
4. Check database connection

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

## 🚢 Deployment

### Environment
```bash
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."
export WORKER_PORT=3001
```

### Run
```bash
# Build
pnpm build

# Start app
pnpm start &

# Start workers (separate terminal/process)
pnpm run worker:start &
```

### Verify
```bash
curl http://localhost:3001/health  # Workers
curl http://localhost:3000/api/queue/jobs  # Queue status
```

## 📚 Architecture

```
User Request
    ↓
Next.js API Route
    ↓
Enqueue Job (BullMQ + Redis)
    ↓
Worker Processor
    ↓
Process Job (AI, DB, Integrations)
    ↓
Store Results (Prisma)
    ↓
Update Status (WebSocket/Poll)
```

## 🎯 Common Tasks

### Generate Campaign Content
```typescript
await addJob(campaignGenerationQueue, 'generate', {
  campaignId,
  organizationId,
  industry: 'SaaS',
  targetAudience: 'B2B',
  goals: ['engagement', 'conversion']
})
```

### Schedule Campaign
```typescript
await addJob(campaignScheduleQueue, 'schedule', {
  scheduleId,
  campaignId,
  organizationId,
  channel: 'email',
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
})
```

### Process Analytics
```typescript
await addJob(analyticsQueue, 'process', {
  campaignId,
  startDate: new Date('2024-01-01'),
  endDate: new Date()
})
```

## ✅ Verification Checklist

- [ ] Redis running on `REDIS_URL`
- [ ] PostgreSQL running on `DATABASE_URL`
- [ ] Dependencies installed: `pnpm install`
- [ ] App starts: `pnpm run dev`
- [ ] Workers start: `pnpm run worker:start`
- [ ] Queue dashboard accessible: `/admin/queue-management`
- [ ] Worker health: `curl http://localhost:3001/health`
- [ ] Can enqueue jobs: `curl -X POST http://localhost:3000/api/queue/jobs`

---

**Your platform is ready! Start with `pnpm run worker:dev` 🚀**
