import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry')
    const category = searchParams.get('category')

    const templates = await prisma.campaignTemplate.findMany({
      where: industry ? { industry } : {},
      orderBy: { createdAt: 'desc' },
    })

    const filtered = category
      ? templates.filter((t) => {
          const structure = t.templateStructure as { category?: string }
          return structure?.category === category
        })
      : templates

    return NextResponse.json({ templates: filtered })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      industry,
      description,
      templateStructure,
      bestPractices,
      avgPerformanceMetrics,
      orgId,
    } = await req.json()

    if (!name || !industry || !templateStructure) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If orgId provided, verify access
    if (orgId) {
      const hasAccess = await prisma.organization.findFirst({
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

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const template = await prisma.campaignTemplate.create({
      data: {
        name,
        industry,
        description,
        templateStructure,
        bestPractices: bestPractices || [],
        avgPerformanceMetrics,
        organizationId: orgId || null,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
