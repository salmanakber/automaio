import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.subscriptionMetrics.findMany({
      where: {
        organizationId: orgId,
        metricsDate: {
          gte: startDate,
        },
      },
      orderBy: { metricsDate: 'desc' },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[Automaio] Subscription metrics fetch error:', error);
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
      mrr,
      arr,
      activeSubscriptions,
      churnRate,
      churnPredictionScore,
      cohortRetention,
      freeToPaidConversion,
      revenuePerIndustry,
    } = body;

    const result = await prisma.subscriptionMetrics.create({
      data: {
        organizationId,
        metricsDate: new Date(),
        mrr,
        arr,
        activeSubscriptions,
        churnRate,
        churnPredictionScore,
        cohortRetention,
        freeToPaidConversion,
        revenuePerIndustry,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Subscription metrics creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
