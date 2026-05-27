import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import {
  getPlatformRenderingSettings,
  setPlatformRenderingSettings,
  DEFAULT_HTML_LINE_THRESHOLD,
} from '@/lib/platform/rendering-settings'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const settings = await getPlatformRenderingSettings()
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: 'Failed to load rendering settings' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { htmlLineThreshold } = await req.json()
    const threshold = Number(htmlLineThreshold)

    if (!Number.isFinite(threshold) || threshold < 100 || threshold > 50000) {
      return NextResponse.json(
        { error: `htmlLineThreshold must be between 100 and 50000 (default ${DEFAULT_HTML_LINE_THRESHOLD})` },
        { status: 400 },
      )
    }

    await setPlatformRenderingSettings({ htmlLineThreshold: threshold })
    const settings = await getPlatformRenderingSettings()
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: 'Failed to save rendering settings' }, { status: 500 })
  }
}
