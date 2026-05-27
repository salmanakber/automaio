/** Build a best-effort public Webflow URL for a CMS item. */
export function buildWebflowLiveUrl(opts: {
  siteShortName?: string | null
  collectionSlug?: string | null
  itemSlug: string
}): string | null {
  const slug = opts.itemSlug?.trim()
  if (!opts.siteShortName || !slug) return null

  const base = `https://${opts.siteShortName}.webflow.io`
  if (opts.collectionSlug) {
    return `${base}/${opts.collectionSlug.replace(/^\//, '')}/${slug}`
  }
  return `${base}/${slug}`
}

export function slugifyForWebflow(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
