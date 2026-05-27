import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const status = req.nextUrl.searchParams.get('status')
    const channel = req.nextUrl.searchParams.get('channel')

    const schedules = await prisma.campaignSchedule.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(channel ? { channel } : {}),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 100,
    })

    const [scheduled, sent, failed, cancelled] = await Promise.all([
      prisma.campaignSchedule.count({ where: { status: 'scheduled' } }),
      prisma.campaignSchedule.count({ where: { status: 'sent' } }),
      prisma.campaignSchedule.count({ where: { status: 'failed' } }),
      prisma.campaignSchedule.count({ where: { status: 'cancelled' } }),
    ])

    return NextResponse.json({
      schedules,
      stats: { scheduled, sent, failed, cancelled, total: scheduled + sent + failed + cancelled },
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}
