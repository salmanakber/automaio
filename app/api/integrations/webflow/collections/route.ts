import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'
import { getDefaultLandingCollectionFields } from '@/lib/webflow/section-cms-bindings'

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
      includesSectionFields: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load field definitions'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/** Create a Webflow CMS collection for landing page content from the app. */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      organizationId,
      integrationId,
      displayName,
      fields,
      includeSectionFields = true,
      setAsPagesCollection = true,
    } = body as {
      organizationId: string
      integrationId: string
      displayName: string
      fields?: Array<{ type: string; displayName: string; isRequired?: boolean }>
      includeSectionFields?: boolean
      setAsPagesCollection?: boolean
    }

    if (!organizationId || !integrationId || !displayName?.trim()) {
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
        : includeSectionFields
          ? getDefaultLandingCollectionFields()
          : getDefaultLandingCollectionFields().slice(0, 8)

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
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
