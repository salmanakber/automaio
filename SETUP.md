# AI Marketing Platform - Setup Guide

## Quick Start

### 1. Database Setup

First, set up a PostgreSQL database and get your connection string.

**Environment Variables** (`.env.local`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_ai_db
NEXTAUTH_SECRET=your-super-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key (optional)
GROQ_API_KEY=your-groq-key (optional)
WEBFLOW_API_KEY=your-webflow-key (optional)
```

### 2. Initialize Database Schema

```bash
# Generate Prisma client
pnpm prisma generate

# Create migrations
pnpm prisma migrate dev --name init

# Or, if you want to push the schema directly:
pnpm prisma db push
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to start using the platform.

## Features Implemented

### ✅ Authentication
- Email/password registration and login
- Session-based authentication with HTTP-only cookies
- Protected routes with middleware

### ✅ Organization Management
- Create and manage multiple organizations
- Team member management
- Role-based access control (owner, admin, member)

### ✅ Campaign Management
- Create campaigns with industry, audience, and goals
- Campaign status tracking (draft, scheduled, active, paused, completed)
- Multi-campaign support per organization

### ✅ AI Orchestration Service
- Multi-model fallback system
- Support for:
  - OpenAI (GPT-4o, GPT-4o-mini)
  - Anthropic (Claude Opus)
  - Groq (Mixtral)
- Configurable temperature and token limits
- Automatic model switching on failure

### ✅ Campaign Content Generation
- AI-powered content generation for:
  - Email subject lines
  - Body copy
  - Call-to-action text
  - Visual descriptions
  - Headlines
- Single-click generation with fallback support

### ✅ Analytics & Performance Tracking
- Campaign performance metrics:
  - Impressions, clicks, conversions
  - Revenue tracking
  - Engagement rates
  - ROI calculation
- Daily metric tracking
- Performance summaries

### ✅ Admin Dashboard
- AI model configuration
- Global model management
- API key management

### ✅ User Interface
- Landing page with feature showcase
- Dashboard with organization overview
- Campaign builder with quick actions
- Campaign detail view with asset management
- Responsive design with Tailwind CSS

## Database Schema Highlights

### Core Tables
- **Users**: Authentication and user profiles
- **Sessions**: Session management
- **Organizations**: Workspace management
- **TeamMembers**: Organization membership and roles
- **Campaigns**: Campaign metadata and configuration

### Content & AI
- **ContentAssets**: Generated marketing content
- **CampaignTemplates**: Industry-specific templates
- **AIModelConfig**: AI provider configuration

### Operations
- **CampaignSchedules**: Scheduled campaign sends
- **FunnelPages**: Landing page management
- **WebflowIntegrations**: Webflow site connections
- **CampaignAnalytics**: Performance metrics

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Organizations
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create organization

### Campaigns
- `GET /api/campaigns?orgId=...` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[campaignId]` - Get campaign details
- `PATCH /api/campaigns/[campaignId]` - Update campaign
- `POST /api/campaigns/generate` - Generate AI content
- `GET /api/campaigns/[campaignId]/analytics` - Get analytics
- `POST /api/campaigns/[campaignId]/analytics` - Log metrics

### Content Assets
- `GET /api/content-assets?campaignId=...` - List assets
- `PUT /api/content-assets` - Update asset

### Admin
- `GET /api/admin/ai-models` - List AI models
- `POST /api/admin/ai-models` - Add AI model

## Architecture

### Frontend
- Next.js 16 with App Router
- React 19 for UI components
- Tailwind CSS for styling
- SWR for data fetching
- Custom hooks for auth and data management

### Backend
- Next.js API Routes
- Prisma ORM for database
- PostgreSQL for data persistence
- Cookie-based session management

### AI Integration
- Multi-provider support (OpenAI, Anthropic, Groq)
- Orchestrator pattern for fallback logic
- Configurable model parameters

## Next Steps

### To Build Out
1. **Webflow Integration** - API integration for landing page deployment
2. **Email Channel Integration** - Connect to email providers (Mailgun, SendGrid)
3. **Social Media Integration** - Post to Twitter, LinkedIn, Instagram
4. **Advanced Analytics** - Custom dashboards and reports
5. **A/B Testing** - Campaign variant testing
6. **Real-time Notifications** - WebSocket support
7. **File Upload** - Asset library management
8. **Payment Processing** - Stripe integration for premium features

## Troubleshooting

### Database Connection
```bash
# Test connection
pnpm prisma db execute --stdin
> SELECT 1;
```

### Missing Environment Variables
```bash
# Check current env setup
cat .env.local
```

### Prisma Issues
```bash
# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset

# Generate client
pnpm prisma generate

# View schema
pnpm prisma studio
```

## Deployment

### Vercel
```bash
# Push to GitHub and connect Vercel project
# Set environment variables in Vercel dashboard
# Database: Consider Neon, Supabase, or Vercel Postgres
```

### Self-hosted
```bash
# Build for production
pnpm build

# Run production server
pnpm start
```

## Support

For issues or questions, check:
- Prisma docs: https://prisma.io
- Next.js docs: https://nextjs.org
- AI SDK docs: https://sdk.vercel.ai
