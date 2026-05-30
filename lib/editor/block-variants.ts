/** Design variants (2–3 styles) for studio blocks. */

export type BlockVariantId = string

export type BlockVariantOption = {
  id: BlockVariantId
  label: string
  description: string
}

export const CAROUSEL_VARIANTS: BlockVariantOption[] = [
  { id: 'classic', label: 'Classic', description: 'Rounded frame, floating pill arrows' },
  { id: 'cinematic', label: 'Cinematic', description: 'Edge-to-edge slides, bold gradient overlay' },
  { id: 'minimal', label: 'Minimal', description: 'Clean lines, understated controls' },
]

export const HERO_VARIANTS: BlockVariantOption[] = [
  { id: 'centered', label: 'Centered', description: 'Badge, headline, dual CTAs' },
  { id: 'gradient', label: 'Gradient glow', description: 'Soft radial background, elevated card feel' },
  { id: 'bold', label: 'Bold dark', description: 'High-contrast dark hero with accent stripe' },
]

export const FEATURES_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Card grid', description: 'Three equal feature cards' },
  { id: 'list', label: 'Icon list', description: 'Stacked rows with leading icons' },
  { id: 'bento', label: 'Bento', description: 'Asymmetric highlight layout' },
]

export const TESTIMONIALS_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Grid', description: 'Side-by-side quote cards' },
  { id: 'stacked', label: 'Stacked', description: 'Large quote with avatar row' },
  { id: 'minimal', label: 'Minimal', description: 'Borderless typography-focused' },
]

export const CTA_VARIANTS: BlockVariantOption[] = [
  { id: 'soft', label: 'Soft panel', description: 'Light gray rounded panel' },
  { id: 'gradient', label: 'Gradient', description: 'Indigo gradient band' },
  { id: 'outline', label: 'Outline', description: 'Border-only elegant frame' },
]

export const PRICING_VARIANTS: BlockVariantOption[] = [
  { id: 'cards', label: 'Cards', description: 'Standard pricing cards' },
  { id: 'highlight', label: 'Highlight', description: 'Featured plan scales up' },
  { id: 'minimal', label: 'Minimal', description: 'Flat rows, subtle dividers' },
]

export const TIMELINE_VARIANTS: BlockVariantOption[] = [
  { id: 'vertical', label: 'Milestones', description: 'Alternating vertical spine — agency classic' },
  { id: 'roadmap', label: 'Roadmap', description: 'Horizontal phase track with nodes' },
  { id: 'cards', label: 'Phase cards', description: 'Numbered stacked journey cards' },
]

export const STATS_VARIANTS: BlockVariantOption[] = [
  { id: 'band', label: 'Metric band', description: 'Bold numbers on soft gradient' },
  { id: 'cards', label: 'Glass cards', description: 'Elevated stat cards with icons' },
  { id: 'minimal', label: 'Minimal', description: 'Typography-only metrics row' },
]

export const TEAM_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Photo grid', description: 'Classic team cards' },
  { id: 'spotlight', label: 'Spotlight', description: 'Large lead + supporting row' },
  { id: 'compact', label: 'Compact', description: 'Avatar row with roles' },
]

export const GALLERY_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Even grid', description: 'Uniform image grid' },
  { id: 'masonry', label: 'Masonry', description: 'Mixed-height editorial layout' },
  { id: 'showcase', label: 'Showcase', description: 'Hero image + supporting grid' },
]

export const STEPS_VARIANTS: BlockVariantOption[] = [
  { id: 'numbered', label: 'Numbered', description: 'Connected step circles' },
  { id: 'timeline', label: 'Timeline', description: 'Horizontal step line' },
  { id: 'cards', label: 'Cards', description: 'Individual step cards' },
]

export const FAQ_VARIANTS: BlockVariantOption[] = [
  { id: 'accordion', label: 'Accordion', description: 'Expandable FAQ rows' },
  { id: 'twoCol', label: 'Two column', description: 'Questions split in columns' },
  { id: 'minimal', label: 'Minimal', description: 'Simple bordered list' },
]

export const NEWSLETTER_VARIANTS: BlockVariantOption[] = [
  { id: 'gradient', label: 'Gradient', description: 'Vibrant signup band' },
  { id: 'split', label: 'Split', description: 'Copy left, form right' },
  { id: 'minimal', label: 'Inline', description: 'Compact inline capture' },
]

