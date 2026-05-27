import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { buildToneSystemPrompt } from '@/lib/ai/tone-presets'
import type { BusinessContext, OnboardingInput } from '@/lib/ai/business-context-types'
import { scrapeWebsite, type ScrapedWebsiteData } from '@/lib/ai/website-scraper'

const STRATEGIST_SYSTEM = `You are an intelligent landing page strategist and onboarding specialist.
Your job is to understand a business and extract structured data for personalizing a single landing page.
Be conversion-focused. Infer missing details intelligently when data is partial.
Return ONLY valid JSON matching the requested schema. No markdown fences, no explanation.`

function buildFallbackContext(input: OnboardingInput): BusinessContext {
  return {
    companyName: input.businessDescription?.split(/[.,]/)[0]?.slice(0, 60) || undefined,
    businessType: input.businessType,
    description: input.businessDescription,
    targetAudience: input.targetAudience,
    offer: input.offer,
    primaryGoal: input.primaryGoal,
    tonePreset: input.tonePreset,
    ctaGoal: input.ctaGoal,
    websiteUrl: input.websiteUrl,
    extractionSource: 'manual',
    extractionStatus: input.businessDescription ? 'partial' : 'failed',
  }
}

function buildScrapeSummary(scraped: ScrapedWebsiteData): string {
  const parts = [
    scraped.title ? `Title: ${scraped.title}` : '',
    scraped.metaDescription ? `Meta: ${scraped.metaDescription}` : '',
    scraped.headings.length ? `Headings:\n${scraped.headings.map((h) => `- ${h}`).join('\n')}` : '',
    scraped.paragraphs.length
      ? `Content:\n${scraped.paragraphs.slice(0, 8).join('\n\n')}`
      : '',
    scraped.rawText ? `Page text excerpt:\n${scraped.rawText.slice(0, 2500)}` : '',
  ]
  return parts.filter(Boolean).join('\n\n')
}

export async function extractBusinessContext(
  input: OnboardingInput,
  organizationId: string,
): Promise<BusinessContext> {
  let scraped: ScrapedWebsiteData | null = null

  if (input.websiteUrl?.trim()) {
    scraped = await scrapeWebsite(input.websiteUrl)
  }

  const hasScrapedContent = scraped?.success && (scraped.headings.length > 0 || scraped.paragraphs.length > 0)
  const hasManualInput = Boolean(input.businessDescription?.trim() || input.offer?.trim())

  if (!hasScrapedContent && !hasManualInput) {
    return buildFallbackContext(input)
  }

  const toneGuidance = buildToneSystemPrompt(input.tonePreset)
  const scrapeBlock = scraped?.success ? buildScrapeSummary(scraped) : 'Website scraping failed or returned no content.'

  const prompt = `Extract business context for landing page personalization.

User onboarding answers:
- Business description: ${input.businessDescription ?? '(not provided)'}
- Primary goal: ${input.primaryGoal ?? '(not provided)'}
- Target audience: ${input.targetAudience ?? '(not provided)'}
- Offer/product: ${input.offer ?? '(not provided)'}
- CTA goal: ${input.ctaGoal ?? '(not provided)'}
- Website URL: ${input.websiteUrl ?? '(not provided)'}

Website analysis:
${scrapeBlock}

Return JSON with these fields (omit empty arrays):
{
  "companyName": "string",
  "businessType": "string",
  "description": "string — 1-2 sentence summary",
  "targetAudience": "string",
  "offer": "string — main product/service promoted",
  "primaryGoal": "string",
  "ctaGoal": "leads|bookings|app_installs|sales|awareness",
  "services": ["string"],
  "valuePropositions": ["string"],
  "testimonials": [{"quote":"string","author":"string","role":"string"}],
  "faq": [{"question":"string","answer":"string"}],
  "headings": ["string"],
  "brandVoice": "string",
  "ctaLanguage": "string — suggested primary CTA text",
  "socialLinks": {"linkedin":"url","twitter":"url"},
  "colors": ["#hex"],
  "keywords": ["string"],
  "seoTitle": "string",
  "seoDescription": "string"
}`

  try {
    const response = await aiOrchestrator.generate({
      prompt,
      systemPrompt: `${STRATEGIST_SYSTEM}\n\n${toneGuidance}`,
      organizationId,
      maxTokens: 2500,
      temperature: 0.4,
    })

    const raw = response.content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
    const parsed = JSON.parse(raw) as Partial<BusinessContext>

    return {
      ...parsed,
      websiteUrl: input.websiteUrl,
      tonePreset: input.tonePreset,
      primaryGoal: parsed.primaryGoal ?? input.primaryGoal,
      targetAudience: parsed.targetAudience ?? input.targetAudience,
      offer: parsed.offer ?? input.offer,
      ctaGoal: parsed.ctaGoal ?? input.ctaGoal,
      colors: parsed.colors?.length ? parsed.colors : scraped?.colors,
      headings: parsed.headings?.length ? parsed.headings : scraped?.headings,
      seoTitle: parsed.seoTitle ?? scraped?.ogTitle ?? scraped?.title,
      seoDescription: parsed.seoDescription ?? scraped?.metaDescription,
      extractionSource: hasScrapedContent && hasManualInput ? 'hybrid' : hasScrapedContent ? 'website' : 'manual',
      extractionStatus: hasScrapedContent || hasManualInput ? 'success' : 'partial',
    }
  } catch {
    const fallback = buildFallbackContext(input)
    if (scraped?.success) {
      fallback.companyName = scraped.title?.split(/[|\-–]/)[0]?.trim()
      fallback.headings = scraped.headings
      fallback.description = scraped.paragraphs[0] ?? fallback.description
      fallback.seoTitle = scraped.title
      fallback.seoDescription = scraped.metaDescription
      fallback.colors = scraped.colors
      fallback.extractionSource = 'website'
      fallback.extractionStatus = 'partial'
    }
    return fallback
  }
}

export function businessContextToParameters(
  context: BusinessContext,
): Record<string, string> {
  return {
    companyName: context.companyName ?? '',
    headline: context.headings?.[0] ?? context.companyName ?? '',
    subheadline: context.description ?? '',
    body: context.description ?? '',
    audience: context.targetAudience ?? '',
    targetAudience: context.targetAudience ?? '',
    offer: context.offer ?? '',
    ctaText: context.ctaLanguage ?? 'Get started',
    industry: context.businessType ?? '',
    tone: context.tonePreset ?? '',
    seoTitle: context.seoTitle ?? '',
    seoDescription: context.seoDescription ?? '',
    primaryGoal: context.primaryGoal ?? '',
    ctaGoal: context.ctaGoal ?? '',
    onboardingComplete: 'true',
  }
}
