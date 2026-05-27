export type ScrapedWebsiteData = {
  url: string
  title?: string
  metaDescription?: string
  headings: string[]
  paragraphs: string[]
  links: Array<{ text: string; href: string }>
  colors: string[]
  ogTitle?: string
  ogDescription?: string
  rawText: string
  success: boolean
  error?: string
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMeta(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']|` +
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    'i',
  )
  const m = html.match(re)
  return m?.[1] ?? m?.[2]
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m?.[1]?.replace(/\s+/g, ' ').trim()
}

function extractHeadings(html: string): string[] {
  const headings: string[] = []
  const re = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[2])
    if (text.length > 2 && text.length < 300) headings.push(text)
  }
  return [...new Set(headings)].slice(0, 20)
}

function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = []
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1])
    if (text.length > 30 && text.length < 800) paragraphs.push(text)
  }
  return [...new Set(paragraphs)].slice(0, 15)
}

function extractLinks(html: string, baseUrl: string): Array<{ text: string; href: string }> {
  const links: Array<{ text: string; href: string }> = []
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[2])
    let href = m[1]
    if (!text || href.startsWith('#') || href.startsWith('javascript:')) continue
    try {
      href = new URL(href, baseUrl).href
    } catch {
      continue
    }
    links.push({ text: text.slice(0, 80), href })
  }
  return links.slice(0, 30)
}

function extractColors(html: string): string[] {
  const colors = new Set<string>()
  const hexRe = /#(?:[0-9a-fA-F]{3}){1,2}\b/g
  const rgbRe = /rgba?\([^)]+\)/gi
  for (const m of html.match(hexRe) ?? []) colors.add(m.toLowerCase())
  for (const m of html.match(rgbRe) ?? []) colors.add(m)
  return [...colors].slice(0, 12)
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export async function scrapeWebsite(urlInput: string): Promise<ScrapedWebsiteData> {
  const url = normalizeUrl(urlInput)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AutomaioBot/1.0 (+https://automaio.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return {
        url,
        headings: [],
        paragraphs: [],
        links: [],
        colors: [],
        rawText: '',
        success: false,
        error: `HTTP ${res.status}`,
      }
    }

    const html = await res.text()
    const rawText = stripTags(html).slice(0, 8000)

    return {
      url,
      title: extractTitle(html),
      metaDescription: extractMeta(html, 'description') ?? extractMeta(html, 'og:description'),
      ogTitle: extractMeta(html, 'og:title'),
      ogDescription: extractMeta(html, 'og:description'),
      headings: extractHeadings(html),
      paragraphs: extractParagraphs(html),
      links: extractLinks(html, url),
      colors: extractColors(html),
      rawText,
      success: true,
    }
  } catch (err) {
    return {
      url,
      headings: [],
      paragraphs: [],
      links: [],
      colors: [],
      rawText: '',
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch website',
    }
  }
}
