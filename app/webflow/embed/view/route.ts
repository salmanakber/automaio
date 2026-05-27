import { NextRequest } from 'next/server'
import { embedHtmlResponse, getSlugEmbedHtml } from '@/lib/webflow/embed-page'

/** Iframe document resolved by Webflow site + CMS slug — clean HTML, no layout. */
export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('siteId')
  const slug = req.nextUrl.searchParams.get('slug')
  const collectionId = req.nextUrl.searchParams.get('collectionId') ?? undefined

  if (!siteId || !slug) {
    return embedHtmlResponse('', 'Automaio')
  }

  const result = await getSlugEmbedHtml(siteId, slug, collectionId)
  if (!result?.html) {
    return embedHtmlResponse('', 'Automaio')
  }
  return embedHtmlResponse(result.html, result.name)
}
