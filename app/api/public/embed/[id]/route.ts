import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderProjectHtml } from '@/lib/content/render-project-html'

type RouteParams = { params: Promise<{ id: string }> }

/** Public embed endpoint — used by embed.js on live Webflow sites. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const project = await prisma.contentProject.findUnique({
    where: { id },
    include: { template: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const params_ = (project.parameters as Record<string, string>) ?? {}
  const html = project.renderedHtml ?? renderProjectHtml(project, params_)

  return NextResponse.json(
    { html: html ?? '', projectId: project.id, name: project.name },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
