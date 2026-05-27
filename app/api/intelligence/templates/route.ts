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

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const whereClause: any = { organizationId: orgId };
    if (industry) whereClause.industry = industry;

    const templatePerformance = await prisma.templatePerformance.findMany({
      where: whereClause,
      orderBy: { performanceScore: 'desc' },
      take: 50,
    });

    return NextResponse.json(templatePerformance);
  } catch (error) {
    console.error('[Automaio] Template intelligence error:', error);
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
      templateId,
      industry,
      totalUsage,
      totalConversions,
      suggestedImprovements,
    } = body;

    const conversionRate =
      totalUsage > 0 ? Number(((totalConversions / totalUsage) * 100).toFixed(2)) : 0;
    const performanceScore = Math.min(100, conversionRate * 2); // Scale 0-100

    const result = await prisma.templatePerformance.upsert({
      where: { templateId_organizationId: { templateId, organizationId } },
      update: {
        totalUsage,
        totalConversions,
        conversionRate,
        performanceScore,
        suggestedImprovements,
        updatedAt: new Date(),
      },
      create: {
        templateId,
        organizationId,
        industry,
        totalUsage,
        totalConversions,
        conversionRate,
        performanceScore,
        suggestedImprovements,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Template performance creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
