import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgSetupStatus } from '@/lib/organizations/setup-status'

type RouteParams = { params: Promise<{ orgId: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orgId } = await params

    const org = await prisma.organization.findFirst({
      where: {
        id: orgId,
        OR: [{ ownerId: user.id }, { teamMembers: { some: { userId: user.id } } }],
      },
    })
    if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const status = await getOrgSetupStatus(orgId)
    return NextResponse.json(status)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load setup status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
