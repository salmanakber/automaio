import { NextRequest } from 'next/server'
import { embedHtmlResponse, getProjectEmbedHtml } from '@/lib/webflow/embed-page'

type RouteParams = { params: Promise<{ id: string }> }

/** Iframe document for a published project — isolated, clean HTML page (no navbar/footer). */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await getProjectEmbedHtml(id)
  if (!result?.html) {
    return embedHtmlResponse(
      '<p style="font-family:system-ui;padding:2rem;color:#b45309;text-align:center">Project not found or no content yet. Publish from the Automaio dashboard.</p>',
      'Automaio',
    )
  }
  return embedHtmlResponse(result.html, result.name)
}
