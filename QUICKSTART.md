# AI Marketing Platform - Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for at least one AI provider:
  - OpenAI (recommended): https://platform.openai.com/api-keys
  - Anthropic (optional): https://console.anthropic.com
  - Groq (optional): https://console.groq.com

## Installation (5 minutes)

### 1. Clone or download the project
```bash
cd /your/project/directory
```

### 2. Install dependencies
```bash
pnpm install
# or npm install / yarn install
```

### 3. Set up environment variables
Create `.env.local` in the project root:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/marketing_ai_db

# Authentication
NEXTAUTH_SECRET=generate-a-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# AI Models (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # optional
GROQ_API_KEY=gsk-...          # optional

# Integrations (optional)
WEBFLOW_API_KEY=your-webflow-api-key
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Set up the database
```bash
# Create database schema
pnpm prisma db push

# Or run migrations
pnpm prisma migrate deploy
```

### 5. Start the development server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Create an Account
- Click "Get Started" or go to `/auth/signup`
- Enter email and password
- You'll be redirected to the dashboard

### 2. Create an Organization
- Click "+ New Organization" on the dashboard
- Enter organization name
- You'll see it in your organization list

### 3. Create Your First Campaign
- Click on your organization
- Click "+ New Campaign"
- Fill in:
  - Campaign name
  - Description
  - Industry (SaaS, E-commerce, etc.)
  - Target audience
  - Campaign goals
- Click "Create Campaign"

### 4. Generate AI Content
- Click on your campaign
- Click "✨ Generate AI Content"
- The platform will generate:
  - Email headlines
  - Body copy
  - Call-to-action buttons
  - Subject lines
  - Visual descriptions
- Review and edit the generated content

### 5. Schedule Your Campaign
- Go to the campaign detail page
- Click the "Schedule" tab
- Choose send date/time
- Select channel (email, social, webflow, multi)
- Save the schedule

### 6. Monitor Analytics
- Go to the "Analytics" tab
- View impressions, clicks, conversions
- See engagement rates and ROI
- Change the time period (7/30/90 days)

## Key Features

### Campaign Management
- Create unlimited campaigns
- Track status (draft, scheduled, active, paused, completed)
- Generate AI content with one click
- Edit generated content
- Schedule across multiple channels

### AI Orchestration
The platform automatically:
- Tries your primary AI model
- Falls back to the next model if one fails
- Ensures campaigns never fail due to API issues
- Supports all major providers

### Analytics Dashboard
- Real-time performance tracking
- Key metrics: impressions, clicks, conversions, revenue
- Engagement rate and ROI calculation
- 7, 30, and 90-day views

### Integrations
Currently supported:
- Webflow (create and deploy landing pages)

Coming soon:
- Email providers (SendGrid, Mailgun)
- Social media (Twitter, LinkedIn, Instagram)

## Troubleshooting

### Database Connection Error
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### AI Generation Fails
- Check API keys in `.env.local`
- Ensure at least one API key is valid
- Check API quota/rate limits
- The system will automatically try fallback models

### Can't Create Campaign
- Make sure you have an organization first
- Check that you're logged in
- Verify all required fields are filled

### Port 3000 Already in Use
```bash
# Use a different port
pnpm dev -- -p 3001
```

## File Structure

```
app/              # Next.js pages and routes
├── page.tsx      # Landing page
├── auth/         # Login/signup pages
└── api/          # API endpoints

lib/              # Utility functions
├── auth.ts       # Authentication
├── prisma.ts     # Database client
└── ai/           # AI orchestration

components/       # React components
prisma/          # Database schema
hooks/           # Custom React hooks
middleware.ts    # Route protection
```

## Common Tasks

### Add a New Campaign Goal
In `/campaign-builder`, add to the select options or use free-form input.

### Change AI Model Settings
1. Go to `/admin/ai-config`
2. Click "+ Add AI Model"
3. Select model (OpenAI, Claude, Groq)
4. Adjust max tokens and temperature
5. Save

### View All Campaigns
1. Go to `/dashboard`
2. Click on an organization
3. All campaigns listed with status

### Export Analytics
- Coming soon via CSV export

## Performance Tips

1. **For faster AI generation:** Use GPT-4o-mini (faster, cheaper)
2. **For higher quality:** Use GPT-4o or Claude Opus
3. **For speed:** Configure Groq as fallback
4. **Database:** Ensure proper indexes are created
5. **Caching:** SWR automatically caches API responses

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords
- Keep API keys confidential
- Session cookies expire after 7 days
- All passwords are hashed with bcrypt

## Need Help?

### Documentation
- See `SETUP.md` for detailed setup
- See `PROJECT_SUMMARY.md` for architecture overview
- See `README.md` for general info

### Debugging
Enable verbose logging:
```bash
DEBUG=* pnpm dev
```

### Database Debugging
```bash
# Open Prisma Studio
pnpm prisma studio

# View schema
pnpm prisma schema validate
```

## Next Steps

1. **Customize branding** - Update logo and colors in `tailwind.config.ts`
2. **Add team members** - Invite users to your organization (coming soon)
3. **Set up Webflow** - Connect your Webflow site for landing pages
4. **Configure email** - Add SendGrid or Mailgun for email sending
5. **Enable social media** - Add Twitter, LinkedIn, Instagram posting

## Deployment

### Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push

# Connect Vercel
# 1. Go to vercel.com
# 2. Create new project from GitHub
# 3. Add environment variables
# 4. Deploy
```

### Self-Hosted
```bash
# Build for production
pnpm build

# Run production build
pnpm start

# Or use PM2
pm2 start "pnpm start" --name "marketing-ai"
```

---

**Ready to launch?** Go to http://localhost:3000 and start building your first AI-powered campaign!
