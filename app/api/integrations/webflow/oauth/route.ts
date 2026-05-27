import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import {
  buildOAuthState,
  getWebflowAuthorizeUrl,
  isWebflowOAuthConfigured,
} from '@/lib/integrations/webflow-oauth'

/**
 * Starts Webflow OAuth for App Marketplace install / reconnect.
 * Query: orgId (required)
 */
export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req)
  if (!user) {
    const login = new URL('/auth/login', req.url)
    login.searchParams.set('redirect', '/webflow/install')
    return NextResponse.redirect(login)
  }
  if (response) return response

  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return NextResponse.redirect(new URL('/webflow/install', req.url))
  }

  if (!isWebflowOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          'Webflow OAuth is not configured. Set WEBFLOW_CLIENT_ID and WEBFLOW_CLIENT_SECRET in .env',
      },
      { status: 503 },
    )
  }

  const state = buildOAuthState(orgId)
  const authorizeUrl = getWebflowAuthorizeUrl(state)

  console.log('[Webflow OAuth] Redirecting to authorize URL:', authorizeUrl)

  return NextResponse.redirect(authorizeUrl)
}
