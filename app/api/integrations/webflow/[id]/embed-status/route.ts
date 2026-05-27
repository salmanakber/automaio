import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getAppBaseUrl } from '@/lib/app-url'
import { buildCollectionEmbedSnippet } from '@/lib/webflow/embed-setup'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import { ensureAutomaioEmbedForIntegration } from '@/lib/webflow/site-embed'
import { ensureAutomaioRuntimeForIntegration } from '@/lib/webflow/runtime-site-embed'
import { buildWebflowRuntimeCollectionEmbed } from '@/lib/webflow/runtime-embed'

type CollectionsJson = {
  automaioEmbed?: { scriptId?: string; configuredAt?: string }
  automaioRuntime?: { scriptId?: string; configuredAt?: string; collectionId?: string }
}

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

function readCollectionsJson(raw: unknown): CollectionsJson {
  if (!raw || typeof raw !== 'object') return {}
  return raw as CollectionsJson
}

/** Check custom code access and runtime bootstrap status for the connected site. */
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

    const collectionsJson = readCollectionsJson(integration.collections)
    const access = await checkCustomCodeAccess(integration.webflowApiKey, integration.webflowSiteId)
    const appUrl = getAppBaseUrl()

    const runtimeConfigured = Boolean(collectionsJson.automaioRuntime?.scriptId)
    const legacyEmbedConfigured = Boolean(collectionsJson.automaioEmbed?.scriptId)
    const embedConfigured = runtimeConfigured || legacyEmbedConfigured

    let message = access.message
    if (access.ok) {
      if (runtimeConfigured) {
        message =
          'Remote runtime bootstrap is active on your collection template. Pages render from Automaio automatically — no embed paste required.'
      } else if (legacyEmbedConfigured) {
        message =
          'Legacy iframe embed is active. New landing collections use remote runtime instead — sync or publish to upgrade.'
      } else {
        message =
          'Automatic runtime setup is available. Create a landing collection or publish a page to apply it — no manual embed paste needed.'
      }
    }

    return NextResponse.json({
      customCodeAccess: access.ok,
      message,
      runtimeConfigured,
      legacyEmbedConfigured,
      /** @deprecated Use runtimeConfigured — kept for older UI clients */
      embedConfigured,
      runtimeUrl: `${appUrl}/webflow/runtime.js`,
      runtimeCollectionSnippet: buildWebflowRuntimeCollectionEmbed(appUrl),
      collectionEmbedSnippet: buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId),
      templatesCollectionId: integration.templatesCollectionId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check embed status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Retry automatic runtime bootstrap on the collection template (OAuth + custom_code required). */
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

    const preferLegacyEmbed = body.mode === 'iframe_embed'

    const appUrl = getAppBaseUrl()

    if (preferLegacyEmbed) {
      const result = await ensureAutomaioEmbedForIntegration(id, {
        collectionId: collectionId ?? undefined,
        publishSite: body.publishSite !== false,
      })

      if (!result.success) {
        return NextResponse.json({
          success: false,
          needsReconnect: result.needsReconnect,
          error: result.error,
          collectionEmbedSnippet: buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId),
        })
      }

      return NextResponse.json({ success: true, mode: 'iframe_embed', automaioEmbed: result.automaioEmbed })
    }

    const result = await ensureAutomaioRuntimeForIntegration(id, {
      collectionId: collectionId ?? undefined,
      publishSite: body.publishSite !== false,
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        needsReconnect: result.needsReconnect,
        error: result.error,
        runtimeCollectionSnippet: buildWebflowRuntimeCollectionEmbed(appUrl),
        collectionEmbedSnippet: buildCollectionEmbedSnippet(appUrl, integration.webflowSiteId),
      })
    }

    return NextResponse.json({
      success: true,
      mode: 'remote_runtime',
      automaioRuntime: result.automaioRuntime,
      runtimeConfigured: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runtime setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
