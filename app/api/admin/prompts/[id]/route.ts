import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getPlatformOrganizationId } from '@/lib/prompts/platform-org'
import { restorePromptVersion } from '@/lib/prompts/prompt-service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const organizationId = await getPlatformOrganizationId()

    const prompt = await prisma.promptIntelligence.findFirst({
      where: { id, organizationId },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch prompt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const body = await req.json()

    if (body.action === 'restore') {
      const prompt = await restorePromptVersion(id)
      return NextResponse.json({ prompt })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update prompt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
