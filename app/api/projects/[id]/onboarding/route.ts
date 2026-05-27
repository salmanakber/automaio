import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

/** Persist onboarding draft + step progress on a project. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const params_ = (project.parameters as Record<string, unknown>) ?? {}
    return NextResponse.json({
      onboardingDraft: params_.onboardingDraft ?? null,
      onboardingStep: params_.onboardingStep ?? null,
      onboardingComplete: params_.onboardingComplete === 'true' || params_.onboardingComplete === true,
      businessContext: params_.businessContext ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load onboarding'
    return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const body = await req.json()
    const { onboardingDraft, onboardingStep, onboardingComplete, clearDraft } = body as {
      onboardingDraft?: unknown
      onboardingStep?: number
      onboardingComplete?: boolean
      clearDraft?: boolean
    }

    const existing = (project.parameters as Record<string, string>) ?? {}
    const next: Record<string, string> = { ...existing }

    if (clearDraft) {
      delete next.onboardingDraft
      delete next.onboardingStep
    } else {
      if (onboardingDraft !== undefined) {
        next.onboardingDraft = JSON.stringify(onboardingDraft)
      }
      if (onboardingStep !== undefined) {
        next.onboardingStep = String(onboardingStep)
      }
      if (onboardingComplete !== undefined) {
        next.onboardingComplete = onboardingComplete ? 'true' : 'false'
      }
    }

    const updated = await prisma.contentProject.update({
      where: { id },
      data: { parameters: next },
    })

    return NextResponse.json({ project: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save onboarding'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
