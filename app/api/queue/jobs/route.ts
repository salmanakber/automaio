import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import {
  campaignGenerationQueue,
  contentGenerationQueue,
  campaignScheduleQueue,
  analyticsQueue,
  addJob,
} from '@/lib/queue/queues'

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession(req.cookies.get('session')?.value || '')
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobType, data } = await req.json()

    if (!jobType || !data) {
      return NextResponse.json({ error: 'Missing jobType or data' }, { status: 400 })
    }

    let job

    switch (jobType) {
      case 'campaign-generation':
        job = await addJob(campaignGenerationQueue, 'generate', data)
        break

      case 'content-generation':
        job = await addJob(contentGenerationQueue, 'generate', data)
        break

      case 'campaign-schedule':
        job = await addJob(campaignScheduleQueue, 'schedule', data)
        break

      case 'analytics':
        job = await addJob(analyticsQueue, 'process', data)
        break

      default:
        return NextResponse.json({ error: 'Unknown job type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobType,
    })
  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await validateSession(req.cookies.get('session')?.value || '')
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const queueName = req.nextUrl.searchParams.get('queue')

    if (!queueName) {
      return NextResponse.json({ error: 'Missing queue parameter' }, { status: 400 })
    }

    let queue

    switch (queueName) {
      case 'campaign-generation':
        queue = campaignGenerationQueue
        break
      case 'content-generation':
        queue = contentGenerationQueue
        break
      case 'campaign-schedule':
        queue = campaignScheduleQueue
        break
      case 'analytics':
        queue = analyticsQueue
        break
      default:
        return NextResponse.json({ error: 'Unknown queue' }, { status: 400 })
    }

    const counts = await queue.getJobCounts()

    return NextResponse.json({
      queueName,
      counts,
    })
  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
