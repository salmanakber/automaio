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

    const [projects, projectSchedules, emailSchedules, campaigns, webflowSchedules] =
      await Promise.all([
        prisma.contentProject.findMany({
          where: { organizationId: orgId },
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            name: true,
            category: true,
            contentType: true,
            status: true,
            showOnWebsite: true,
            scheduledFor: true,
            webflowCmsItemId: true,
            updatedAt: true,
          },
        }),
        prisma.projectSchedule.findMany({
          where: {
            status: 'scheduled',
            project: { organizationId: orgId },
          },
          orderBy: { scheduledFor: 'asc' },
          include: { project: { select: { id: true, name: true, category: true } } },
        }),
        prisma.emailSchedule.findMany({
          where: {
            status: 'scheduled',
            emailCampaign: { organizationId: orgId },
          },
          orderBy: { scheduledFor: 'asc' },
          include: { emailCampaign: { select: { id: true, name: true, frequency: true } } },
        }),
        prisma.campaign.findMany({
          where: { organizationId: orgId },
          orderBy: { updatedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            name: true,
            status: true,
            webflowCmsItemId: true,
            updatedAt: true,
          },
        }),
        prisma.campaignSchedule.findMany({
          where: {
            status: 'scheduled',
            campaign: { organizationId: orgId },
          },
          orderBy: { scheduledFor: 'asc' },
          include: { campaign: { select: { id: true, name: true } } },
        }),
      ])

    const timeline = [
      ...projectSchedules.map((s) => ({
        id: s.id,
        type: 'project' as const,
        title: s.project.name,
        category: s.project.category,
        scheduledFor: s.scheduledFor,
        frequency: s.frequency,
        status: s.status,
        resourceId: s.project.id,
      })),
      ...emailSchedules.map((s) => ({
        id: s.id,
        type: 'email' as const,
        title: s.emailCampaign.name,
        category: 'email',
        scheduledFor: s.scheduledFor,
        frequency: s.frequency,
        status: s.status,
        resourceId: s.emailCampaign.id,
      })),
      ...webflowSchedules.map((s) => ({
        id: s.id,
        type: 'campaign' as const,
        title: s.campaign.name,
        category: 'campaign',
        scheduledFor: s.scheduledFor,
        frequency: 'once',
        status: s.status,
        resourceId: s.campaign.id,
      })),
    ].sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())

    return NextResponse.json({
      projects,
      campaigns,
      timeline,
      stats: {
        totalProjects: projects.length,
        published: projects.filter((p) => p.status === 'published').length,
        scheduled: timeline.filter((t) => t.status === 'scheduled').length,
        onWebsite: projects.filter((p) => p.showOnWebsite && p.webflowCmsItemId).length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load schedule overview' }, { status: 500 })
  }
}