export const CONTACT_VARIANTS: BlockVariantOption[] = [
  { id: 'card', label: 'Centered card', description: 'Form in elevated panel' },
  { id: 'split', label: 'Split', description: 'Info + form side by side' },
  { id: 'minimal', label: 'Minimal', description: 'Light border form only' },
]

export const HERO_SPLIT_VARIANTS: BlockVariantOption[] = [
  { id: 'imageRight', label: 'Image right', description: 'Copy left, visual right' },
  { id: 'imageLeft', label: 'Image left', description: 'Visual left, copy right' },
  { id: 'overlap', label: 'Overlap', description: 'Floating image overlap card' },
]

export const ICON_BOXES_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Icon grid', description: 'Three icon feature boxes' },
  { id: 'row', label: 'Icon row', description: 'Horizontal icon strip' },
  { id: 'gradient', label: 'Gradient', description: 'Icons on gradient tiles' },
]

export const SOCIAL_PROOF_VARIANTS: BlockVariantOption[] = [
  { id: 'metrics', label: 'Metrics', description: 'Ratings and KPIs row' },
  { id: 'badges', label: 'Badges', description: 'Trust badges + stats' },
  { id: 'dark', label: 'Dark band', description: 'High-contrast proof strip' },
]

export const COMPARISON_VARIANTS: BlockVariantOption[] = [
  { id: 'table', label: 'Table', description: 'Feature comparison table' },
  { id: 'cards', label: 'Cards', description: 'Plan cards vs table' },
  { id: 'minimal', label: 'Checklist', description: 'Simple checkmark rows' },
]

export const CALLOUT_VARIANTS: BlockVariantOption[] = [
  { id: 'accent', label: 'Accent bar', description: 'Left border highlight' },
  { id: 'gradient', label: 'Gradient', description: 'Soft gradient panel' },
  { id: 'dark', label: 'Dark', description: 'Inverted callout' },
]

export const VIDEO_HERO_VARIANTS: BlockVariantOption[] = [
  { id: 'cinematic', label: 'Cinematic', description: 'Full dark overlay hero' },
  { id: 'split', label: 'Split', description: 'Video + copy split' },
  { id: 'minimal', label: 'Minimal', description: 'Light frame with play CTA' },
]

export const COUNTERS_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Grid', description: 'Four-up counter grid' },
  { id: 'dark', label: 'Dark band', description: 'Counters on dark strip' },
  { id: 'gradient', label: 'Gradient', description: 'Gradient number tiles' },
]

export const TABS_VARIANTS: BlockVariantOption[] = [
  { id: 'pills', label: 'Pills', description: 'Rounded tab pills' },
  { id: 'underline', label: 'Underline', description: 'Classic underline tabs' },
  { id: 'cards', label: 'Cards', description: 'Card-style tab buttons' },
]

export const MAP_VARIANTS: BlockVariantOption[] = [
  { id: 'framed', label: 'Framed', description: 'Rounded map placeholder' },
  { id: 'split', label: 'Split', description: 'Address + map split' },
  { id: 'minimal', label: 'Full bleed', description: 'Edge-to-edge map block' },
]

export const MARQUEE_VARIANTS: BlockVariantOption[] = [
  { id: 'scroll', label: 'Scroll', description: 'Infinite logo scroll' },
  { id: 'fade', label: 'Fade edges', description: 'Scroll with gradient masks' },
  { id: 'static', label: 'Static row', description: 'Centered logo row' },
]

export const BENTO_VARIANTS: BlockVariantOption[] = [
  { id: 'classic', label: 'Classic', description: '3-column bento' },
  { id: 'hero', label: 'Hero cell', description: 'Large top hero cell' },
  { id: 'dense', label: 'Dense', description: 'Four equal tiles' },
]

export const COUNTDOWN_VARIANTS: BlockVariantOption[] = [
  { id: 'dark', label: 'Dark', description: 'Dark countdown tiles' },
  { id: 'gradient', label: 'Gradient', description: 'Gradient launch panel' },
  { id: 'minimal', label: 'Minimal', description: 'Light bordered units' },
]

