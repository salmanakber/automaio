import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { buildToneSystemPrompt } from '@/lib/ai/tone-presets'
import type { BusinessContext } from '@/lib/ai/business-context-types'
import {
  applySemanticSlotPatches,
  buildSemanticPromptFields,
  groupSlotsBySection,
  normalizeSemanticUpdates,
  parseSemanticSlots,
  type SemanticSlot,
} from '@/lib/ai/semantic-slots'
import { preserveTemplateHtmlIntegrity } from '@/lib/content/preserve-template-html'

const SEMANTIC_COPYWRITER_SYSTEM = `You are an expert landing page copywriter and conversion strategist.
You personalize landing pages using SEMANTIC CONTENT SLOTS only.

Rules:
- Return ONLY valid JSON mapping semantic field keys to updated plain text strings
- NEVER generate HTML, tags, markdown, or layout structure
- NEVER add or remove fields — only update values for fields provided
- Match each field's semantic role (hero headline vs CTA vs feature description)
- Preserve approximate length unless constraints specify otherwise
- For fields with inline markup hints, return plain text only — markup is applied automatically
- Skip fields that should remain unchanged (copyright years, generic placeholders)`

function buildBusinessBrief(context: BusinessContext): string {
  const parts = [
    context.companyName ? `Company: ${context.companyName}` : '',
    context.businessType ? `Business type: ${context.businessType}` : '',
    context.description ? `About: ${context.description}` : '',
    context.targetAudience ? `Target audience: ${context.targetAudience}` : '',
    context.offer ? `Offer/product: ${context.offer}` : '',
    context.primaryGoal ? `Landing page goal: ${context.primaryGoal}` : '',
    context.ctaGoal ? `CTA goal: ${context.ctaGoal}` : '',
    context.brandVoice ? `Brand voice: ${context.brandVoice}` : '',
    context.valuePropositions?.length
      ? `Value props:\n${context.valuePropositions.map((v) => `- ${v}`).join('\n')}`
      : '',
    context.services?.length ? `Services: ${context.services.join(', ')}` : '',
    context.testimonials?.length
      ? `Testimonials available: ${context.testimonials.length}`
      : '',
    context.faq?.length ? `FAQ items available: ${context.faq.length}` : '',
    context.ctaLanguage ? `Preferred CTA language: ${context.ctaLanguage}` : '',
    context.keywords?.length ? `Keywords: ${context.keywords.join(', ')}` : '',
  ]
  return parts.filter(Boolean).join('\n')
}

function buildSectionGuidance(groups: Record<string, SemanticSlot[]>): string {
  const lines: string[] = []
  for (const [section, slots] of Object.entries(groups)) {
    if (section === 'general') continue
    lines.push(`- ${section}: ${slots.length} slot(s) — ${describeSectionIntent(section)}`)
  }
  return lines.length ? `Template sections detected:\n${lines.join('\n')}` : ''
}

function describeSectionIntent(section: string): string {
  const intents: Record<string, string> = {
    hero: 'rewrite headline and subheadline for maximum impact',
    features: 'map business value props to feature cards',
    testimonials: 'use extracted testimonials or generate plausible social proof',
    faq: 'address common objections with FAQ-style copy',
    pricing: 'align pricing copy with offer positioning',
    cta: 'optimize call-to-action for conversion goal',
    contact: 'encourage contact with trust-building microcopy',
    footer: 'update company name and minimal footer text only',
    navigation: 'update nav labels if business-specific',
  }
  return intents[section] ?? 'personalize for business context'
}

export type PersonalizationResult = {
  html: string
  updatedCount: number
  elements: Array<{ id: string; tag: string; text: string; section?: string }>
  sectionMap: Record<string, number>
  schema: Record<string, string>
}

function slotsToLegacyElements(slots: SemanticSlot[]) {
  return slots.map((slot, index) => ({
    id: String(index),
    tag: slot.tag,
    text: slot.text,
    section: slot.section,
  }))
}

