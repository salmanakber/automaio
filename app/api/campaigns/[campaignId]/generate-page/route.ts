import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCampaignPageHtml } from '@/lib/ai/campaign-page-generator'
import { getTemplateHtml } from '@/lib/webflow/template-renderer'
import { STARTER_TEMPLATES } from '@/lib/templates/starter-templates'
import type { TemplateStructure } from '@/lib/templates/starter-templates'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params
    const body = await req.json().catch(() => ({}))
    const launchBriefOverride =
      typeof body.launchBrief === 'string' ? body.launchBrief : undefined

    const campaign = await prisma.campaign.findFirst({
      where: {
        AND: [
          { id: campaignId },
          {
            organization: {
              OR: [
                { ownerId: user.id },
                { teamMembers: { some: { userId: user.id } } },
              ],
            },
          },
        ],
      },
      include: { template: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    let structure: TemplateStructure | null = null
    let templateHtml = ''

    if (campaign.template) {
      structure = campaign.template.templateStructure as TemplateStructure
      templateHtml = getTemplateHtml(structure)
    } else {
      const defaultStarter =
        STARTER_TEMPLATES.find((t) => t.templateStructure.category === 'landing') ??
        STARTER_TEMPLATES[0]
      structure = defaultStarter.templateStructure
      templateHtml = getTemplateHtml(structure)
    }

    if (!templateHtml.trim()) {
      return NextResponse.json({ error: 'No default template available' }, { status: 400 })
    }

    const html = await generateCampaignPageHtml(
      templateHtml,
      {
        name: campaign.name,
        description: campaign.description,
        launchBrief: launchBriefOverride ?? campaign.description,
        industry: campaign.industry,
        targetAudience: campaign.targetAudience,
        goals: campaign.goals,
        organizationId: campaign.organizationId,
      },
      structure?.theme,
    )

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { renderedHtml: html },
    })

    return NextResponse.json({ campaign: updated, html })
  } catch (error) {
    console.error('generate-page error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
