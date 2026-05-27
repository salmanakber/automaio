import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    await requireOrgAccess(user, orgId)

    const subscribers = await prisma.emailSubscriber.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscribers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, email, firstName, lastName } = body
    if (!organizationId || !email) {
      return NextResponse.json({ error: 'organizationId and email required' }, { status: 400 })
    }

    await requireOrgAccess(user, organizationId)

    const subscriber = await prisma.emailSubscriber.upsert({
      where: {
        organizationId_email: { organizationId, email: email.trim().toLowerCase() },
      },
      create: {
        organizationId,
        email: email.trim().toLowerCase(),
        firstName,
        lastName,
        status: 'active',
      },
      update: { firstName, lastName, status: 'active' },
    })

    return NextResponse.json({ subscriber }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add subscriber' }, { status: 500 })
  }
}
