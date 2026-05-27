# Deployment Guide

## Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Redis persistence enabled
- [ ] SSL/TLS certificates configured
- [ ] CDN configured for static assets
- [ ] Logging and monitoring enabled
- [ ] Rate limiting configured
- [ ] Worker scaling configured
- [ ] Database indexes optimized
- [ ] CI/CD pipeline set up

## Vercel Deployment (Recommended)

### 1. Prepare Repository
```bash
# Ensure all code is committed
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Create Vercel Project
```bash
# If not already connected
pnpm exec vercel link
```

### 3. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://user:password@host:6379
NEXTAUTH_SECRET=<generate-strong-secret>
NEXTAUTH_URL=https://yourdomain.com
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
GROQ_API_KEY=...
WEBFLOW_API_KEY=...
LOG_LEVEL=info
```

### 4. Build and Deploy
```bash
# Build locally to test
pnpm build

# Deploy to Vercel
pnpm exec vercel deploy --prod
```

### 5. Run Migrations
```bash
# Connect to remote database
vercel env pull

# Run migrations on production
pnpm prisma migrate deploy
```

### 6. Start Workers
For background jobs, you have several options:

**Option A: Vercel Cron (Simple)**
Use Vercel Cron to trigger API routes periodically.

**Option B: External Worker Service**
Deploy workers to a separate service:
- Railway.app
- Render.com
- DigitalOcean App Platform
- AWS Lambda + EventBridge

**Option C: Docker Container**
Deploy worker as a separate container.

## Docker Deployment

### Build Image
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Deploy
```bash
# Build image
docker build -t marketing-ai:latest .

# Push to registry
docker push your-registry/marketing-ai:latest

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## AWS Deployment

### Using ECS (Recommended)
```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name marketing-ai

# 2. Build and push image
docker build -t marketing-ai:latest .
docker tag marketing-ai:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/marketing-ai:latest
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/marketing-ai:latest

# 3. Create ECS task definition
# Use CloudFormation or AWS CLI to create task

# 4. Create RDS PostgreSQL database
aws rds create-db-instance \
  --db-instance-identifier marketing-ai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20

# 5. Create ElastiCache for Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id marketing-ai-redis \
  --engine redis \
  --cache-node-type cache.t3.micro
```

## Google Cloud Deployment

### Using Cloud Run
```bash
# 1. Build and push to Container Registry
gcloud builds submit --tag gcr.io/$PROJECT/marketing-ai

# 2. Deploy to Cloud Run
gcloud run deploy marketing-ai \
  --image gcr.io/$PROJECT/marketing-ai \
  --platform managed \
  --memory 2Gb \
  --timeout 3600 \
  --set-env-vars DATABASE_URL=$DB_URL,REDIS_URL=$REDIS_URL

# 3. Set up Cloud SQL PostgreSQL
gcloud sql instances create marketing-ai-db \
  --database-version POSTGRES_15 \
  --tier db-f1-micro

# 4. Set up Memorystore for Redis
gcloud redis instances create marketing-ai-redis \
  --size 1 \
  --region $REGION
```

## PostgreSQL Setup

### Cloud SQL (Google Cloud)
```bash
# Create database
gcloud sql databases create marketing_ai_db \
  --instance marketing-ai-db

# Run migrations
PGPASSWORD=$PASSWORD psql \
  -h $CLOUD_SQL_IP \
  -U postgres \
  -d marketing_ai_db \
  -f migrations.sql
```

### AWS RDS
```bash
# Create database
aws rds create-db-instance \
  --db-instance-identifier marketing-ai-db \
  --engine postgres \
  --db-instance-class db.t3.micro \
  --master-username admin \
  --allocated-storage 100

# Connect and run migrations
psql -h $RDS_ENDPOINT -U admin -d marketing_ai_db -f migrations.sql
```

### Self-Hosted
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb marketing_ai_db
sudo -u postgres createuser marketing_user

# Run migrations
psql -U marketing_user -d marketing_ai_db -f migrations.sql

# Enable backups
sudo cp /etc/postgresql/15/main/postgresql.conf \
  /etc/postgresql/15/main/postgresql.conf.bak

# Add to postgresql.conf
# wal_level = replica
# max_wal_senders = 3
# hot_standby = on
```

## Redis Setup

### Redis Cloud
```bash
# Create database on Redis Cloud
# https://app.rediscloud.com

# Update REDIS_URL in environment
REDIS_URL=rediss://default:password@host:port
```

### AWS ElastiCache
```bash
# Create cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id marketing-ai-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --engine-version 7.0

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id marketing-ai-redis
```

### Self-Hosted
```bash
# Install Redis
sudo apt-get install redis-server

# Enable persistence
sudo vim /etc/redis/redis.conf
# Uncomment: save 900 1

# Start service
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping
```

## SSL/TLS Configuration

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Vercel (Automatic)
Vercel handles SSL automatically - no configuration needed.