export const ALERT_VARIANTS: BlockVariantOption[] = [
  { id: 'info', label: 'Info', description: 'Blue information alert' },
  { id: 'success', label: 'Success', description: 'Green confirmation' },
  { id: 'warning', label: 'Warning', description: 'Amber warning strip' },
]

export const LOGO_STRIP_VARIANTS: BlockVariantOption[] = [
  { id: 'row', label: 'Logo row', description: 'Centered partner row' },
  { id: 'scroll', label: 'Marquee', description: 'Scrolling partner strip' },
  { id: 'grid', label: 'Grid', description: 'Logo grid with labels' },
]

export const BANNER_VARIANTS: BlockVariantOption[] = [
  { id: 'promo', label: 'Promo', description: 'Warm promotional bar' },
  { id: 'dark', label: 'Dark', description: 'Dark announcement bar' },
  { id: 'gradient', label: 'Gradient', description: 'Gradient CTA bar' },
]

export const CASE_STUDY_VARIANTS: BlockVariantOption[] = [
  { id: 'featured', label: 'Featured', description: 'Large case study hero' },
  { id: 'grid', label: 'Grid', description: 'Two case study cards' },
  { id: 'minimal', label: 'List', description: 'Compact case list' },
]

export const SERVICES_VARIANTS: BlockVariantOption[] = [
  { id: 'cards', label: 'Service cards', description: 'Three service offerings' },
  { id: 'list', label: 'Detailed list', description: 'Services with descriptions' },
  { id: 'pricing', label: 'Tiered', description: 'Good / better / best tiers' },
]

export const PORTFOLIO_VARIANTS: BlockVariantOption[] = [
  { id: 'grid', label: 'Project grid', description: 'Image-forward portfolio' },
  { id: 'showcase', label: 'Showcase', description: 'Featured project + grid' },
  { id: 'minimal', label: 'Minimal', description: 'Typography project list' },
]

export const AWARDS_VARIANTS: BlockVariantOption[] = [
  { id: 'badges', label: 'Badges', description: 'Award badge row' },
  { id: 'trophy', label: 'Trophy wall', description: 'Large award cards' },
  { id: 'press', label: 'Press', description: 'Publication mentions' },
]

/** Widget types that support inspector design variants (carousel uses its own panel). */
export const VARIANT_MAP: Record<string, BlockVariantOption[]> = {
  carousel: CAROUSEL_VARIANTS,
  hero: HERO_VARIANTS,
  features: FEATURES_VARIANTS,
  testimonials: TESTIMONIALS_VARIANTS,
  cta: CTA_VARIANTS,
  pricing: PRICING_VARIANTS,
  timeline: TIMELINE_VARIANTS,
  stats: STATS_VARIANTS,
  team: TEAM_VARIANTS,
  gallery: GALLERY_VARIANTS,
  steps: STEPS_VARIANTS,
  faq: FAQ_VARIANTS,
  newsletter: NEWSLETTER_VARIANTS,
  contact: CONTACT_VARIANTS,
  heroSplit: HERO_SPLIT_VARIANTS,
  iconBoxes: ICON_BOXES_VARIANTS,
  socialProof: SOCIAL_PROOF_VARIANTS,
  comparison: COMPARISON_VARIANTS,
  callout: CALLOUT_VARIANTS,
  videoHero: VIDEO_HERO_VARIANTS,
  counters: COUNTERS_VARIANTS,
  tabs: TABS_VARIANTS,
  map: MAP_VARIANTS,
  marquee: MARQUEE_VARIANTS,
  bento: BENTO_VARIANTS,
  countdown: COUNTDOWN_VARIANTS,
  alert: ALERT_VARIANTS,
  logoStrip: LOGO_STRIP_VARIANTS,
  banner: BANNER_VARIANTS,
  caseStudy: CASE_STUDY_VARIANTS,
  services: SERVICES_VARIANTS,
  portfolio: PORTFOLIO_VARIANTS,
  awards: AWARDS_VARIANTS,
}

export function getBlockVariants(widgetType: string): BlockVariantOption[] {
  return VARIANT_MAP[widgetType] ?? []
}

export function supportsBlockVariants(widgetType: string): boolean {
  return widgetType in VARIANT_MAP
}

export function defaultBlockVariant(widgetType: string): BlockVariantId {
  const list = getBlockVariants(widgetType)
  return list[0]?.id ?? 'default'
}
