import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        organizations: { select: { id: true, name: true, slug: true } },
        teamMembers: {
          select: {
            role: true,
            organization: { select: { id: true, name: true } },
          },
        },
        _count: { select: { campaigns: true, sessions: true } },
      },
    })

    const formatted = users.map((row) => {
      const ownedOrg = row.organizations[0]
      const memberOrg = row.teamMembers[0]?.organization
      const organizationName = ownedOrg?.name ?? memberOrg?.name ?? '—'
      const role = row.organizations.length > 0 ? 'owner' : row.teamMembers[0]?.role ?? 'member'

      return {
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role,
        organization: organizationName,
        status: 'active' as const,
        campaigns: row._count.campaigns,
        lastActive: row.updatedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ users: formatted, total: formatted.length })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
