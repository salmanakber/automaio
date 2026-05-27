/** Default Webflow CMS collection for a content type based on integration settings. */
export function getDefaultCollectionForContentType(
  integration: {
    campaignsCollectionId?: string | null
    templatesCollectionId?: string | null
  },
  contentType: string,
): string | null {
  if (contentType === 'blog_post') {
    return integration.campaignsCollectionId ?? null
  }
  // HTML pages / landing pages → pages collection first, then fallback
  return integration.templatesCollectionId ?? integration.campaignsCollectionId ?? null
}

export function isPageContentType(contentType: string) {
  return contentType === 'landing_page' || contentType === 'cms_entry' || contentType === 'custom'
}
