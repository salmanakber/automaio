import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'

type RouteParams = { params: Promise<{ id: string }> }

/** Save rendered HTML only — avoids large JSON bodies on the main PATCH route. */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const body = await req.json()
    const renderedHtml = typeof body.renderedHtml === 'string' ? body.renderedHtml : ''
    if (!renderedHtml.trim()) {
      return NextResponse.json({ error: 'renderedHtml is required' }, { status: 400 })
    }

    const updated = await prisma.contentProject.update({
      where: { id },
      data: { renderedHtml },
      select: { id: true, renderedHtml: true, updatedAt: true },
    })

    return NextResponse.json({ project: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save HTML'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
