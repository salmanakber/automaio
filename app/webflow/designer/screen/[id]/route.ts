import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { loadDesignerScreenPreview } from '@/lib/webflow/designer-screens'

/** Full HTML preview document for Designer iframe (split_method layout). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get('auth_token')?.value
  const user = await validateSession(token || '')
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const preview = await loadDesignerScreenPreview(id, user.id)
  if (!preview) {
    return new NextResponse('Screen not found', { status: 404 })
  }

  return new NextResponse(preview.documentHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, max-age=60',
    },
  })
}
