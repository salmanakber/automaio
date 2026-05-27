import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = params
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Verify user has access to campaign
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
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const analytics = await prisma.campaignAnalytics.findMany({
      where: {
        campaignId,
        metricDate: {
          gte: startDate,
        },
      },
      orderBy: { metricDate: 'asc' },
    })

    // Calculate summary statistics
    const summary = {
      totalImpressions: analytics.reduce((sum, a) => sum + a.impressions, 0),
      totalClicks: analytics.reduce((sum, a) => sum + a.clicks, 0),
      totalConversions: analytics.reduce((sum, a) => sum + a.conversions, 0),
      totalRevenue: analytics.reduce((sum, a) => sum + Number(a.revenue), 0),
      avgEngagementRate: analytics.length > 0
        ? analytics.reduce((sum, a) => sum + Number(a.engagementRate), 0) / analytics.length
        : 0,
      avgROI: analytics.length > 0
        ? analytics.reduce((sum, a) => sum + Number(a.roi), 0) / analytics.length
        : 0,
      ctr: analytics.length > 0
        ? (analytics.reduce((sum, a) => sum + a.clicks, 0) / analytics.reduce((sum, a) => sum + a.impressions, 0)) * 100
        : 0,
      conversionRate: analytics.length > 0
        ? (analytics.reduce((sum, a) => sum + a.conversions, 0) / analytics.reduce((sum, a) => sum + a.clicks, 0)) * 100
        : 0,
    }

    return NextResponse.json({
      analytics,
      summary,
      period: { days, startDate },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = params
    const { metricDate, impressions, clicks, conversions, revenue, engagementRate, roi } = await req.json()

    // Verify user has access to campaign
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
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const analytics = await prisma.campaignAnalytics.upsert({
      where: {
        campaignId_metricDate: {
          campaignId,
          metricDate: new Date(metricDate),
        },
      },
      create: {
        campaignId,
        metricDate: new Date(metricDate),
        impressions,
        clicks,
        conversions,
        revenue,
        engagementRate,
        roi,
      },
      update: {
        impressions,
        clicks,
        conversions,
        revenue,
        engagementRate,
        roi,
      },
    })

    return NextResponse.json({ analytics }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating analytics:', error)
    return NextResponse.json({ error: 'Failed to save analytics' }, { status: 500 })
  }
}
