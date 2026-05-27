import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const whereClause: any = { organizationId: orgId };
    if (status) whereClause.status = status;

    const experiments = await prisma.experiment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { campaign: true },
      take: 50,
    });

    return NextResponse.json(experiments);
  } catch (error) {
    console.error('[Automaio] Experiments fetch error:', error);
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
      experimentName,
      experimentType,
      controlVariant,
      testVariants,
      autoPromote,
    } = body;

    const result = await prisma.experiment.create({
      data: {
        organizationId,
        campaignId,
        experimentName,
        experimentType,
        controlVariant,
        testVariants,
        autoPromote: autoPromote || false,
        status: 'running',
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Experiment creation error:', error);
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
      status,
      winningVariant,
      statisticalConfidence,
      conversionsByVariant,
      totalParticipants,
    } = body;

    const result = await prisma.experiment.update({
      where: { id },
      data: {
        status,
        winningVariant,
        statisticalConfidence,
        conversionsByVariant,
        totalParticipants,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Experiment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
