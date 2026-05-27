import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'
import { getDefaultLandingCollectionFields } from '@/lib/webflow/section-cms-bindings'
import {
  formatWebflowCollectionCreateError,
  isDuplicateCollectionError,
} from '@/lib/webflow/webflow-errors'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/** List recommended landing page collection field definitions. */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    await requireOrgAccess(user, orgId)

    return NextResponse.json({
      fields: getDefaultLandingCollectionFields(),
      includesSectionFields: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load field definitions'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/** Create a Webflow CMS collection for landing page content from the app. */
export async function POST(req: NextRequest) {
  let displayName = 'Collection'
  let integrationId: string | undefined

  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = body as {
      organizationId: string
      integrationId: string
      displayName: string
      fields?: Array<{ type: string; displayName: string; isRequired?: boolean }>
      includeSectionFields?: boolean
      setAsPagesCollection?: boolean
    }

    const {
      organizationId,
      fields,
      includeSectionFields = false,
      setAsPagesCollection = true,
    } = parsed

    integrationId = parsed.integrationId
    displayName = parsed.displayName?.trim() || displayName

    if (!organizationId || !integrationId || !displayName) {
      return NextResponse.json(
        { error: 'organizationId, integrationId, and displayName required' },
        { status: 400 },
      )
    }

    await requireOrgAccess(user, organizationId)

    const integration = await prisma.webflowIntegration.findFirst({
      where: { id: integrationId, organizationId },
    })
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const client = new WebflowClient(integration.webflowApiKey)
    const slug = slugify(displayName)
    const singularName = displayName.replace(/s$/i, '') || displayName

    const collectionFields =
      fields?.length
        ? fields
        : getDefaultLandingCollectionFields()

    const collection = await client.createCollection(integration.webflowSiteId, {
      displayName,
      singularName,
      slug,
      fields: collectionFields,
    })

    if (setAsPagesCollection) {
      await prisma.webflowIntegration.update({
        where: { id: integrationId },
        data: { templatesCollectionId: collection.id },
      })
    }

    try {
      await syncWebflowIntegrationV2(organizationId, integrationId)
    } catch {
      // Collection was created — sync can be retried from settings
    }

    return NextResponse.json(
      {
        collection,
        fieldCount: collectionFields.length,
        includesSectionFields: includeSectionFields,
        setAsPagesCollection,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create collection'
    const status = message === 'Forbidden' ? 403 : isDuplicateCollectionError(error) ? 409 : 500

    if (isDuplicateCollectionError(error)) {
      try {
        if (integrationId) {
          const integration = await prisma.webflowIntegration.findFirst({
            where: { id: integrationId },
          })
          if (integration) {
            const client = new WebflowClient(integration.webflowApiKey)
            const slug = slugify(displayName)
            const collections = await client.listCollections(integration.webflowSiteId)
            const existing = collections.find(
              (c) =>
                c.slug === slug ||
                c.displayName.toLowerCase() === displayName.trim().toLowerCase(),
            )
            if (existing) {
              return NextResponse.json(
                {
                  error: formatWebflowCollectionCreateError(error, displayName),
                  alreadyExists: true,
                  existingCollection: existing,
                },
                { status: 409 },
              )
            }
          }
        }

        return NextResponse.json(
          {
            error: formatWebflowCollectionCreateError(error, displayName),
            alreadyExists: true,
          },
          { status: 409 },
        )
      } catch {
        return NextResponse.json(
          { error: formatWebflowCollectionCreateError(error, displayName), alreadyExists: true },
          { status: 409 },
        )
      }
    }

    const friendly =
      message.startsWith('Webflow API') ? formatWebflowCollectionCreateError(error, displayName) : message
    return NextResponse.json({ error: friendly }, { status })
  }
}
