# Development Guide

## Code Standards

### TypeScript
- Always use explicit types for function parameters and returns
- Avoid `any` type - use `unknown` or specific interfaces instead
- Use type guards for runtime validation
- Keep types in separate `types/` files for large modules

### React/Next.js
- Use server components by default
- Use `'use client'` only when necessary
- Keep components focused and single-responsibility
- Use hooks for state management
- Prefer composition over inheritance

### Naming Conventions
- **Files**: kebab-case for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Database models**: PascalCase
- **Enums**: PascalCase
- **API routes**: kebab-case

### Code Organization
```
├── components/
│   ├── [Feature]/
│   │   ├── [Component].tsx
│   │   ├── [Component].test.tsx
│   │   └── index.ts
│
├── lib/
│   ├── [Domain]/
│   │   ├── index.ts
│   │   └── [Utility].ts
│
├── app/
│   ├── [Route]/
│   │   ├── page.tsx
│   │   └── layout.tsx
│
└── types/
    └── [Domain].ts
```

## Database Development

### Creating Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name add_new_feature

# Reset database (development only!)
pnpm prisma migrate reset

# View database
pnpm prisma studio
```

### Database Best Practices
1. Always add timestamps (createdAt, updatedAt)
2. Use UUIDs for IDs with `@default(cuid())`
3. Add indexes for frequently queried fields
4. Use enums for fixed values
5. Keep relationships normalized

### Example Schema
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

## API Development

### Route Structure
```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { handleError, createSuccessResponse } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.info('API', 'GET /api/resource')
    
    // Handle request
    const data = await fetchData()
    
    return createSuccessResponse(data)
  } catch (error) {
    logger.error('API', 'Error in GET /api/resource', error)
    return handleError(error)
  }
}
```

### Authentication
```typescript
import { verifySession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await verifySession(request)
  
  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }
  
  // Proceed with authenticated request
}
```

### Validation
```typescript
import { validateData, createCampaignSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const { success, data, error } = validateData(createCampaignSchema, body)
  
  if (!success) {
    return new NextResponse(JSON.stringify({ error }), { status: 400 })
  }
  
  // Use validated data
}
```

## Worker Development

### Creating a New Worker

```typescript
// workers/my-feature.worker.ts
import { Worker } from 'bullmq'
import { redis } from '@/lib/queue/redis'
import { logger } from '@/lib/logger'

export function setupMyFeatureWorker() {
  const worker = new Worker(
    'my-feature-queue',
    async (job) => {
      logger.jobProcessing(job.id, 'processing')
      
      try {
        const result = await processJob(job.data)
        
        logger.jobProcessing(job.id, 'completed')
        return result
      } catch (error) {
        logger.error('WORKER', `Job ${job.id} failed`, error)
        throw error // Will trigger retry
      }
    },
    { connection: redis }
  )

  worker.on('completed', (job) => {
    logger.info('WORKER', `Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    logger.error('WORKER', `Job ${job.id} failed`, error)
  })

  return worker
}
```

### Enqueueing Jobs

```typescript
import { queues } from '@/lib/queue/queues'

// In API route or component
await queues.campaignGeneration.add('generate', {
  campaignId: '123',
  industry: 'SaaS',
  targetAudience: 'startups',
}, {
  priority: 10,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  }
})
```

## Testing

### Unit Tests
```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### API Tests
```typescript
// app/api/__tests__/campaigns.test.ts
describe('GET /api/campaigns', () => {
  it('returns campaigns for authenticated user', async () => {
    const response = await fetch('/api/campaigns', {
      headers: { Authorization: `Bearer ${token}` },
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

## Debugging

### Enable Debug Logging
```bash
LOG_LEVEL=debug pnpm dev
```

### Console Logging
```typescript
// Use structured logging
logger.debug('context', 'message', { variable: value })

// Or for quick debugging
console.log("[v0] Debug info:", { data })

// Remove after debugging
```

### Database Debugging
```bash
# Open Prisma Studio
pnpm prisma studio

# View query logs
LOG_LEVEL=debug pnpm dev
```

### Worker Debugging
```bash
# Monitor queue in real-time
# Visit http://localhost:3000/admin/queue-management

# Or enable debug logs
LOG_LEVEL=debug pnpm run worker
```

## Performance Optimization

### Database Queries
```typescript
// Good: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, name: true },
})

// Bad: Select everything
const user = await prisma.user.findUnique({
  where: { id: userId },
})
```

### Caching
```typescript
// Cache frequently accessed data in Redis
const cacheKey = `campaign:${campaignId}`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const data = await fetchCampaign(campaignId)
await redis.setex(cacheKey, 3600, JSON.stringify(data))

return data
```

### Pagination
```typescript
// Always paginate large result sets
const campaigns = await prisma.campaign.findMany({
  where: { organizationId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
})
```

## Common Tasks

### Adding a New Feature
1. Update Prisma schema if needed
2. Run `pnpm prisma migrate dev`
3. Create API routes
4. Create components
5. Add validators
6. Add tests
7. Update documentation

### Deploying Changes
1. Test locally: `pnpm dev` and `pnpm run worker`
2. Run build: `pnpm build`
3. Commit changes
4. Push to repository
5. Deploy via Vercel dashboard

### Updating Dependencies
```bash
# Check for updates
pnpm outdated

# Update specific package
pnpm update package-name

# Update all
pnpm update -r
```

## Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# Rebuild
pnpm build
```

### Database Issues
```bash
# Reset database (DEV ONLY)
pnpm prisma migrate reset

# Check migrations
pnpm prisma migrate status
```

### Worker Issues
```bash
# Check Redis connection
redis-cli ping

# Clear stuck jobs
redis-cli FLUSHDB

# Restart worker
# Kill process and restart
pnpm run worker
```

## Code Review Checklist

- [ ] Types are explicit (no `any`)
- [ ] Error handling is comprehensive
- [ ] Logging is present
- [ ] Database queries are optimized
- [ ] Authentication is checked
- [ ] Input is validated
- [ ] Tests are added
- [ ] Documentation is updated
- [ ] No console.log statements left
- [ ] No hardcoded secrets

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [BullMQ Docs](https://docs.bullmq.io)
