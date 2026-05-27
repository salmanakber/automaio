import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import {
  ensurePlatformPromptsSeeded,
  listActivePlatformPrompts,
  listPromptVersions,
  upsertPlatformPrompt,
} from '@/lib/prompts/prompt-service'
import { ASSET_PROMPT_TYPES, PROMPT_TYPES } from '@/lib/prompts/defaults'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    await ensurePlatformPromptsSeeded()

    const promptType = req.nextUrl.searchParams.get('promptType')
    const industry = req.nextUrl.searchParams.get('industry')
    const versions = req.nextUrl.searchParams.get('versions') === '1'

    if (versions && promptType) {
      const history = await listPromptVersions(
        promptType,
        industry === 'null' || !industry ? null : industry,
      )
      return NextResponse.json({ versions: history })
    }

    let prompts = await listActivePlatformPrompts()

    if (promptType) {
      prompts = prompts.filter((p) => p.promptType === promptType)
    }
    if (industry) {
      prompts = prompts.filter((p) => p.industry === industry)
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch prompts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const body = await req.json()
    const { promptType, industry, promptContent, action } = body

    if (action === 'seed') {
      const result = await ensurePlatformPromptsSeeded()
      return NextResponse.json(result)
    }

    if (!promptType || !promptContent?.trim()) {
      return NextResponse.json({ error: 'promptType and promptContent required' }, { status: 400 })
    }

    const allowed = [PROMPT_TYPES.system, PROMPT_TYPES.industry, ...ASSET_PROMPT_TYPES]

    if (!allowed.includes(promptType)) {
      return NextResponse.json({ error: 'Invalid promptType' }, { status: 400 })
    }

    if (promptType === PROMPT_TYPES.industry && !industry) {
      return NextResponse.json({ error: 'industry required for industry prompts' }, { status: 400 })
    }

    const prompt = await upsertPlatformPrompt({
      promptType,
      industry: promptType === PROMPT_TYPES.industry ? industry : null,
      promptContent: promptContent.trim(),
    })

    return NextResponse.json({ prompt }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save prompt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
