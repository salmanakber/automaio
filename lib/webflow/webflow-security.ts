/** Allowed inline JS patterns for AI-generated landing pages published to Webflow. */
const BLOCKED_JS_PATTERNS: RegExp[] = [
  /\beval\s*\(/i,
  /\bnew\s+Function\s*\(/i,
  /document\.write\s*\(/i,
  /document\.writeln\s*\(/i,
  /\.innerHTML\s*=\s*[`'"]\s*<script/i,
  /createElement\s*\(\s*['"]script['"]\s*\)/i,
  /javascript\s*:/i,
  /\bon\w+\s*=/i,
  /\bfetch\s*\(\s*['"]https?:\/\/(?!cdn\.|fonts\.|images\.)/i,
]

const ALLOWED_SCRIPT_SRC_HOSTS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
]

export function sanitizeLandingPageJs(js: string): string {
  if (!js?.trim()) return ''

  let output = js.trim()

  for (const pattern of BLOCKED_JS_PATTERNS) {
    if (pattern.test(output)) {
      throw new Error(
        'Generated JavaScript contains unsafe patterns. Remove eval, document.write, or untrusted script loading.',
      )
    }
  }

  // Block external script src unless from allowlisted CDNs
  const srcMatches = [...output.matchAll(/src\s*=\s*['"]([^'"]+)['"]/gi)]
  for (const match of srcMatches) {
    const url = match[1]
    if (!url.startsWith('http')) continue
    const allowed = ALLOWED_SCRIPT_SRC_HOSTS.some((host) => url.includes(host))
    if (!allowed) {
      throw new Error(`External script source not allowed: ${url}`)
    }
  }

  return output
}

export function sanitizeLandingPageHtml(html: string): string {
  if (!html?.trim()) return ''

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
}

export function isAllowedAssetUrl(url: string): boolean {
  if (!url?.trim()) return false
  if (url.startsWith('https://') || url.startsWith('http://')) return true
  if (url.startsWith('//')) return true
  return false
}

export function normalizeAssetUrls(html: string, cdnBase?: string): string {
  if (!cdnBase) {
    return html.replace(
      /(\s(?:src|href)=["'])(\.\/|\.\.\/)([^"']+)(["'])/gi,
      (_, prefix, _rel, path, suffix) => {
        if (cdnBase) return `${prefix}${cdnBase.replace(/\/$/, '')}/${path}${suffix}`
        return `${prefix}#invalid-relative-asset:${path}${suffix}`
      },
    )
  }

  const base = cdnBase.replace(/\/$/, '')
  return html.replace(
    /(\s(?:src|href)=["'])(\.\/|\.\.\/)([^"']+)(["'])/gi,
    (_, prefix, _rel, path, suffix) => `${prefix}${base}/${path}${suffix}`,
  )
}
