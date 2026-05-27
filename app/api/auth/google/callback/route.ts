import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { exchangeGoogleCode, parseGoogleOAuthState } from '@/lib/auth/google-oauth'
import { findOrCreateGoogleUser } from '@/lib/auth/oauth-users'
import { getAppBaseUrl } from '@/lib/app-url'
import { setAuthCookie } from '@/lib/session-cookie'

export async function GET(req: NextRequest) {
  const baseUrl = getAppBaseUrl()
  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=${encodeURIComponent(error)}`,
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=missing_google_code`)
  }

  const state = parseGoogleOAuthState(stateParam)
  if (!state) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=invalid_state`)
  }

  try {
    const profile = await exchangeGoogleCode(code)
    if (!profile.email) {
      throw new Error('Google account has no email')
    }

    const user = await findOrCreateGoogleUser(profile)
    const token = await createSession(user.id)

    const response = NextResponse.redirect(`${baseUrl}${state.redirect}`)
    setAuthCookie(response, token, req)
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'google_auth_failed'
    return NextResponse.redirect(
      `${baseUrl}/auth/login?redirect=${encodeURIComponent(state.redirect)}&error=${encodeURIComponent(message)}`,
    )
  }
}
