import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccess } from '@/lib/api/org-access'
import { extractBusinessContext } from '@/lib/ai/business-context'
import type { OnboardingInput } from '@/lib/ai/business-context-types'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, ...input } = body as OnboardingInput & { organizationId: string }

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 })
    }

    await requireOrgAccess(user, organizationId)

    const hasInput =
      input.websiteUrl?.trim() ||
      input.businessDescription?.trim() ||
      input.offer?.trim()

    if (!hasInput) {
      return NextResponse.json(
        { error: 'Provide a website URL or business description' },
        { status: 400 },
      )
    }

    const context = await extractBusinessContext(input, organizationId)

    return NextResponse.json({
      context,
      fallbackUsed: context.extractionStatus !== 'success',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
