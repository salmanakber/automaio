import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { checkQueuesHealth } from '@/lib/queue/queues'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    let queueHealth: Record<string, unknown> = {}
    try {
      queueHealth = await checkQueuesHealth()
    } catch {
      queueHealth = { error: 'Redis unavailable' }
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV ?? 'development',
      features: {
        aiCostOptimization: process.env.ENABLE_AI_COST_OPTIMIZATION === 'true',
        autoScheduling: process.env.ENABLE_AUTO_SCHEDULING === 'true',
        webflowIntegration: process.env.ENABLE_WEBFLOW_INTEGRATION === 'true',
        complianceChecking: process.env.ENABLE_COMPLIANCE_CHECKING === 'true',
      },
      integrations: {
        openai: Boolean(process.env.OPENAI_API_KEY),
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
        groq: Boolean(process.env.GROQ_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
        deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
        mistral: Boolean(process.env.MISTRAL_API_KEY),
        together: Boolean(process.env.TOGETHER_API_KEY),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY),
        webflowOAuth: Boolean(
          process.env.WEBFLOW_CLIENT_ID && process.env.WEBFLOW_CLIENT_SECRET,
        ),
        redis: Boolean(process.env.REDIS_URL),
        database: Boolean(process.env.DATABASE_URL),
      },
      queueHealth,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load system info' }, { status: 500 })
  }
}
