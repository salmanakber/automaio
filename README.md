# AI-Powered Marketing Campaign Platform

A production-ready, enterprise-grade AI-powered marketing campaign platform built with Next.js, Prisma, PostgreSQL, and BullMQ. Generate, optimize, schedule, and deploy AI-powered marketing campaigns across multiple channels with real-time analytics and intelligence.

## Features

### Core Marketing Features
- **Multi-Channel Campaign Management** - Create and manage campaigns across email, social media, Webflow, and more
- **AI-Powered Content Generation** - Generate headlines, copy, CTAs, and visual descriptions using multiple AI models
- **Smart Campaign Scheduling** - Schedule campaigns with BullMQ background processing
- **Campaign Analytics** - Real-time performance tracking with engagement and conversion metrics
- **Webflow Integration** - Direct integration with Webflow for landing page creation and publishing

### Advanced Intelligence Features
- **Template Intelligence** - Learn from campaign performance and suggest improvements
- **Campaign Intelligence** - AI analysis of what works and why with predictive insights
- **Revenue Intelligence** - Track MRR, churn, and subscription metrics
- **AI Cost Optimization** - Monitor and optimize AI API costs with automatic model switching
- **Prompt Intelligence** - Track prompt performance and discover better patterns
- **Campaign Simulation** - Run what-if scenarios before launching campaigns
- **Trend Intelligence** - Identify emerging trends relevant to your industry

### Admin & Operations
- **13 Dedicated Admin Modules** - Complete control over system settings, AI models, compliance, and more
- **Multi-Tenant Agency Support** - White-label client management with custom branding
- **Compliance Layer** - Automatic content safety checks and regional compliance
- **Growth Lab** - Run A/B tests and multivariate experiments
- **Automation Rules** - Create if-this-then-that automation workflows
- **Queue Management Dashboard** - Monitor background jobs in real-time

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with full-text search
- **Background Jobs**: BullMQ with Redis
- **AI Models**: OpenAI, Anthropic, Groq (with automatic fallback)
- **Authentication**: Custom JWT-based auth with bcrypt
- **External APIs**: Webflow, Multiple AI providers

## Getting Started

### Prerequisites
- Node.js 18+ (pnpm)
- PostgreSQL 13+
- Redis 6+

### Installation

1. **Clone and install dependencies**
```bash
git clone <repo>
cd marketing-ai-platform
pnpm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

3. **Set up the database**
```bash
# Create database
createdb marketing_ai_db

# Run migrations
pnpm prisma migrate dev
```

4. **Start development servers**
```bash
# In terminal 1: Next.js app
pnpm dev

# In terminal 2: Background workers
pnpm run worker

# Or run both together
pnpm run worker:dev
```

5. **Access the platform**
- Main app: http://localhost:3000
- Sign up at `/auth/signup`
- Admin dashboard at `/admin`
- Queue management at `/admin/queue-management`

## Project Structure

```
├── app/
│   ├── admin/                    # 25+ admin dashboard pages
│   ├── api/                      # 50+ API endpoints
│   ├── auth/                     # Authentication flows
│   ├── dashboard/                # User dashboards
│   └── page.tsx                  # Landing page
├── lib/
│   ├── ai/                       # AI orchestration
│   ├── queue/                    # Queue configuration
│   ├── integrations/             # External integrations
│   ├── validators/               # Input validation schemas
│   ├── auth.ts                   # Authentication utilities
│   ├── error-handler.ts          # Error handling
│   └── logger.ts                 # Logging utility
├── workers/                      # Background job processors
├── prisma/
│   └── schema.prisma             # Database schema
├── middleware.ts                 # Route protection
└── components/                   # Reusable UI components
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PUT /api/campaigns/[id]` - Update campaign
- `POST /api/campaigns/[id]/generate` - Generate content

### Organization
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/[id]` - Get org details

### Intelligence
- `GET /api/intelligence/templates` - Template performance data
- `GET /api/intelligence/campaign-analysis` - Campaign analysis
- `GET /api/intelligence/ai-costs` - Cost analytics
- `GET /api/intelligence/prompts` - Prompt intelligence
- `GET /api/intelligence/trends` - Trend data
- `GET /api/intelligence/simulations` - Simulation results

### Queue Management
- `GET /api/queue/jobs` - List all jobs
- `POST /api/queue/jobs` - Enqueue new job
- `DELETE /api/queue/jobs/[id]` - Cancel job

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint details.

## Configuration

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection URL
- `NEXTAUTH_SECRET` - JWT secret
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `ANTHROPIC_API_KEY` - Claude API key
- `GROQ_API_KEY` - Groq API key
- `WEBFLOW_API_KEY` - Webflow API key
- `SMTP_*` - Email configuration

See [.env.example](./.env.example) for all options.

## Running Workers

### Development (with hot reload)
```bash
pnpm run worker:dev
```

