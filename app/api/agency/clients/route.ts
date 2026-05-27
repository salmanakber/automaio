import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const clients = await prisma.agencyClient.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('[Automaio] Agency clients fetch error:', error);
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
      clientName,
      clientEmail,
      clientWebsite,
      whiteLabelEnabled,
      customBrandingJson,
      clientAiSettings,
      isolationLevel,
    } = body;

    const result = await prisma.agencyClient.create({
      data: {
        organizationId,
        clientName,
        clientEmail,
        clientWebsite,
        whiteLabelEnabled: whiteLabelEnabled || false,
        customBrandingJson,
        clientAiSettings,
        isolationLevel: isolationLevel || 'workspace',
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Agency client creation error:', error);
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
      clientName,
      clientEmail,
      clientWebsite,
      whiteLabelEnabled,
      customBrandingJson,
      clientAiSettings,
      isolationLevel,
    } = body;

    const result = await prisma.agencyClient.update({
      where: { id },
      data: {
        clientName,
        clientEmail,
        clientWebsite,
        whiteLabelEnabled,
        customBrandingJson,
        clientAiSettings,
        isolationLevel,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Agency client update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
