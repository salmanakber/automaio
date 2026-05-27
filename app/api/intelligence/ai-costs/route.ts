import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const campaignId = searchParams.get('campaignId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const whereClause: any = { organizationId: orgId };
    if (campaignId) whereClause.campaignId = campaignId;

    const costs = await prisma.aICostAnalytics.findMany({
      where: whereClause,
      orderBy: { costDate: 'desc' },
      take: 30,
    });

    // Calculate aggregates
    const totalCost = costs.reduce((sum, c) => sum + c.costPerCampaign, 0);
    const totalTokens = costs.reduce((sum, c) => sum + c.totalTokensUsed, 0);
    const totalProfit = costs.reduce((sum, c) => sum + c.profitEstimate, 0);

    return NextResponse.json({
      costs,
      aggregates: {
        totalCost,
        totalTokens,
        totalProfit,
        averageCostPerCampaign: costs.length > 0 ? totalCost / costs.length : 0,
      },
    });
  } catch (error) {
    console.error('[Automaio] AI cost fetch error:', error);
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
      campaignId,
      totalTokensUsed,
      costPerToken,
      costPerModel,
      profitEstimate,
      tokenWasteDetected,
      cacheSavings,
    } = body;

    const costPerCampaign = totalTokensUsed * costPerToken;

    const result = await prisma.aICostAnalytics.create({
      data: {
        organizationId,
        campaignId,
        costDate: new Date(),
        totalTokensUsed,
        costPerToken,
        costPerCampaign,
        costPerModel,
        profitEstimate,
        tokenWasteDetected,
        cacheSavings,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] AI cost creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
