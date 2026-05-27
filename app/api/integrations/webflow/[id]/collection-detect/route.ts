import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import { detectCollectionCapabilities } from '@/lib/webflow/collection-detect'

type RouteParams = { params: Promise<{ id: string }> }

/** Auto-detect collection fields, content types, and iframe vs CMS render mode. */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const collectionId = req.nextUrl.searchParams.get('collectionId')
    const htmlLines = Number(req.nextUrl.searchParams.get('htmlLines') ?? '200')

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId required' }, { status: 400 })
    }

    const integration = await prisma.webflowIntegration.findUnique({ where: { id } })
    if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, integration.organizationId)

    const cached = (
      integration.collections as {
        collections?: Array<{ id: string; fields?: Array<{ slug: string; name: string; type: string }> }>
      } | null
    )?.collections?.find((c) => c.id === collectionId)

    let fields = cached?.fields ?? []
    if (!fields.length) {
      const client = new WebflowClient(integration.webflowApiKey)
      const detail = await client.getCollection(collectionId)
      fields = detail.fields?.map((f) => ({
        slug: f.slug,
        name: f.displayName,
        type: f.type,
      })) ?? []
    }

    const customCode = await checkCustomCodeAccess(
      integration.webflowApiKey,
      integration.webflowSiteId,
    )

    const assignedRole =
      collectionId === integration.templatesCollectionId
        ? 'pages'
        : collectionId === integration.campaignsCollectionId
          ? 'blog'
          : null

    const capabilities = detectCollectionCapabilities(collectionId, fields, {
      hasCustomCodeAccess: customCode.ok,
      htmlLineCount: htmlLines,
      assignedRole,
    })

    return NextResponse.json({
      capabilities,
      fields: fields.map((f) => ({ slug: f.slug, name: f.name, type: f.type })),
      assignedRole,
      customCodeAccess: customCode.ok,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Detection failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
