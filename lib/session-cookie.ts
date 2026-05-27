import type { NextRequest, NextResponse } from 'next/server'

/** True when the incoming request was served over HTTPS (direct or via proxy). */
export function isRequestSecure(req: NextRequest): boolean {
  if (req.nextUrl.protocol === 'https:') return true
  const forwarded = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  return forwarded === 'https'
}

/**
 * Set the session cookie.
 * - localhost (HTTP)  → Secure=false, SameSite=Lax
 * - production HTTPS → Secure=true, SameSite=None  (needed for cross-site
 *   redirects like the Webflow OAuth callback)
 */
export function setAuthCookie(response: NextResponse, token: string, req: NextRequest) {
  const secure = isRequestSecure(req)

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

export function clearAuthCookie(response: NextResponse, req: NextRequest) {
  const secure = isRequestSecure(req)

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  })
}
