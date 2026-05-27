import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { buildToneSystemPrompt } from '@/lib/ai/tone-presets'
import type { BusinessContext } from '@/lib/ai/business-context-types'

const BLOG_SYSTEM = `You are an expert blog writer and SEO content strategist.
Rewrite the article body as polished HTML suitable for a Webflow Rich Text field.
Use semantic tags: h2, h3, p, ul, li, strong, em, blockquote.
Preserve factual accuracy. Improve clarity, structure, and engagement.
Return ONLY the HTML body fragment — no markdown fences, no outer html/head/body tags.`

function buildBrief(context: BusinessContext | null, title: string): string {
  if (!context) return `Article title: ${title}`
  const parts = [
    `Article title: ${title}`,
    context.companyName ? `Company: ${context.companyName}` : '',
    context.description ? `About: ${context.description}` : '',
    context.targetAudience ? `Audience: ${context.targetAudience}` : '',
    context.primaryGoal ? `Goal: ${context.primaryGoal}` : '',
    context.brandVoice ? `Voice: ${context.brandVoice}` : '',
  ]
  return parts.filter(Boolean).join('\n')
}

export async function enhanceBlogBody(
  bodyHtml: string,
  title: string,
  organizationId: string,
  context?: BusinessContext | null,
): Promise<string> {
  if (!bodyHtml?.trim()) return bodyHtml

  const tonePrompt = context?.tonePreset ? buildToneSystemPrompt(context.tonePreset) : ''
  const userPrompt = `${buildBrief(context ?? null, title)}

Current article HTML:
${bodyHtml.slice(0, 12000)}

Rewrite this article for publication. Keep length similar unless the draft is very short.`

  const result = await aiOrchestrator.generate({
    organizationId,
    systemPrompt: [BLOG_SYSTEM, tonePrompt].filter(Boolean).join('\n\n'),
    prompt: userPrompt,
    maxTokens: 4096,
    temperature: 0.7,
  })

  const text = result.content?.trim() ?? ''
  if (!text) return bodyHtml

  return text
    .replace(/^```html?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}
