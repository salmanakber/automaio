import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { publishContentProject } from '@/lib/content/publish-project'
import { scheduleContentProject } from '@/lib/campaigns/schedule-content'

type RouteParams = { params: Promise<{ id: string }> }

function buildPatchData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  const fields = [
    'name',
    'description',
    'category',
    'contentType',
    'templateId',
    'parameters',
    'webflowIntegrationId',
    'cmsCollectionId',
    'sourceCmsItemId',
    'showOnWebsite',
    'publishSite',
    'aiEnhance',
    'renderedHtml',
    'status',
  ] as const
  for (const key of fields) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  return data
}

async function getProjectForUser(id: string, userId: string) {
  const project = await prisma.contentProject.findUnique({
    where: { id },
    include: {
      template: true,
      schedules: { orderBy: { scheduledFor: 'desc' } },
    },
  })
  if (!project) return null
  await requireOrgAccessByUserId(userId, project.organizationId)
  return project
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await getProjectForUser(id, user.id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ project })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project'
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await getProjectForUser(id, user.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const patchData = buildPatchData(body as Record<string, unknown>)
    if (Object.keys(patchData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const project = await prisma.contentProject.update({
      where: { id },
      data: patchData,
      include: { template: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ project })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await getProjectForUser(id, user.id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.contentProject.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'publish') {
    try {
      const token = req.cookies.get('auth_token')?.value
      const user = await validateSession(token || '')
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { id } = await params
      const existing = await getProjectForUser(id, user.id)
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const body = await req.json().catch(() => ({}))
      const result = await publishContentProject(id, {
        publishSite: body.publishSite ?? existing.publishSite,
      })
      return NextResponse.json({ success: true, ...result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (action === 'schedule') {
    try {
      const token = req.cookies.get('auth_token')?.value
      const user = await validateSession(token || '')
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { id } = await params
      const existing = await getProjectForUser(id, user.id)
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const body = await req.json()
      const scheduledFor = new Date(body.scheduledFor)
      const result = await scheduleContentProject({
        projectId: id,
        organizationId: existing.organizationId,
        scheduledFor,
        frequency: body.frequency ?? 'once',
        publishSite: body.publishSite ?? existing.publishSite,
      })
      return NextResponse.json(result, { status: 201 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Schedule failed'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
