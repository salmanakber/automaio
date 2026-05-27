/** Same-origin API fetch defaults (production: https://automaio.kilo1app.com). */
export const LIVE_APP_URL = 'https://automaio.kilo1app.com'

export function apiJsonHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...extra,
  }
}

export function apiFetchInit(init?: RequestInit): RequestInit {
  return {
    credentials: 'same-origin',
    ...init,
  }
}
