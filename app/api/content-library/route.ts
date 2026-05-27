import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const assetType = searchParams.get('assetType');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const whereClause: any = { organizationId: orgId };
    if (assetType) whereClause.assetType = assetType;

    const assets = await prisma.contentAssetLibrary.findMany({
      where: whereClause,
      orderBy: { lastUsedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('[Automaio] Asset library fetch error:', error);
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
      assetName,
      assetType,
      assetUrl,
      assetMetadata,
      aiGeneratedTags,
      performanceData,
    } = body;

    const result = await prisma.contentAssetLibrary.create({
      data: {
        organizationId,
        assetName,
        assetType,
        assetUrl,
        assetMetadata,
        aiGeneratedTags: aiGeneratedTags || [],
        performanceData,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Asset creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, assetName, assetMetadata, performanceData, lastUsedAt } = body;

    const result = await prisma.contentAssetLibrary.update({
      where: { id },
      data: {
        assetName,
        assetMetadata,
        performanceData,
        lastUsedAt: lastUsedAt || new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Asset update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
