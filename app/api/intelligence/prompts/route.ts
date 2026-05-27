import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const promptType = searchParams.get('promptType');
    const industry = searchParams.get('industry');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const whereClause: any = { organizationId: orgId, isActive: true };
    if (promptType) whereClause.promptType = promptType;
    if (industry) whereClause.industry = industry;

    const prompts = await prisma.promptIntelligence.findMany({
      where: whereClause,
      orderBy: { performanceScore: 'desc' },
      take: 50,
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('[Automaio] Prompt intelligence fetch error:', error);
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
      promptContent,
      promptType,
      industry,
      performanceScore,
      suggestedRewritings,
      abTestPerformance,
    } = body;

    const result = await prisma.promptIntelligence.create({
      data: {
        organizationId,
        promptContent,
        promptType,
        industry,
        performanceScore: performanceScore || 0,
        suggestedRewritings,
        abTestPerformance,
        version: 1,
        isActive: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Prompt intelligence creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      id,
      performanceScore,
      suggestedRewritings,
      promptDriftScore,
      abTestPerformance,
    } = body;

    const result = await prisma.promptIntelligence.update({
      where: { id },
      data: {
        performanceScore,
        suggestedRewritings,
        promptDriftScore,
        abTestPerformance,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Prompt intelligence update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
