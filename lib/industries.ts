/**
 * Canonical industry list for campaigns, templates, and filters.
 * Use INDUSTRIES for selects; use normalizeIndustry() when matching templates.
 */
export const INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'Agency',
  'B2B',
  'Technology',
  'Marketing',
  'Finance',
  'Healthcare',
  'Education',
  'Real Estate',
  'Local Business',
  'Hospitality',
  'Food & Beverage',
  'Fashion & Retail',
  'Fitness & Wellness',
  'Legal',
  'Non-profit',
  'Creative & Design',
  'Webflow & No-code',
  'Other',
] as const

export type Industry = (typeof INDUSTRIES)[number]

export const DEFAULT_INDUSTRY: Industry = 'SaaS'

export function normalizeIndustry(value: string): string {
  const trimmed = value.trim()
  const match = INDUSTRIES.find((i) => i.toLowerCase() === trimmed.toLowerCase())
  return match ?? trimmed
}

export function isKnownIndustry(value: string): value is Industry {
  return INDUSTRIES.includes(value as Industry)
}
