import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import { prisma } from '@/lib/prisma'
import { aiOrchestrator } from '@/lib/ai/orchestrator'

type RouteParams = { params: Promise<{ id: string }> }

const TAG_LABELS: Record<string, string> = {
  h1: 'main headline',
  h2: 'section heading',
  h3: 'subheading',
  h4: 'minor heading',
  h5: 'small heading',
  h6: 'small heading',
  p: 'paragraph',
  a: 'link text',
  button: 'call-to-action button',
  li: 'list item',
  span: 'inline text',
  blockquote: 'quote',
  label: 'form label',
  figcaption: 'image caption',
}

/**
 * Update a single text element via AI — costs ~100-300 tokens per call
 * instead of 8000+ for regenerating the entire page.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const body = await req.json()
    const { text, tag, prompt } = body
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Describe what you want' }, { status: 400 })
    }

    const elementType = TAG_LABELS[tag] || 'text element'

    const response = await aiOrchestrator.generate({
      prompt: `Element type: ${elementType} (<${tag}>)
Current text: "${text}"

User request: ${prompt}

Return ONLY the updated text. No quotes, no explanation, no markdown fences.`,
      systemPrompt: `You are an expert marketing copywriter. Update the given text element for a landing page. Keep it concise and appropriate for a ${elementType}. Match the approximate length of the original unless the user asks for more or less. Return ONLY the replacement text — nothing else.`,
      organizationId: project.organizationId,
      maxTokens: 400,
      temperature: 0.7,
    })

    return NextResponse.json({ text: response.content.trim().replace(/^["']|["']$/g, '') })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
