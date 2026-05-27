import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { enhanceBlogBody } from '@/lib/ai/blog-enhance'
import { parseStoredBusinessContext } from '@/lib/onboarding/persistence'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (project.contentType !== 'blog_post') {
      return NextResponse.json({ error: 'Blog enhancement only applies to blog posts' }, { status: 400 })
    }

    await requireOrgAccessByUserId(user.id, project.organizationId)

    const body = await req.json().catch(() => ({}))
    const params_ = (project.parameters as Record<string, string>) ?? {}
    const title = params_.name ?? project.name
    const currentBody = (body.body as string) ?? params_.body ?? ''
    const context = parseStoredBusinessContext(params_)

    const enhanced = await enhanceBlogBody(
      currentBody,
      title,
      project.organizationId,
      context,
    )

    const nextParams = { ...params_, body: enhanced }
    await prisma.contentProject.update({
      where: { id },
      data: { parameters: nextParams, description: enhanced.slice(0, 200) },
    })

    return NextResponse.json({ body: enhanced, parameters: nextParams })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Enhancement failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
