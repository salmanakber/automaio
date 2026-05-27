export type TonePresetId =
  | 'corporate'
  | 'startup'
  | 'modern_saas'
  | 'luxury'
  | 'minimal'
  | 'professional'
  | 'bold_marketing'
  | 'friendly'
  | 'technical'
  | 'high_converting'

export type TonePreset = {
  id: TonePresetId
  label: string
  description: string
  promptGuidance: string
}

export const TONE_PRESETS: TonePreset[] = [
  {
    id: 'corporate',
    label: 'Corporate',
    description: 'Polished, trustworthy, enterprise-ready',
    promptGuidance:
      'Use formal, confident language. Emphasize reliability, compliance, and proven results. Avoid slang.',
  },
  {
    id: 'startup',
    label: 'Startup',
    description: 'Energetic, innovative, fast-moving',
    promptGuidance:
      'Use punchy, optimistic copy. Highlight speed, innovation, and disruption. Keep sentences short.',
  },
  {
    id: 'modern_saas',
    label: 'Modern SaaS',
    description: 'Product-led, clear value, trial-focused',
    promptGuidance:
      'Lead with outcomes and time-to-value. Use product-led growth angles, free trial CTAs, and feature benefits.',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Premium, refined, exclusive',
    promptGuidance:
      'Use elegant, aspirational language. Emphasize craftsmanship, exclusivity, and premium experience.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean, concise, whitespace-friendly',
    promptGuidance:
      'Keep copy extremely concise. One idea per sentence. Let whitespace and clarity do the work.',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Clear, credible, service-focused',
    promptGuidance:
      'Use clear, credible language suited for B2B services. Focus on expertise, process, and client outcomes.',
  },
  {
    id: 'bold_marketing',
    label: 'Bold Marketing',
    description: 'High-impact, attention-grabbing',
    promptGuidance:
      'Use bold hooks, strong verbs, and urgency. Make headlines impossible to ignore while staying credible.',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, conversational',
    promptGuidance:
      'Write like a helpful human. Use conversational tone, empathy, and simple words. Avoid jargon.',
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'Precise, developer or expert audience',
    promptGuidance:
      'Use precise terminology for technical buyers. Highlight specs, integrations, and measurable performance.',
  },
  {
    id: 'high_converting',
    label: 'High-converting sales',
    description: 'Conversion-optimized, benefit-driven',
    promptGuidance:
      'Optimize for conversions: strong hooks, clear benefits, social proof, objection handling, and action-oriented CTAs.',
  },
]

export function getTonePreset(id?: string | null): TonePreset {
  const found = TONE_PRESETS.find((p) => p.id === id)
  return found ?? TONE_PRESETS.find((p) => p.id === 'high_converting')!
}

export function buildToneSystemPrompt(tonePresetId?: string | null): string {
  const preset = getTonePreset(tonePresetId)
  return `Tone & style: ${preset.label}. ${preset.promptGuidance}`
}
