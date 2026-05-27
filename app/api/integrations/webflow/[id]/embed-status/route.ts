import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getAppBaseUrl } from '@/lib/app-url'
import { buildCollectionEmbedSnippet } from '@/lib/webflow/embed-setup'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import { ensureAutomaioEmbedForIntegration } from '@/lib/webflow/site-embed'

async function getIntegrationForUser(integrationId: string, userId: string) {
  return prisma.webflowIntegration.findFirst({
    where: {
      id: integrationId,
      organization: {
        OR: [{ ownerId: userId }, { teamMembers: { some: { userId } } }],
      },
    },
  })
}

/** Check whether the connected token can manage Webflow custom code (OAuth required). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const integration = await getIntegrationForUser(id, user!.id)
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const collectionsJson = integration.collections as { automaioEmbed?: unknown } | null
    const access = await checkCustomCodeAccess(integration.webflowApiKey, integration.webflowSiteId)
    const appUrl = getAppBaseUrl()

    return NextResponse.json({
      customCodeAccess: access.ok,
      message: access.ok ? 'Automatic embed is available.' : access.message,
      embedConfigured: Boolean(collectionsJson?.automaioEmbed),
      collectionEmbedSnippet: buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check embed status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Retry automatic embed setup (requires OAuth with custom_code scopes). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const integration = await getIntegrationForUser(id, user!.id)
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const collectionId =
      typeof body.collectionId === 'string'
        ? body.collectionId
        : integration.templatesCollectionId ?? integration.campaignsCollectionId

    const result = await ensureAutomaioEmbedForIntegration(id, {
      collectionId: collectionId ?? undefined,
      publishSite: body.publishSite !== false,
    })

    if (!result.success) {
      const appUrl = getAppBaseUrl()
      return NextResponse.json({
        success: false,
        needsReconnect: result.needsReconnect,
        error: result.error,
        collectionEmbedSnippet: buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId),
      })
    }

    return NextResponse.json({ success: true, automaioEmbed: result.automaioEmbed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embed setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
