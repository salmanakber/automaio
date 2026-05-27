import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { buildToneSystemPrompt } from '@/lib/ai/tone-presets'
import type { BusinessContext } from '@/lib/ai/business-context-types'
import {
  applyTextPatches,
  groupElementsBySection,
  stripPersonalizationMarkers,
  tagTextElements,
  type TextElement,
} from '@/lib/ai/dom-patcher'
import { extractHeadAssets } from '@/lib/webflow/html-assets'
import { extractRichTextFragment } from '@/lib/webflow/embed-setup'

const COPYWRITER_SYSTEM = `You are an expert landing page copywriter and conversion strategist.
Update ONLY plain text for each element. Preserve HTML structure — never add tags or markdown.
Match each element to its HTML tag role (h1 = main headline, h3 in cards = feature titles, buttons = CTAs).
Prioritize conversion: clear value props, trust signals, action-oriented CTAs.
Skip elements that should remain unchanged (copyright years, generic nav labels unless business-specific).
Return ONLY valid JSON mapping element IDs to updated plain text strings.`

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

function buildSectionGuidance(groups: Record<string, TextElement[]>): string {
  const lines: string[] = []
  for (const [section, els] of Object.entries(groups)) {
    if (section === 'general') continue
    lines.push(`- ${section}: ${els.length} element(s) — ${describeSectionIntent(section)}`)
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

function formatElementBlock(elements: TextElement[]): string {
  return elements.map((el) => {
    const sectionNote = el.section ? ` [${el.section}]` : ''
    return `[${el.id}] <${el.tag}>${sectionNote} ${el.text}`
  }).join('\n')
}

export type PersonalizationResult = {
  html: string
  updatedCount: number
  elements: TextElement[]
  sectionMap: Record<string, number>
}

function normalizeAiUpdates(raw: Record<string, unknown>): Record<string, string> {
  const updates: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.trim()) {
      updates[String(key)] = value.trim()
    }
  }
  return updates
}

async function personalizeLandingPageStructural(
  html: string,
  context: BusinessContext,
  organizationId: string,
  customPrompt?: string,
): Promise<string> {
  const headAssets = extractHeadAssets(html)
  const bodyFragment = extractRichTextFragment(html)
  const toneGuidance = buildToneSystemPrompt(context.tonePreset)
  const businessBrief = buildBusinessBrief(context)

  const prompt = `${customPrompt ? `Additional instructions: ${customPrompt}\n\n` : ''}Business context:
${businessBrief}

Rewrite this landing page HTML for the business above. Keep the same structure, classes, and layout.
Update headlines, body copy, CTAs, and feature text. Do not remove sections.
Return ONLY the inner HTML fragment (no markdown fences, no <html> wrapper).`

  const response = await aiOrchestrator.generate({
    prompt: `${prompt}\n\nHTML:\n${bodyFragment.slice(0, 12000)}`,
    systemPrompt: `${COPYWRITER_SYSTEM}\n\n${toneGuidance}`,
    organizationId,
    maxTokens: 6000,
    temperature: 0.65,
  })

  let newBody = response.content.trim().replace(/^```(?:html)?\s*|\s*```$/g, '')
  if (!newBody.includes('<')) {
    throw new Error('AI returned an invalid format during personalization')
  }

  // Section-only output — no html/head/body wrappers (scoped at publish time).
  newBody = newBody
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim()

  const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[0])
    .join('\n')
  const styles = [headAssets, inlineStyles].filter(Boolean).join('\n')
  return styles ? `${styles}\n${newBody}` : newBody
}

export async function personalizeLandingPageHtml(
  html: string,
  context: BusinessContext,
  organizationId: string,
  customPrompt?: string,
): Promise<PersonalizationResult> {
  const cleanHtml = stripPersonalizationMarkers(html)
  const { html: taggedHtml, elements } = tagTextElements(cleanHtml)

  if (elements.length < 3) {
    const structuralHtml = await personalizeLandingPageStructural(
      cleanHtml,
      context,
      organizationId,
      customPrompt,
    )
    return {
      html: structuralHtml,
      updatedCount: elements.length,
      elements,
      sectionMap: {},
    }
  }

  const groups = groupElementsBySection(elements)
  const sectionMap = Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, v.length]),
  )

  const toneGuidance = buildToneSystemPrompt(context.tonePreset)
  const businessBrief = buildBusinessBrief(context)
  const sectionGuidance = buildSectionGuidance(groups)

  const prompt = `${customPrompt ? `Additional instructions: ${customPrompt}\n\n` : ''}Business context:
${businessBrief}

${sectionGuidance}

Current page text elements (format: [id] <tag> [section] text):
${formatElementBlock(elements)}

Rewrite each element for this business. Map hero/features/CTA/testimonials/FAQ sections intelligently.
If a section type has no matching business data, generate appropriate conversion-focused copy.
Return JSON: {"0":"updated text","1":"updated text",...}`

  const response = await aiOrchestrator.generate({
    prompt,
    systemPrompt: `${COPYWRITER_SYSTEM}\n\n${toneGuidance}`,
    organizationId,
    maxTokens: 4000,
    temperature: 0.65,
  })

  let updates: Record<string, string> = {}
  try {
    const raw = response.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    updates = normalizeAiUpdates(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    throw new Error('AI returned an invalid format during personalization')
  }

  if (Object.keys(updates).length === 0) {
    const structuralHtml = await personalizeLandingPageStructural(
      cleanHtml,
      context,
      organizationId,
      customPrompt,
    )
    return {
      html: structuralHtml,
      updatedCount: 0,
      elements,
      sectionMap,
    }
  }

  const patchedHtml = applyTextPatches(taggedHtml, updates)
  const updatedCount = Object.keys(updates).length

  return {
    html: patchedHtml,
    updatedCount,
    elements,
    sectionMap,
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
    onboardingComplete: 'true',
  }

  return { ...result, parameters: mergedParams }
}
