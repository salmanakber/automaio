import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { resolveEmbedSync } from '@/lib/webflow/publishing/embed-sync-service'
import { markRenderEmbedInstalled } from '@/lib/webflow/publishing/embed-sync-state'
import { CONFIG_TYPE_SPLIT_METHOD } from '@/lib/webflow/delivery-config-type'

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

/** Embed sync status for Designer Extension — idempotent render embed install. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  const { id: integrationId } = await params
  const collectionId = req.nextUrl.searchParams.get('collectionId')?.trim()
  if (!collectionId) {
    return NextResponse.json({ error: 'collectionId required' }, { status: 400 })
  }

  const integration = await getIntegrationForUser(integrationId, user.id)
  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }

  const configType = req.nextUrl.searchParams.get('configType')?.trim() || CONFIG_TYPE_SPLIT_METHOD
  const result = await resolveEmbedSync({ integrationId, collectionId, configType })

  return NextResponse.json(result)
}

/** Designer Extension calls after successful one-time embed install. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  const { id: integrationId } = await params
  const body = (await req.json()) as { collectionId?: string; installed?: boolean }

  if (!body.collectionId?.trim()) {
    return NextResponse.json({ error: 'collectionId required' }, { status: 400 })
  }

  const integration = await getIntegrationForUser(integrationId, user.id)
  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }

  if (body.installed) {
    await markRenderEmbedInstalled(integrationId, body.collectionId.trim())
  }

  return NextResponse.json({ ok: true })
}
