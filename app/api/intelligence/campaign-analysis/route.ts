import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    const intelligence = await prisma.campaignIntelligence.findUnique({
      where: { campaignId },
    });

    if (!intelligence) {
      return NextResponse.json({ error: 'No intelligence data found' }, { status: 404 });
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('[Automaio] Campaign intelligence fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      campaignId,
      successScore,
      funnelDropOffStages,
      hookPerformanceData,
      ctaEffectiveness,
      engagementToConversion,
      aiAnalysisSummary,
      autoRecommendations,
    } = body;

    const result = await prisma.campaignIntelligence.upsert({
      where: { campaignId },
      update: {
        successScore,
        funnelDropOffStages,
        hookPerformanceData,
        ctaEffectiveness,
        engagementToConversion,
        aiAnalysisSummary,
        autoRecommendations,
        updatedAt: new Date(),
      },
      create: {
        campaignId,
        successScore,
        funnelDropOffStages,
        hookPerformanceData,
        ctaEffectiveness,
        engagementToConversion,
        aiAnalysisSummary,
        autoRecommendations,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Campaign intelligence creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
