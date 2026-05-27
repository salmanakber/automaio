import crypto from 'crypto'

const WEBFLOW_AUTHORIZE_URL = 'https://webflow.com/oauth/authorize'
const WEBFLOW_TOKEN_URL = 'https://api.webflow.com/oauth/access_token'

/** Scopes for Automaio marketplace app (CMS + sites + auto embed). */
export const WEBFLOW_OAUTH_SCOPES = [
  'sites:read',
  'sites:write',
  'pages:read',
  'cms:read',
  'cms:write',
  'custom_code:read',
  'custom_code:write',
  'authorized_user:read',
].join(' ')

export function getWebflowOAuthConfig() {
  const clientId = process.env.WEBFLOW_CLIENT_ID
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET
  const redirectUri =
    process.env.WEBFLOW_REDIRECT_URI ??
    `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/integrations/webflow/oauth/callback`

  return { clientId, clientSecret, redirectUri }
}

export function isWebflowOAuthConfigured() {
  const { clientId, clientSecret } = getWebflowOAuthConfig()
  return Boolean(clientId && clientSecret)
}

export function buildOAuthState(orgId: string) {
  const payload = JSON.stringify({ orgId, nonce: crypto.randomBytes(16).toString('hex') })
  return Buffer.from(payload).toString('base64url')
}

export function parseOAuthState(state: string): { orgId: string } | null {
  try {
    const json = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    if (typeof json.orgId === 'string') return { orgId: json.orgId }
    return null
  } catch {
    return null
  }
}

export function getWebflowAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = getWebflowOAuthConfig()
  if (!clientId) throw new Error('WEBFLOW_CLIENT_ID is not configured')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: WEBFLOW_OAUTH_SCOPES,
    state,
    redirect_uri: redirectUri,
  })

  return `${WEBFLOW_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeWebflowCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getWebflowOAuthConfig()
  if (!clientId || !clientSecret) {
    throw new Error('Webflow OAuth is not configured')
  }

  const response = await fetch(WEBFLOW_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Webflow token exchange failed: ${text}`)
  }

  return response.json() as Promise<{
    access_token: string
    token_type?: string
    scope?: string
  }>
}
