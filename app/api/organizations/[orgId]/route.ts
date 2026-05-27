import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = params

    const organization = await prisma.organization.findFirst({
      where: {
        AND: [
          { id: orgId },
          {
            OR: [
              { ownerId: user.id },
              { teamMembers: { some: { userId: user.id } } },
            ],
          },
        ],
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = params
    const updates = await req.json()

    // Verify user is owner
    const org = await prisma.organization.findFirst({
      where: {
        AND: [
          { id: orgId },
          { ownerId: user.id },
        ],
      },
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Forbidden - only owner can update' },
        { status: 403 }
      )
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: updates,
    })

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}
