import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccess } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { assignFormToWebflowPage } from '@/lib/webflow/form-page-embed'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const form = await prisma.leadForm.findUnique({ where: { id } })
    if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccess(user, form.organizationId)

    const body = await req.json()
    const { integrationId, pageId, pageTitle, publishSite } = body
    if (!integrationId || !pageId) {
      return NextResponse.json({ error: 'Select a Webflow site and page' }, { status: 400 })
    }

    const result = await assignFormToWebflowPage(id, {
      integrationId,
      pageId,
      pageTitle,
      publishSite: publishSite ?? true,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign form to page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
