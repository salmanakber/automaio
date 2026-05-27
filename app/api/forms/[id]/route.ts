import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const form = await prisma.leadForm.findUnique({
      where: { id },
      include: {
        submissions: { orderBy: { createdAt: 'desc' }, take: 100 },
        _count: { select: { submissions: true } },
      },
    })
    if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccess(user, form.organizationId)

    return NextResponse.json({ form })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.leadForm.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccess(user, existing.organizationId)

    const body = await req.json()
    const form = await prisma.leadForm.update({
      where: { id },
      data: {
        name: body.name,
        fields: body.fields,
        settings: body.settings,
        status: body.status,
      },
    })

    return NextResponse.json({ form })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.leadForm.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccess(user, existing.organizationId)

    await prisma.leadForm.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
