import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const ruleType = searchParams.get('ruleType');

    const whereClause: any = { isActive: true };
    if (orgId) whereClause.organizationId = orgId;
    if (ruleType) whereClause.ruleType = ruleType;

    const rules = await prisma.complianceRule.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('[Automaio] Compliance rules fetch error:', error);
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
      ruleType,
      blockUnsafeClaims,
      blockUnsafeIndustries,
      brandToneRules,
      regionalComplianceRules,
      contentApprovalRequired,
      autoFlagProblematicContent,
    } = body;

    const result = await prisma.complianceRule.create({
      data: {
        organizationId,
        ruleName,
        ruleType,
        blockUnsafeClaims: blockUnsafeClaims !== false,
        blockUnsafeIndustries: blockUnsafeIndustries || [],
        brandToneRules,
        regionalComplianceRules,
        contentApprovalRequired: contentApprovalRequired || false,
        autoFlagProblematicContent: autoFlagProblematicContent !== false,
        isActive: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Compliance rule creation error:', error);
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
      ruleType,
      blockUnsafeClaims,
      blockUnsafeIndustries,
      brandToneRules,
      regionalComplianceRules,
      contentApprovalRequired,
      autoFlagProblematicContent,
      isActive,
    } = body;

    const result = await prisma.complianceRule.update({
      where: { id },
      data: {
        ruleName,
        ruleType,
        blockUnsafeClaims,
        blockUnsafeIndustries,
        brandToneRules,
        regionalComplianceRules,
        contentApprovalRequired,
        autoFlagProblematicContent,
        isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Automaio] Compliance rule update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
