/**
 * Recommended Webflow CMS collection setup for Automaio (Webflow App Marketplace).
 * Create a collection named "Automaio Campaigns" with these fields in your Webflow site.
 */
export const AUTOMAIO_CAMPAIGNS_COLLECTION_NAME = 'Automaio Campaigns'

export const DEFAULT_CMS_FIELD_MAPPING = {
  name: 'name',
  slug: 'slug',
  headline: 'headline',
  'body-html': 'body-html',
  'template-html': 'template-html',
  'html-content': 'html-content',
  'css-content': 'css-content',
  'js-content': 'js-content',
  'preview-image': 'preview-image',
  'page-id': 'page-id',
  'runtime-config': 'runtime-config',
  industry: 'industry',
  status: 'status',
  'target-audience': 'target-audience',
  'automaio-campaign-id': 'automaio-campaign-id',
  'automaio-template-id': 'template-id',
  'template-id': 'template-id',
  'seo-title': 'seo-title',
  'seo-description': 'seo-description',
  'og-title': 'og-title',
  'og-description': 'og-description',
} as const

export type CmsFieldMapping = typeof DEFAULT_CMS_FIELD_MAPPING

export const WEBFLOW_CMS_SETUP_GUIDE = [
  { field: 'Title', slug: 'name', type: 'Plain text', required: true },
  { field: 'Slug', slug: 'slug', type: 'Plain text', required: true },
  { field: 'SEO Title', slug: 'seo-title', type: 'Plain text', required: false },
  { field: 'SEO Description', slug: 'seo-description', type: 'Plain text', required: false },
  { field: 'Page ID', slug: 'page-id', type: 'Plain text (long)', required: true },
  { field: 'Runtime Config', slug: 'runtime-config', type: 'Plain text', required: false },
  { field: 'Template ID', slug: 'template-id', type: 'Plain text', required: false },
  { field: 'Status', slug: 'status', type: 'Plain text', required: false },
  { field: 'Preview Image', slug: 'preview-image', type: 'Image', required: false },
  { field: 'HTML Content (legacy)', slug: 'html-content', type: 'Plain text (long)', required: false },
  { field: 'CSS Content (legacy)', slug: 'css-content', type: 'Plain text (long)', required: false },
  { field: 'JS Content (legacy)', slug: 'js-content', type: 'Plain text (long)', required: false },
  { field: 'Headline', slug: 'headline', type: 'Plain text', required: false },
  { field: 'Body HTML', slug: 'body-html', type: 'Rich text', required: false },
  { field: 'Template HTML', slug: 'template-html', type: 'Plain text (long)', required: false },
  { field: 'Industry', slug: 'industry', type: 'Plain text', required: false },
  { field: 'Status', slug: 'status', type: 'Plain text', required: false },
  { field: 'Target audience', slug: 'target-audience', type: 'Plain text', required: false },
  { field: 'Automaio Campaign ID', slug: 'automaio-campaign-id', type: 'Plain text', required: false },
  { field: 'Automaio Template ID', slug: 'automaio-template-id', type: 'Plain text', required: false },
]