export async function personalizeLandingPageHtml(
  html: string,
  context: BusinessContext,
  organizationId: string,
  customPrompt?: string,
): Promise<PersonalizationResult> {
  const { html: annotatedHtml, slots, schema } = parseSemanticSlots(html)

  if (slots.length === 0) {
    return {
      html: preserveTemplateHtmlIntegrity(html, html),
      updatedCount: 0,
      elements: [],
      sectionMap: {},
      schema: {},
    }
  }

  const groups = groupSlotsBySection(slots)
  const sectionMap = Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, v.length]),
  )

  const toneGuidance = buildToneSystemPrompt(context.tonePreset)
  const businessBrief = buildBusinessBrief(context)
  const sectionGuidance = buildSectionGuidance(groups)
  const fieldBlock = buildSemanticPromptFields(slots)

  const exampleKeys = slots.slice(0, 3).map((s) => `"${s.field}": "..."`).join(',\n  ')

  const prompt = `${customPrompt ? `Additional instructions: ${customPrompt}\n\n` : ''}Business context:
${businessBrief}

${sectionGuidance}

Semantic content slots (update each field with personalized plain text):
${fieldBlock}

Return JSON only — field keys must match exactly:
{
  ${exampleKeys}${slots.length > 3 ? ',\n  ...' : ''}
}`

  const response = await aiOrchestrator.generate({
    prompt,
    systemPrompt: `${SEMANTIC_COPYWRITER_SYSTEM}\n\n${toneGuidance}`,
    organizationId,
    maxTokens: 4000,
    temperature: 0.65,
  })

  let updates: Record<string, string> = {}
  try {
    const raw = response.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    updates = normalizeSemanticUpdates(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    throw new Error('AI returned an invalid format during personalization')
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('AI returned no personalized content — try again or adjust your business context')
  }

  const patchedHtml = applySemanticSlotPatches(annotatedHtml, updates)
  const mergedHtml = preserveTemplateHtmlIntegrity(html, patchedHtml)

  const updatedCount = slots.filter((slot) => {
    const next = updates[slot.field]
    return next !== undefined && next.trim() !== slot.text.trim()
  }).length

  const mergedSchema = { ...schema }
  for (const [field, value] of Object.entries(updates)) {
    if (value.trim()) mergedSchema[field] = value.trim()
  }

  return {
    html: mergedHtml,
    updatedCount,
    elements: slotsToLegacyElements(slots),
    sectionMap,
    schema: mergedSchema,
  }
}

export async function personalizeProject(
  project: {
    name: string
    description?: string | null
    renderedHtml?: string | null
    parameters?: unknown
    organizationId: string
    template?: { templateStructure: unknown } | null
  },
  context: BusinessContext,
  baseHtml: string,
  customPrompt?: string,
): Promise<PersonalizationResult & { parameters: Record<string, string> }> {
  const result = await personalizeLandingPageHtml(
    baseHtml,
    context,
    project.organizationId,
    customPrompt,
  )

  const params = (project.parameters as Record<string, string>) ?? {}
  const mergedParams: Record<string, string> = {
    ...params,
    companyName: context.companyName ?? params.companyName ?? project.name,
    headline: context.headings?.[0] ?? context.companyName ?? params.headline ?? project.name,
    subheadline: context.description ?? params.subheadline ?? '',
    body: context.description ?? params.body ?? '',
    audience: context.targetAudience ?? params.audience ?? '',
    targetAudience: context.targetAudience ?? params.targetAudience ?? '',
    offer: context.offer ?? params.offer ?? '',
    ctaText: context.ctaLanguage ?? params.ctaText ?? 'Get started',
    industry: context.businessType ?? params.industry ?? '',
    tone: context.tonePreset ?? params.tone ?? '',
    seoTitle: context.seoTitle ?? params.seoTitle ?? '',
    seoDescription: context.seoDescription ?? params.seoDescription ?? '',
    semanticSchema: JSON.stringify(result.schema),
    onboardingComplete: 'true',
  }

  return { ...result, parameters: mergedParams }
}
