import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getAppBaseUrl } from '@/lib/app-url'
import { checkCustomCodeAccess } from '@/lib/webflow/embed-permissions'
import { buildWebflowRuntimeCollectionEmbed } from '@/lib/webflow/runtime-embed'
import {
  ensureCollectionDeliverySetup,
  getCollectionTemplateSnippet,
} from '@/lib/webflow/collection-delivery-setup'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'

type CollectionsJson = {
  automaioEmbed?: { scriptId?: string; configuredAt?: string }
  automaioRuntime?: { scriptId?: string; configuredAt?: string; collectionId?: string }
  automaioDelivery?: { mode?: PublishHtmlMode; scriptId?: string; configuredAt?: string }
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

const DELIVERY_MODES: PublishHtmlMode[] = ['remote_runtime', 'split_plain_text', 'iframe_embed']

function parseDeliveryMode(raw: unknown): PublishHtmlMode {
  if (typeof raw === 'string' && DELIVERY_MODES.includes(raw as PublishHtmlMode)) {
    return raw as PublishHtmlMode
  }
  return 'remote_runtime'
}

/** Check custom code access and delivery bootstrap status for the connected site. */
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

    const deliveryMode = collectionsJson.automaioDelivery?.mode
    const runtimeConfigured = Boolean(
      collectionsJson.automaioRuntime?.scriptId ||
        (deliveryMode === 'remote_runtime' && collectionsJson.automaioDelivery?.scriptId),
    )
    const deliveryConfigured = Boolean(collectionsJson.automaioDelivery?.scriptId)
    const legacyEmbedConfigured = Boolean(collectionsJson.automaioEmbed?.scriptId)
    const embedConfigured = runtimeConfigured || deliveryConfigured || legacyEmbedConfigured

    let message = access.ok
      ? 'Custom code access is available.'
      : access.message
    if (access.ok) {
      if (deliveryMode === 'split_plain_text' && deliveryConfigured) {
        message =
          'Split HTML delivery is active — collection template loads html, css, and js from CMS Plain Text fields.'
      } else if (deliveryMode === 'iframe_embed' && deliveryConfigured) {
        message =
          'Iframe embed delivery is active — collection template loads iframe-url from CMS.'
      } else if (runtimeConfigured) {
        message =
          'Remote runtime bootstrap is active on your collection template. Pages render from Automaio automatically.'
      } else if (legacyEmbedConfigured) {
        message =
          'Legacy site embed detected. Publish a landing page to switch to remote runtime, split HTML, or iframe embed.'
      } else {
        message =
          'Automatic delivery setup is available. Publish a landing page or run setup to configure the collection template.'
      }
    }

    const activeMode = deliveryMode ?? (runtimeConfigured ? 'remote_runtime' : undefined)

    return NextResponse.json({
      customCodeAccess: access.ok,
      message,
      deliveryMode: activeMode,
      runtimeConfigured,
      deliveryConfigured,
      legacyEmbedConfigured,
      /** @deprecated Use runtimeConfigured / deliveryConfigured */
      embedConfigured,
      runtimeUrl: `${appUrl}/webflow/runtime.js`,
      runtimeCollectionSnippet: buildWebflowRuntimeCollectionEmbed(appUrl),
      collectionTemplateSnippet: activeMode
        ? getCollectionTemplateSnippet(activeMode, appUrl)
        : getCollectionTemplateSnippet('remote_runtime', appUrl),
      templatesCollectionId: integration.templatesCollectionId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check embed status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Configure collection template for a delivery mode (OAuth + custom_code required). */
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

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Select a collection or pass collectionId in the request body.' },
        { status: 400 },
      )
    }

    const mode = parseDeliveryMode(body.mode)
    const appUrl = getAppBaseUrl()

    const result = await ensureCollectionDeliverySetup(id, {
      collectionId,
      mode,
      publishSite: body.publishSite !== false,
      force: body.force === true,
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        needsReconnect: result.needsReconnect,
        error: result.error,
        mode,
        collectionTemplateSnippet: result.collectionTemplateSnippet,
        runtimeCollectionSnippet:
          mode === 'remote_runtime' ? buildWebflowRuntimeCollectionEmbed(appUrl) : undefined,
      })
    }

    return NextResponse.json({
      success: true,
      mode: result.mode,
      templateAutoConfigured: result.templateAutoConfigured,
      collectionTemplateSnippet: result.collectionTemplateSnippet,
      runtimeConfigured: mode === 'remote_runtime',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delivery setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