### Production (separate processes)
```bash
# Terminal 1
pnpm start

# Terminal 2
REDIS_URL=redis://... pnpm run worker:start
```

### Monitor queue
```bash
# Open browser to
http://localhost:3000/admin/queue-management
```

## Admin Dashboard

Access all admin features at `/admin`:

1. **AI Engine Management** - Configure AI models and fallbacks
2. **Prompt & Template Engine** - Manage system prompts
3. **Webflow Bridge** - Manage Webflow integrations
4. **Campaign Monitoring** - Track campaign performance
5. **User Management** - Manage users and roles
6. **Template Marketplace** - Template approval and pricing
7. **Scheduling Engine** - Campaign scheduling rules
8. **Analytics Dashboard** - System-wide analytics
9. **System Configuration** - Feature flags and settings
10. **Billing Management** - Stripe integration
11. **Logs & Debugging** - API and system logs
12. **Security & Access** - Auth and audit logs
13. **Queue Management** - Background job monitoring

Plus 13 advanced intelligence modules for campaign, template, revenue, cost, and prompt analysis.

## Database Schema

The platform uses 20 Prisma models organized into logical groups:

- **Core**: User, Organization, TeamMember, Session
- **Campaigns**: Campaign, CampaignTemplate, CampaignSchedule
- **Content**: ContentAsset, ContentAssetLibrary
- **Analytics**: CampaignAnalytics, TemplatePerformance, SubscriptionMetrics
- **Intelligence**: CampaignIntelligence, PromptIntelligence, TrendData
- **Optimization**: AICostAnalytics, CampaignSimulation
- **Advanced**: Experiment, AutomationRule, ComplianceRule, AgencyClient

All tables include proper indexing, timestamps, and relationships.

## Background Jobs

BullMQ queues configured:

| Queue | Priority | Concurrency | Purpose |
|-------|----------|-------------|---------|
| Campaign Generation | 10 | 3 | Create new campaigns |
| Content Generation | 8 | 5 | Generate content assets |
| Campaign Schedule | 9 | 2 | Execute scheduled campaigns |
| Analytics Processing | 5 | 5 | Process analytics data |
| Webflow Sync | 7 | 2 | Sync with Webflow |
| Cost Optimization | 4 | 2 | Optimize AI costs |
| Prompt Evolution | 6 | 2 | Improve prompts |
| Cleanup | 1 | 1 | Cleanup old data |

## Security

- Password hashing with bcrypt
- JWT token-based authentication
- Row-level security (RLS) patterns in API
- Input validation with Zod schemas
- CSRF protection via middleware
- Rate limiting on API routes
- Secure session management with HTTP-only cookies

## Performance

- Database query optimization with Prisma
- Redis caching for frequently accessed data
- BullMQ for non-blocking job processing
- Connection pooling
- Compression and minification
- Lazy loading of components

## Monitoring & Logging

- Structured logging with context
- Request/response tracking
- Error tracking and reporting
- Job status monitoring
- Real-time queue dashboard

## Development Guidelines

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:
- Code style and standards
- Testing strategies
- Debugging techniques
- Contributing guidelines

## Deployment

### Vercel (Recommended)
```bash
pnpm build
pnpm start
# Configure Redis and PostgreSQL URLs in Vercel dashboard
```

### Docker
```bash
docker-compose up -d
pnpm build
pnpm start
```

### Environment Setup
See [DEPLOYMENT.md](./DEPLOYMENT.md) for production configuration.

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - 5-minute quick start
- [SETUP.md](./SETUP.md) - Complete installation guide
- [WORKERS_SETUP.md](./WORKERS_SETUP.md) - Worker configuration
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Architecture overview
- [ADVANCED_FEATURES_COMPLETE.md](./ADVANCED_FEATURES_COMPLETE.md) - Feature details

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL
psql postgresql://user:password@localhost:5432/marketing_ai_db

# Reset migrations
pnpm prisma migrate reset
```

### Worker Issues
```bash
# Ensure Redis is running
redis-cli ping

# Check worker logs
pnpm run worker 2>&1 | grep -i error
```

### API Errors
Enable debug logging:
```bash
LOG_LEVEL=debug pnpm dev
```

## Performance Optimization Tips

1. **Database**: Use indexes for frequently queried fields
2. **Caching**: Redis for session/frequently accessed data
3. **Workers**: Adjust concurrency based on server capacity
4. **API**: Batch requests where possible
5. **UI**: Use React Server Components for static content

## Support

For issues, questions, or feature requests:
1. Check documentation files
2. Review example code in components/
3. Check database schema in prisma/schema.prisma
4. Enable debug logging

## License

Proprietary - All rights reserved

## Changelog

### v1.0.0 (Initial Release)
- Core campaign management
- AI content generation with 3 model support
- Webflow integration
- Analytics dashboard
- 13 advanced intelligence modules
- Background job processing
- Multi-tenant support
- Compliance layer
- Growth lab for experiments
