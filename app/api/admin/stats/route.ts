import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const [totalCampaigns, totalUsers, activeModels, totalTemplates, organizations] =
      await Promise.all([
        prisma.campaign.count(),
        prisma.user.count(),
        prisma.aIModelConfig.count({ where: { isActive: true } }),
        prisma.campaignTemplate.count(),
        prisma.organization.count(),
      ])

    return NextResponse.json({
      totalCampaigns,
      totalUsers,
      activeModels,
      totalTemplates,
      organizations,
      systemHealth: 'Good',
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
