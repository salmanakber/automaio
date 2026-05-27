import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { applyThemeToHtml, resolveTemplateTheme, type TemplateTheme } from '@/lib/templates/theme'
import { buildCampaignSystemPrompt } from '@/lib/prompts/prompt-service'

export type CampaignPageBrief = {
  name: string
  description?: string | null
  /** Product launch story — main input for AI copy */
  launchBrief?: string | null
  industry: string
  targetAudience: string
  goals: string[]
  tone?: string
  style?: string
  organizationId: string
}

function extractHtmlFromModelOutput(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:html)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const docStart = trimmed.search(/<!DOCTYPE html>|<html[\s>]/i)
  if (docStart >= 0) return trimmed.slice(docStart).trim()

  if (trimmed.startsWith('<')) return trimmed

  throw new Error('AI did not return valid HTML. Try again or shorten your brief.')
}

/**
 * AI writes real marketing copy into the theme layout — no {{placeholders}} required.
 */
export async function generateCampaignPageHtml(
  templateHtml: string,
  brief: CampaignPageBrief,
  theme?: TemplateTheme | null,
): Promise<string> {
  const resolvedTheme = resolveTemplateTheme({ theme: theme ?? undefined })
  const themedLayout = applyThemeToHtml(templateHtml, resolvedTheme)

  const promptVars = {
    industry: brief.industry,
    targetAudience: brief.targetAudience,
    goals: brief.goals,
    tone: brief.tone,
    style: brief.style,
    primaryGoal: brief.goals[0],
    organizationId: brief.organizationId,
  }

  const systemPrompt = `${await buildCampaignSystemPrompt(promptVars)}

You output complete, production-ready HTML for a marketing landing page.

Rules:
- Return ONLY the full HTML document (DOCTYPE, html, head, body). No markdown outside the document.
- Replace ALL placeholder-looking text with compelling, specific copy based on the campaign brief.
- Do NOT use {{mustache}} or [[placeholder]] tokens — use final customer-facing text.
- Keep the same overall layout, sections, and CSS classes as the template unless the brief requires a clear structural change.
- Preserve theme: keep the automaio-template-theme style block and CSS variables if present.
- Use realistic CTAs, headlines, and body copy tailored to the product launch.
- For images: use https://placehold.co/ URLs with descriptive alt text, or keep existing img src if appropriate.
- Include meta charset and viewport in head.`

  const userPrompt = `Campaign name: ${brief.name}

Launch / product brief (primary source for copy):
${brief.launchBrief || brief.description || brief.name}

Additional context:
- Industry: ${brief.industry}
- Audience: ${brief.targetAudience}
- Goals: ${brief.goals.join(', ')}
${brief.tone ? `- Tone: ${brief.tone}` : ''}
${brief.style ? `- Visual style: ${brief.style}` : ''}

Template HTML (layout + styles to adapt — fill with real copy):
${themedLayout}`

  const response = await aiOrchestrator.generate({
    prompt: userPrompt,
    systemPrompt,
    organizationId: brief.organizationId,
    maxTokens: 8000,
    temperature: 0.75,
  })

  const html = extractHtmlFromModelOutput(response.content)
  return applyThemeToHtml(html, resolvedTheme)
}
