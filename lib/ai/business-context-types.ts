import type { TonePresetId } from '@/lib/ai/tone-presets'

export type CtaGoal = 'leads' | 'bookings' | 'app_installs' | 'sales' | 'awareness'

export type BusinessContext = {
  companyName?: string
  businessType?: string
  description?: string
  targetAudience?: string
  offer?: string
  primaryGoal?: string
  tonePreset?: TonePresetId
  ctaGoal?: CtaGoal
  websiteUrl?: string
  services?: string[]
  valuePropositions?: string[]
  testimonials?: Array<{ quote: string; author?: string; role?: string }>
  faq?: Array<{ question: string; answer: string }>
  headings?: string[]
  brandVoice?: string
  ctaLanguage?: string
  socialLinks?: Record<string, string>
  colors?: string[]
  keywords?: string[]
  seoTitle?: string
  seoDescription?: string
  extractionSource: 'website' | 'manual' | 'hybrid'
  extractionStatus: 'success' | 'partial' | 'failed'
}

export type OnboardingInput = {
  businessDescription?: string
  websiteUrl?: string
  primaryGoal?: string
  targetAudience?: string
  offer?: string
  tonePreset?: TonePresetId
  ctaGoal?: CtaGoal
  businessType?: string
}

export type LayoutControls = {
  showHeader?: boolean
  showFooter?: boolean
  fullWidth?: boolean
  removeContainerConstraints?: boolean
  landingPageFocusMode?: boolean
  cleanEmbedMode?: boolean
  hiddenSections?: string[]
}

export type ProjectParameters = Record<string, string> & {
  businessContext?: BusinessContext
  layoutControls?: LayoutControls
  onboardingComplete?: boolean
}
