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

    const simulations = await prisma.campaignSimulation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(simulations);
  } catch (error) {
    console.error('[Automaio] Campaign simulation fetch error:', error);
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
      originalCampaignId,
      simulationName,
      simulationType,
      originalParameters,
      modifiedParameters,
      predictedEngagement,
      predictedConversion,
      predictedRevenue,
      aiRecommendations,
    } = body;

    const result = await prisma.campaignSimulation.create({
      data: {
        organizationId,
        campaignId,
        originalCampaignId,
        simulationName,
        simulationType,
        originalParameters,
        modifiedParameters,
        predictedEngagement,
        predictedConversion,
        predictedRevenue,
        aiRecommendations,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Campaign simulation creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
