import { INDUSTRIES, type Industry } from '@/lib/industries'

export const PROMPT_TYPES = {
  system: 'system',
  industry: 'industry',
  assetHeadline: 'asset_headline',
  assetBodyCopy: 'asset_body_copy',
  assetCta: 'asset_cta',
  assetSubjectLine: 'asset_subject_line',
  assetVisual: 'asset_visual_description',
} as const

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES]

export const ASSET_PROMPT_TYPES: PromptType[] = [
  PROMPT_TYPES.assetHeadline,
  PROMPT_TYPES.assetBodyCopy,
  PROMPT_TYPES.assetCta,
  PROMPT_TYPES.assetSubjectLine,
  PROMPT_TYPES.assetVisual,
]

export const DEFAULT_SYSTEM_PROMPT = `You are an expert marketing strategist for Automaio.
Generate compelling, conversion-focused marketing content that matches the client's industry and audience.
Always align with stated campaign goals. Use clear, professional language unless the brief asks otherwise.
Respect brand tone when provided.`

export function getDefaultIndustryPrompt(industry: string): string {
  const guides: Record<string, string> = {
    SaaS: 'Emphasize free trials, onboarding, feature education, and ROI. Use product-led growth angles.',
    'E-commerce': 'Use urgency, social proof, drops, and clear offers. Highlight shipping and returns when relevant.',
    Agency: 'Focus on case studies, portfolio wins, and client results. Position expertise and process.',
    B2B: 'Lead with business outcomes, decision-maker pain points, and credible proof points.',
    Technology: 'Balance innovation with clarity. Avoid jargon; explain benefits for technical and non-technical readers.',
    Marketing: 'Speak to marketers: metrics, channels, automation, and creative performance.',
    Finance: 'Prioritize trust, compliance tone, security, and measurable financial outcomes.',
    Healthcare: 'Use empathetic, compliant language. Emphasize care quality, access, and patient outcomes.',
    Education: 'Focus on learning outcomes, credentials, community, and student success stories.',
    'Real Estate': 'Highlight location, lifestyle, investment value, and agent expertise.',
    'Local Business': 'Use geo-targeted offers, reviews, community ties, and clear local CTAs.',
    Hospitality: 'Evoke experience, comfort, reviews, and seasonal promotions.',
    'Food & Beverage': 'Sensory language, freshness, occasions, and limited-time offers.',
    'Fashion & Retail': 'Trend, style, exclusivity, and seasonal collections.',
    'Fitness & Wellness': 'Transformation, community, programs, and health benefits.',
    Legal: 'Professional, trustworthy tone. Clear services and consultation CTAs without guarantees.',
    'Non-profit': 'Mission-driven storytelling, impact metrics, and donation/volunteer CTAs.',
    'Creative & Design': 'Showcase craft, portfolio, process, and creative differentiation.',
    'Webflow & No-code': 'Speed to launch, CMS flexibility, and agency/freelancer workflows.',
    Other: 'Adapt messaging to the specific brief. Stay benefit-led and audience-aware.',
  }

  return (
    guides[industry] ??
    `Apply best practices for the ${industry} vertical: clear value proposition, audience-specific benefits, and strong CTAs.`
  )
}

export const DEFAULT_ASSET_PROMPTS: Record<string, string> = {
  [PROMPT_TYPES.assetHeadline]: `Generate 3 compelling email subject lines for a {{industry}} campaign targeting {{targetAudience}}.
Goals: {{goals}}. Short, punchy, action-oriented.`,
  [PROMPT_TYPES.assetBodyCopy]: `Write a persuasive email body (150-200 words) for {{industry}} targeting {{targetAudience}}.
Goals: {{goals}}. Benefits over features. Include social proof if relevant.`,
  [PROMPT_TYPES.assetCta]: `Create 3 powerful call-to-action button texts for a {{industry}} campaign.
Encourage {{primaryGoal}}. Action-oriented, under 6 words each.`,
  [PROMPT_TYPES.assetSubjectLine]: `Generate 5 A/B testable subject lines for {{industry}} email to {{targetAudience}}.
Mix urgency, curiosity, and benefits. Under 60 characters each.`,
  [PROMPT_TYPES.assetVisual]: `Describe 3 visual concepts for a {{industry}} landing page for {{targetAudience}}.
Goals: {{goals}}. Include color and layout ideas.`,
}

export function buildDefaultPromptSeeds(organizationId: string) {
  const rows: Array<{
    organizationId: string
    promptContent: string
    promptType: string
    industry: string | null
    version: number
    isActive: boolean
  }> = [
    {
      organizationId,
      promptContent: DEFAULT_SYSTEM_PROMPT,
      promptType: PROMPT_TYPES.system,
      industry: null,
      version: 1,
      isActive: true,
    },
  ]

  for (const industry of INDUSTRIES) {
    rows.push({
      organizationId,
      promptContent: getDefaultIndustryPrompt(industry),
      promptType: PROMPT_TYPES.industry,
      industry,
      version: 1,
      isActive: true,
    })
  }

  for (const [promptType, content] of Object.entries(DEFAULT_ASSET_PROMPTS)) {
    rows.push({
      organizationId,
      promptContent: content,
      promptType,
      industry: null,
      version: 1,
      isActive: true,
    })
  }

  return rows
}

export const INDUSTRY_LIST = INDUSTRIES as readonly Industry[]
