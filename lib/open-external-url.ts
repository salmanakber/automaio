/** Open a URL in a new tab — works around iframe popup blockers (e.g. Webflow Designer). */
export function openExternalUrl(url: string) {
  if (!url || url === '#') return false

  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (win) return true
  } catch {
    // ignore
  }

  return true
}

export function getClientAppOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }
  return (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
}

export function appPathUrl(path: string, query?: Record<string, string>) {
  const base = getClientAppOrigin()
  if (!base) return ''
  const q = query ? `?${new URLSearchParams(query).toString()}` : ''
  return `${base}${path.startsWith('/') ? path : `/${path}`}${q}`
}
