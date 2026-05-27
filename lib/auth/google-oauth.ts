import crypto from 'crypto'
import { getAppBaseUrl } from '@/lib/app-url'
import { safeRedirectPath } from '@/lib/auth/redirect'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${getAppBaseUrl()}/api/auth/google/callback`

  return { clientId, clientSecret, redirectUri }
}

export function isGoogleOAuthConfigured() {
  const { clientId, clientSecret } = getGoogleOAuthConfig()
  return Boolean(clientId && clientSecret)
}

export function buildGoogleOAuthState(redirect: string) {
  const payload = JSON.stringify({
    redirect: safeRedirectPath(redirect),
    nonce: crypto.randomBytes(16).toString('hex'),
  })
  return Buffer.from(payload).toString('base64url')
}

export function parseGoogleOAuthState(state: string): { redirect: string } | null {
  try {
    const json = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    if (typeof json.redirect === 'string') {
      return { redirect: safeRedirectPath(json.redirect) }
    }
    return null
  } catch {
    return null
  }
}

export function getGoogleAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig()
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig()
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured')
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${await tokenRes.text()}`)
  }

  const tokens = (await tokenRes.json()) as { access_token: string }

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!profileRes.ok) {
    throw new Error('Failed to load Google profile')
  }

  return profileRes.json() as Promise<{
    sub: string
    email: string
    given_name?: string
    family_name?: string
    picture?: string
  }>
}
