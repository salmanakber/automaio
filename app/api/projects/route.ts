import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'
import { renderProjectHtml } from '@/lib/content/render-project-html'
import { extractBusinessContext, businessContextToParameters } from '@/lib/ai/business-context'
import { personalizeProject } from '@/lib/ai/personalization-engine'
import { enhanceBlogBody } from '@/lib/ai/blog-enhance'
import { ensureAutomaioRuntimeForIntegration } from '@/lib/webflow/runtime-site-embed'
import type { OnboardingInput } from '@/lib/ai/business-context-types'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

    await requireOrgAccess(user, orgId)

    const category = req.nextUrl.searchParams.get('category')
    const projects = await prisma.contentProject.findMany({
      where: {
        organizationId: orgId,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        template: { select: { id: true, name: true } },
        schedules: {
          where: { status: 'scheduled' },
          orderBy: { scheduledFor: 'asc' },
          take: 3,
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      organizationId,
      name,
      description,
      category = 'project',
      contentType = 'cms_entry',
      templateId,
      parameters,
      webflowIntegrationId,
      cmsCollectionId,
      sourceCmsItemId,
      showOnWebsite = true,
      publishSite = false,
      aiEnhance = false,
      onboarding,
    } = body

    if (!organizationId || !name) {
      return NextResponse.json({ error: 'organizationId and name required' }, { status: 400 })
    }

    await requireOrgAccess(user, organizationId)

    let mergedParameters = (parameters as Record<string, string>) ?? {}
    let extractedContext = null

    if (onboarding && typeof onboarding === 'object') {
      extractedContext = await extractBusinessContext(
        onboarding as OnboardingInput,
        organizationId,
      )
      mergedParameters = {
        ...mergedParameters,
        ...businessContextToParameters(extractedContext),
        businessContext: JSON.stringify(extractedContext),
      }
    }

    let renderedHtml: string | null = null
    if (templateId) {
      const template = await prisma.campaignTemplate.findUnique({
        where: { id: templateId },
      })
      if (template) {
        renderedHtml = renderProjectHtml(
          { name, description, category, template, renderedHtml: null },
          mergedParameters,
        )
      }
    }

    const shouldPersonalize = aiEnhance || Boolean(onboarding)

    const project = await prisma.contentProject.create({
      data: {
        organizationId,
        name: mergedParameters.companyName || name,
        description: mergedParameters.body || description,
        category,
        contentType,
        templateId: templateId || null,
        parameters: mergedParameters,
        webflowIntegrationId: webflowIntegrationId || null,
        cmsCollectionId: cmsCollectionId || null,
        sourceCmsItemId: sourceCmsItemId || null,
        showOnWebsite,
        publishSite,
        aiEnhance: shouldPersonalize,
        renderedHtml,
        createdById: user.id,
      },
      include: { template: { select: { id: true, name: true } } },
    })

    if (shouldPersonalize && renderedHtml?.trim()) {
      try {
        const fullProject = await prisma.contentProject.findUnique({
          where: { id: project.id },
          include: { template: true },
        })
        if (fullProject) {
          if (extractedContext) {
            const result = await personalizeProject(fullProject, extractedContext, renderedHtml)
            await prisma.contentProject.update({
              where: { id: project.id },
              data: {
                renderedHtml: result.html,
                parameters: {
                  ...result.parameters,
                  businessContext: JSON.stringify(extractedContext),
                },
              },
            })
          }
        }
      } catch (err) {
        console.error('[Automaio] Auto-personalization failed:', err)
      }
    }

    if (shouldPersonalize && contentType === 'blog_post' && extractedContext) {
      try {
        const params = (project.parameters as Record<string, string>) ?? {}
        const body = params.body ?? mergedParameters.body ?? ''
        if (body.trim()) {
          const enhanced = await enhanceBlogBody(
            body,
            mergedParameters.name ?? name,
            organizationId,
            extractedContext,
          )
          await prisma.contentProject.update({
            where: { id: project.id },
            data: {
              parameters: {
                ...params,
                ...mergedParameters,
                body: enhanced,
                businessContext: JSON.stringify(extractedContext),
              },
              description: enhanced.slice(0, 200),
            },
          })
        }
      } catch (err) {
        console.error('[Automaio] Blog AI enhancement failed:', err)
      }
    }

    const finalProject = await prisma.contentProject.findUnique({
      where: { id: project.id },
      include: { template: { select: { id: true, name: true } } },
    })

    if (webflowIntegrationId && cmsCollectionId) {
      try {
        await ensureAutomaioRuntimeForIntegration(webflowIntegrationId, {
          collectionId: cmsCollectionId,
          publishSite: false,
        })
      } catch {
        // Runtime auto-setup retries on publish
      }
    }

    return NextResponse.json({ project: finalProject ?? project }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
