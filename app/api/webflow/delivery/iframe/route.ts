import { NextRequest, NextResponse } from 'next/server'
import { getIframeDeliveryPayload } from '@/lib/webflow/resolve-published-project'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Public iframe URL for Webflow collection template bootstrap (by site + slug). */
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')?.trim()
  const slug = req.nextUrl.searchParams.get('slug')?.trim()

  if (!siteId || !slug) {
    return NextResponse.json(
      { error: 'siteId and slug required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  try {
    const payload = await getIframeDeliveryPayload(siteId, slug)
    if (!payload) {
      return NextResponse.json(
        { error: 'Published page not found for this slug' },
        { status: 404, headers: CORS_HEADERS },
      )
    }

    return NextResponse.json(payload, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Iframe delivery failed'
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
