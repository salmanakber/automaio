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

    const rules = await prisma.automationRule.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('[Automaio] Automation rules fetch error:', error);
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
      ruleName,
      triggerCondition,
      actionType,
      actionConfig,
      customWorkflowJson,
      isActive,
    } = body;

    const result = await prisma.automationRule.create({
      data: {
        organizationId,
        ruleName,
        triggerCondition,
        actionType,
        actionConfig,
        customWorkflowJson,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Automation rule creation error:', error);
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
      ruleName,
      triggerCondition,
      actionType,
      actionConfig,
      isActive,
      lastExecutedAt,
      executionCount,
    } = body;

    const result = await prisma.automationRule.update({
      where: { id },
      data: {
        ruleName,
        triggerCondition,
        actionType,
        actionConfig,
        isActive,
        lastExecutedAt,
        executionCount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Automation rule update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