## Monitoring & Logging

### Application Performance Monitoring (APM)

**Option 1: Sentry**
```typescript
// Configure in environment
SENTRY_DSN=https://key@sentry.io/project-id

// Use in error handler
import * as Sentry from "@sentry/nextjs"

Sentry.captureException(error)
```

**Option 2: DataDog**
```bash
# Install agent
npm install @datadog/browser-rum @datadog/browser-logs

# Initialize in app
import { datadogRum } from '@datadog/browser-rum'
datadogRum.init({ applicationId, clientToken })
```

### Logging

**Option 1: CloudWatch (AWS)**
```typescript
import { CloudWatchClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs"

const client = new CloudWatchClient()
await client.send(new PutLogEventsCommand({
  logGroupName: '/marketing-ai/app',
  logStreamName: 'production',
  logEvents: [{ timestamp: Date.now(), message: 'Log message' }],
}))
```

**Option 2: Stackdriver (Google Cloud)**
```bash
# Logs are automatically sent to Cloud Logging
# View in Google Cloud Console
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Option 3: ELK Stack**
```yaml
# docker-compose.yml additions
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
```

## Database Backup Strategy

### Automated Backups
```bash
# AWS RDS (automatic)
# Enable automated backups in AWS console
# Retention: 30 days

# Google Cloud SQL (automatic)
# Enabled by default
# Retention: 7 days

# Self-hosted PostgreSQL
0 2 * * * pg_dump marketing_ai_db | gzip > /backups/backup-$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup
```bash
# AWS RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier marketing-ai-db-restored \
  --db-snapshot-identifier snapshot-id

# Google Cloud SQL
gcloud sql backups restore BACKUP_ID \
  --backup-instance marketing-ai-db

# PostgreSQL
gunzip < backup-20240516.sql.gz | psql marketing_ai_db
```

## Worker Deployment

### Option 1: Separate Container
```bash
# Create worker Dockerfile
docker run -e REDIS_URL=... -e DATABASE_URL=... marketing-ai:worker

# Deploy to orchestration platform (Kubernetes, Docker Swarm)
```

### Option 2: Cron Jobs
```typescript
// app/api/cron/process-jobs/route.ts
export async function POST(request) {
  // Process jobs from queue
  const jobs = await queue.getDelayed()
  for (const job of jobs) {
    if (job.shouldRun()) {
      await job.process()
    }
  }
}
```

### Option 3: Serverless
```bash
# Deploy as AWS Lambda
npm install -g serverless
serverless deploy

# Or as Google Cloud Functions
gcloud functions deploy process-jobs \
  --runtime nodejs18 \
  --trigger-topic process-jobs
```

## Performance Tuning

### Database
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_content_assets_campaign_id ON content_assets(campaign_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM campaigns WHERE organization_id = $1;

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Redis
```bash
# Optimize memory usage
redis-cli INFO memory

# Set max memory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Monitor commands
redis-cli MONITOR
```

### Application
```typescript
// Enable compression
import compression from 'compression'
app.use(compression())

// Enable caching headers
response.headers.set('Cache-Control', 'public, max-age=3600')

// Optimize images
import Image from 'next/image'
<Image src="/image.png" width={800} height={600} />
```

## Scaling Strategy

### Horizontal Scaling
1. Load balancer (Nginx, HAProxy, AWS LB)
2. Multiple app instances
3. Shared database and Redis
4. Session store in Redis

### Vertical Scaling
1. Upgrade server resources
2. Optimize database queries
3. Add caching layers
4. Use CDN for static assets

### Queue Scaling
```javascript
// Adjust worker concurrency based on load
const concurrency = process.env.WORKER_CONCURRENCY || 5
const worker = new Worker(queueName, jobProcessor, { connection: redis, concurrency })
```

## Rollback Procedure

```bash
# If deployment fails
# 1. Revert to previous version
git revert HEAD
git push

# 2. Redeploy
pnpm exec vercel deploy --prod

# 3. Check database is still compatible
# (if migrations were applied)

# 4. Monitor for issues
# Check logs and metrics
```

## Security in Production

- [ ] Disable debug logging
- [ ] Set strong secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up WAF rules
- [ ] Enable rate limiting
- [ ] Rotate API keys regularly
- [ ] Enable database encryption
- [ ] Set up DDoS protection
- [ ] Regular security audits

## Maintenance

### Daily
- Monitor error logs
- Check queue health
- Review slow queries

### Weekly
- Database backup verification
- Performance metrics review
- Security updates check

### Monthly
- Database optimization
- Cache review
- Dependency updates
- Cost analysis

## Support & Troubleshooting

For deployment issues:
1. Check logs in dashboard
2. Verify environment variables
3. Test database connectivity
4. Verify Redis connectivity
5. Check worker status
6. Review recent deployments
