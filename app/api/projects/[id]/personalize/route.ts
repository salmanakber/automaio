import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { extractBusinessContext, businessContextToParameters } from '@/lib/ai/business-context'
import { personalizeProject } from '@/lib/ai/personalization-engine'
import { renderProjectHtml } from '@/lib/content/render-project-html'
import { applyLayoutControlsToHtml, parseLayoutControls } from '@/lib/webflow/layout-controls'
import { parseStoredBusinessContext } from '@/lib/onboarding/persistence'
import type { BusinessContext, OnboardingInput } from '@/lib/ai/business-context-types'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * One-click landing page personalization:
 * 1. Extract/merge business context (website URL or guided answers)
 * 2. Section-aware DOM patch of template HTML
 * 3. Save personalized HTML + parameters
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
    const {
      onboarding,
      businessContext: providedContext,
      customPrompt,
      skipAiRewrite,
    } = body as {
      onboarding?: OnboardingInput
      businessContext?: BusinessContext
      customPrompt?: string
      skipAiRewrite?: boolean
    }

    let context: BusinessContext

    if (providedContext) {
      context = providedContext
    } else if (onboarding) {
      context = await extractBusinessContext(onboarding, project.organizationId)
    } else {
      const params_ = (project.parameters as Record<string, unknown>) ?? {}
      const stored = parseStoredBusinessContext(params_)
      if (stored) {
        context = stored
      } else {
        return NextResponse.json(
          { error: 'Provide onboarding answers or business context' },
          { status: 400 },
        )
      }
    }

    const projectParams = (project.parameters as Record<string, string>) ?? {}
    const templateHtml = project.template
      ? renderProjectHtml({ ...project, renderedHtml: null }, projectParams)
      : ''
    let baseHtml =
      project.renderedHtml?.trim() ||
      templateHtml?.trim() ||
      renderProjectHtml(project, projectParams)

    if (!baseHtml?.trim()) {
      return NextResponse.json(
        { error: 'Select a template or add HTML before personalizing' },
        { status: 400 },
      )
    }

    const layoutControls = parseLayoutControls({
      ...projectParams,
      layoutControls: (projectParams as Record<string, unknown>).layoutControls,
    })
    baseHtml = applyLayoutControlsToHtml(baseHtml, layoutControls)

    let resultHtml = baseHtml
    let updatedCount = 0
    let sectionMap: Record<string, number> = {}
    let mergedParams = {
      ...projectParams,
      ...businessContextToParameters(context),
    }

    if (!skipAiRewrite) {
      const result = await personalizeProject(project, context, baseHtml, customPrompt)
      resultHtml = result.html
      updatedCount = result.updatedCount
      sectionMap = result.sectionMap
      mergedParams = {
        ...result.parameters,
        businessContext: JSON.stringify(context),
        onboardingComplete: 'true',
      } as Record<string, string>
    } else {
      mergedParams = {
        ...mergedParams,
        businessContext: JSON.stringify(context),
        onboardingComplete: 'true',
      }
    }

    const updated = await prisma.contentProject.update({
      where: { id },
      data: {
        renderedHtml: resultHtml,
        parameters: mergedParams,
        aiEnhance: true,
        description: context.description ?? project.description,
        name: context.companyName && context.companyName.length > 2 ? context.companyName : project.name,
      },
    })

    return NextResponse.json({
      project: updated,
      context,
      updatedCount,
      sectionMap,
      personalized: !skipAiRewrite,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Personalization failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
