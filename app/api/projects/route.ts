import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'
import { renderProjectHtml } from '@/lib/content/render-project-html'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

    await requireOrgAccess(user, orgId)

    const category = req.nextUrl.searchParams.get('category')
    const projects = await prisma.contentProject.findMany({
      where: {
        organizationId: orgId,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        template: { select: { id: true, name: true } },
        schedules: {
          where: { status: 'scheduled' },
          orderBy: { scheduledFor: 'asc' },
          take: 3,
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      organizationId,
      name,
      description,
      category = 'project',
      contentType = 'cms_entry',
      templateId,
      parameters,
      webflowIntegrationId,
      cmsCollectionId,
      sourceCmsItemId,
      showOnWebsite = true,
      publishSite = false,
      aiEnhance = false,
    } = body

    if (!organizationId || !name) {
      return NextResponse.json({ error: 'organizationId and name required' }, { status: 400 })
    }

    await requireOrgAccess(user, organizationId)

    let renderedHtml: string | null = null
    if (templateId) {
      const template = await prisma.campaignTemplate.findUnique({
        where: { id: templateId },
      })
      if (template) {
        renderedHtml = renderProjectHtml(
          { name, description, category, template, renderedHtml: null },
          (parameters as Record<string, string>) ?? {},
        )
      }
    }

    const project = await prisma.contentProject.create({
      data: {
        organizationId,
        name,
        description,
        category,
        contentType,
        templateId: templateId || null,
        parameters: parameters ?? {},
        webflowIntegrationId: webflowIntegrationId || null,
        cmsCollectionId: cmsCollectionId || null,
        sourceCmsItemId: sourceCmsItemId || null,
        showOnWebsite,
        publishSite,
        aiEnhance,
        renderedHtml,
        createdById: user.id,
      },
      include: { template: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
