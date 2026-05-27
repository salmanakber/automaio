import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { aiOrchestrator } from '@/lib/ai/orchestrator'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const paramsJson = (project.parameters as Record<string, string>) ?? {}
    const summary =
      paramsJson.body ||
      project.description ||
      paramsJson.headline ||
      project.name

    const response = await aiOrchestrator.generate({
      prompt: `Project: ${project.name}
Content type: ${project.contentType}
Summary: ${summary}

Generate SEO metadata. Return ONLY valid JSON:
{"seoTitle":"...","seoDescription":"...","ogTitle":"...","ogDescription":"..."}

Rules:
- seoTitle: max 60 chars, compelling
- seoDescription: max 155 chars
- ogTitle/ogDescription: can match or vary slightly for social`,
      systemPrompt: 'You are an SEO expert. Return only JSON, no markdown.',
      organizationId: project.organizationId,
      maxTokens: 400,
      temperature: 0.6,
    })

    const raw = response.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    const seo = JSON.parse(raw) as Record<string, string>

    const updatedParams = {
      ...paramsJson,
      seoTitle: seo.seoTitle ?? paramsJson.seoTitle,
      seoDescription: seo.seoDescription ?? paramsJson.seoDescription,
      ogTitle: seo.ogTitle ?? seo.seoTitle,
      ogDescription: seo.ogDescription ?? seo.seoDescription,
    }

    await prisma.contentProject.update({
      where: { id },
      data: { parameters: updatedParams },
    })

    return NextResponse.json({ seo: updatedParams })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEO generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
