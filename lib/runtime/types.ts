/** Structured landing page schema — platform source of truth (not Webflow CMS). */
export type LandingPageSectionType =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'faq'
  | 'pricing'
  | 'cta'
  | 'contact'
  | 'footer'
  | 'custom'

export type LandingPageSection = {
  id: string
  type: LandingPageSectionType
  content: Record<string, string>
}

export type LandingPageRenderBundle = {
  scopeClass: string
  htmlContent: string
  cssContent: string
  jsContent: string
}

export type LandingPageSchema = {
  version: number
  pageId: string
  templateId?: string | null
  templateSlug?: string | null
  seo: {
    title?: string
    description?: string
  }
  sections: LandingPageSection[]
  render: LandingPageRenderBundle
  updatedAt: string
}

export type RuntimeRenderConfig = {
  v: number
  pageId: string
}
