import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const template = await prisma.campaignTemplate.findUnique({ where: { id } })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const existing = await prisma.campaignTemplate.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.organizationId) {
      const hasAccess = await prisma.organization.findFirst({
        where: {
          id: existing.organizationId,
          OR: [
            { ownerId: user!.id },
            { teamMembers: { some: { userId: user!.id, role: { in: ['owner', 'admin'] } } } },
          ],
        },
      })
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const {
      name,
      industry,
      description,
      templateStructure,
      bestPractices,
      avgPerformanceMetrics,
    } = await req.json()

    const template = await prisma.campaignTemplate.update({
      where: { id },
      data: {
        ...(name != null ? { name } : {}),
        ...(industry != null ? { industry } : {}),
        ...(description != null ? { description } : {}),
        ...(templateStructure != null ? { templateStructure } : {}),
        ...(bestPractices != null ? { bestPractices } : {}),
        ...(avgPerformanceMetrics != null ? { avgPerformanceMetrics } : {}),
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    await prisma.campaignTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
