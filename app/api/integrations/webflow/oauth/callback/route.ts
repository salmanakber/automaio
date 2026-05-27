import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeWebflowCode, parseOAuthState } from '@/lib/integrations/webflow-oauth'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { syncWebflowIntegrationV2 } from '@/lib/integrations/webflow-cms'

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  console.log('[Webflow OAuth Callback] Full URL:', req.nextUrl.toString())
  console.log('[Webflow OAuth Callback] All params:', Object.fromEntries(req.nextUrl.searchParams.entries()))
  console.log('[Webflow OAuth Callback] Headers:', Object.fromEntries(req.headers.entries()))

  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    console.error('[Webflow OAuth Callback] Webflow returned error:', error)
    return NextResponse.redirect(
      `${baseUrl}/dashboard?webflow=error&message=${encodeURIComponent(error)}`,
    )
  }

  if (!code || !stateParam) {
    console.error('[Webflow OAuth Callback] Missing code or state.', { code: !!code, state: !!stateParam })
    return NextResponse.redirect(
      `${baseUrl}/webflow/install?webflow=error&message=missing_code`,
    )
  }

  const state = parseOAuthState(stateParam)
  if (!state?.orgId) {
    return NextResponse.redirect(`${baseUrl}/webflow/install?webflow=error&message=invalid_state`)
  }

  const orgId = state.orgId

  try {
    const tokenData = await exchangeWebflowCode(code)
    const client = new WebflowClient(tokenData.access_token)
    const sites = await client.listSites()

    if (sites.length === 0) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/${orgId}/settings?tab=integrations&webflow=error&message=no_sites`,
      )
    }

    const site = sites[0]

    const existing = await prisma.webflowIntegration.findFirst({
      where: { organizationId: orgId, webflowSiteId: site.id },
    })

    let integrationId: string
    if (existing) {
      await prisma.webflowIntegration.update({
        where: { id: existing.id },
        data: {
          webflowApiKey: tokenData.access_token,
          siteName: site.displayName,
        },
      })
      integrationId = existing.id
    } else {
      const created = await prisma.webflowIntegration.create({
        data: {
          organizationId: orgId,
          webflowSiteId: site.id,
          webflowApiKey: tokenData.access_token,
          siteName: site.displayName,
        },
      })
      integrationId = created.id
    }

    try {
      await syncWebflowIntegrationV2(orgId, integrationId)
    } catch (syncErr) {
      console.error('[Automaio] OAuth sync warning:', syncErr)
    }

    const sitePicker =
      sites.length > 1 ? `&sites=${sites.length}` : ''

    return NextResponse.redirect(
      `${baseUrl}/dashboard/${orgId}/settings?tab=integrations&webflow=connected${sitePicker}`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'oauth_failed'
    return NextResponse.redirect(
      `${baseUrl}/dashboard/${orgId}/settings?tab=integrations&webflow=error&message=${encodeURIComponent(message)}`,
    )
  }
}
