/**
 * Public base URL for OAuth redirects, Webflow app settings, and absolute links.
 * Set NEXTAUTH_URL (server) and NEXT_PUBLIC_APP_URL (client) to your live HTTPS URL
 * (e.g. https://automaio.kilo1app.com).
 */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function appUrl(path: string): string {
  const base = getAppBaseUrl()
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}
