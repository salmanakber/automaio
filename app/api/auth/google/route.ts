import { NextRequest, NextResponse } from 'next/server'
import {
  buildGoogleOAuthState,
  getGoogleAuthorizeUrl,
  isGoogleOAuthConfigured,
} from '@/lib/auth/google-oauth'
import { safeRedirectPath } from '@/lib/auth/redirect'

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
      { status: 503 },
    )
  }

  const redirect = safeRedirectPath(req.nextUrl.searchParams.get('redirect'))
  const state = buildGoogleOAuthState(redirect)
  const url = getGoogleAuthorizeUrl(state)

  return NextResponse.redirect(url)
}
