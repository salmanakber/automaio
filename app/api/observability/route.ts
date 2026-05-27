import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const hours = parseInt(searchParams.get('hours') || '24');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const logs = await prisma.aIObservabilityLog.findMany({
      where: {
        organizationId: orgId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate metrics
    const successCount = logs.filter((l) => l.requestStatus === 'success').length;
    const failureCount = logs.filter((l) => l.requestStatus === 'failed').length;
    const avgLatency =
      logs.length > 0 ? logs.reduce((sum, l) => sum + l.latencyMs, 0) / logs.length : 0;

    const modelStats: any = {};
    logs.forEach((log) => {
      if (!modelStats[log.modelName]) {
        modelStats[log.modelName] = { count: 0, failures: 0, totalLatency: 0 };
      }
      modelStats[log.modelName].count++;
      if (log.requestStatus === 'failed') modelStats[log.modelName].failures++;
      modelStats[log.modelName].totalLatency += log.latencyMs;
    });

    return NextResponse.json({
      logs,
      metrics: {
        totalRequests: logs.length,
        successCount,
        failureCount,
        successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 0,
        avgLatency,
        modelStats,
      },
    });
  } catch (error) {
    console.error('[Automaio] Observability fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      organizationId,
      requestId,
      modelName,
      latencyMs,
      tokenCount,
      failureReason,
      fallbackChain,
      requestStatus,
      aiProviderResponse,
      webflowSyncStatus,
      errorTrace,
      campaignId,
    } = body;

    const result = await prisma.aIObservabilityLog.create({
      data: {
        organizationId,
        requestId,
        modelName,
        latencyMs,
        tokenCount,
        failureReason,
        fallbackChain,
        requestStatus,
        aiProviderResponse,
        webflowSyncStatus,
        errorTrace,
        campaignId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Observability log creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
