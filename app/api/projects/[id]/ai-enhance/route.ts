import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { generateCampaignPageHtml } from '@/lib/ai/campaign-page-generator'
import { renderProjectHtml } from '@/lib/content/render-project-html'
import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { buildToneSystemPrompt } from '@/lib/ai/tone-presets'
import type { BusinessContext } from '@/lib/ai/business-context-types'
import type { TemplateStructure } from '@/lib/templates/starter-templates'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * Two modes:
 *
 * 1. `mode: "text-only"` (default, cheap)
 *    Receives extracted text elements, sends only the text to AI,
 *    returns updated text. ~500-2000 tokens vs 8000+ for full HTML.
 *
 * 2. `mode: "full"` (expensive, legacy)
 *    Regenerates the entire HTML document from scratch.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({
      where: { id },
      include: { template: true },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const body = await req.json()
    const { prompt, mode = 'text-only', elements } = body
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Describe what you want AI to create' }, { status: 400 })
    }

    const projectParams = (project.parameters as Record<string, string>) ?? {}

    // ── Text-only mode: update just the text, not the HTML structure ──
    if (mode === 'text-only' && elements && typeof elements === 'object') {
      const elementEntries = Object.entries(elements as Record<string, { text: string; tag: string }>)
      if (elementEntries.length === 0) {
        return NextResponse.json({ error: 'No text elements found' }, { status: 400 })
      }

      const inputBlock = elementEntries
        .map(([key, el]) => `[${key}] <${el.tag}> ${el.text}`)
        .join('\n')

      const toneGuidance = buildToneSystemPrompt(projectParams.tone)
      let businessBrief = ''
      if (projectParams.businessContext) {
        try {
          const ctx = JSON.parse(projectParams.businessContext) as BusinessContext
          businessBrief = `\nBusiness context:\n${ctx.companyName ? `Company: ${ctx.companyName}\n` : ''}${ctx.description ? `About: ${ctx.description}\n` : ''}${ctx.targetAudience ? `Audience: ${ctx.targetAudience}\n` : ''}${ctx.offer ? `Offer: ${ctx.offer}\n` : ''}${ctx.ctaGoal ? `CTA goal: ${ctx.ctaGoal}\n` : ''}`
        } catch {
          // ignore parse errors
        }
      }

      const response = await aiOrchestrator.generate({
        prompt: `Project brief:\n${prompt}${businessBrief}\n\nCurrent text elements (one per line, format: [id] <tag> text):\n${inputBlock}\n\nReturn a JSON object where each key is the element id and the value is the updated text string. Example: {"0":"New headline","1":"New paragraph text"}\n\nReturn ONLY valid JSON. No markdown fences, no explanation.`,
        systemPrompt:
          `You are an expert landing page copywriter and conversion strategist. Update ONLY the plain text for each element. Do NOT add HTML tags, markdown, or code. Keep each element appropriate for its HTML tag. Preserve approximate length unless the brief requires otherwise. Return ONLY a JSON object mapping element IDs to updated plain text strings. Never modify code blocks, scripts, or styles.\n\n${toneGuidance}`,
        organizationId: project.organizationId,
        maxTokens: 3000,
        temperature: 0.7,
      })

      try {
        const raw = response.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
        const updated = JSON.parse(raw) as Record<string, string>
        return NextResponse.json({ elements: updated, mode: 'text-only' })
      } catch {
        return NextResponse.json(
          { error: 'AI returned an invalid format — please try again' },
          { status: 500 },
        )
      }
    }

    // ── Full mode: regenerate entire HTML (expensive) ──
    let baseHtml = project.renderedHtml ?? renderProjectHtml(project, projectParams)

    if (!baseHtml?.trim() && !project.template) {
      return NextResponse.json(
        { error: 'Select a template first, then use AI to customize it' },
        { status: 400 },
      )
    }

    if (!baseHtml?.trim() && project.template) {
      baseHtml = renderProjectHtml(project, projectParams)
    }

    const structure = project.template?.templateStructure as TemplateStructure | undefined

    const html = await generateCampaignPageHtml(
      baseHtml || '',
      {
        name: projectParams.name ?? project.name,
        description: project.description,
        launchBrief: prompt,
        industry: projectParams.industry ?? project.category ?? 'General',
        targetAudience:
          projectParams.audience ?? projectParams.targetAudience ?? 'General audience',
        goals: [prompt],
        tone: projectParams.tone,
        style: projectParams.style,
        organizationId: project.organizationId,
      },
      structure?.theme,
    )

    await prisma.contentProject.update({
      where: { id },
      data: { renderedHtml: html },
    })

    return NextResponse.json({ html, updated: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
