import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const industry = searchParams.get('industry');

    const whereClause: any = {};
    if (orgId) whereClause.organizationId = orgId;
    if (industry) whereClause.industry = industry;

    const trends = await prisma.trendData.findMany({
      where: whereClause,
      orderBy: { trendScore: 'desc' },
      take: 100,
    });

    return NextResponse.json(trends);
  } catch (error) {
    console.error('[Automaio] Trends fetch error:', error);
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
      industry,
      trendTopic,
      trendScore,
      viralityPattern,
      seasonalityData,
      geoDistribution,
      suggestedCampaignAngles,
    } = body;

    const result = await prisma.trendData.create({
      data: {
        organizationId,
        industry,
        trendTopic,
        trendScore,
        viralityPattern,
        seasonalityData,
        geoDistribution,
        suggestedCampaignAngles,
        trendingFromDate: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Trends creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
