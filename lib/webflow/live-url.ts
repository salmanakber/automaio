/** Build a best-effort public Webflow URL for a CMS item. */
export function buildWebflowLiveUrl(opts: {
  siteShortName?: string | null
  collectionSlug?: string | null
  itemSlug: string
  /** Full path prefix from site root, e.g. landing-pages or content/blog */
  publicPathPrefix?: string | null
}): string | null {
  const slug = opts.itemSlug?.trim()
  if (!opts.siteShortName || !slug) return null

  const base = `https://${opts.siteShortName}.webflow.io`
  const prefix = (opts.publicPathPrefix ?? opts.collectionSlug)?.replace(/^\/|\/$/g, '')
  if (prefix) {
    return `${base}/${prefix}/${slug}`
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

type WebflowPageMeta = {
  id: string
  slug?: string
  parentId?: string | null
  collectionId?: string | null
}

/** Resolve the public URL path prefix for CMS items (handles parent folders on template pages). */
export async function resolveWebflowCollectionPublicPath(
  client: WebflowClient,
  siteId: string,
  collectionId: string,
): Promise<{ publicPathPrefix: string; collectionSlug: string; templatePageFound: boolean }> {
  const collection = await client.getCollection(collectionId)
  const collectionSlug = collection.slug
  const templatePage = await client.findCollectionTemplatePage(siteId, collectionId)

  if (!templatePage?.id) {
    return { publicPathPrefix: collectionSlug, collectionSlug, templatePageFound: false }
  }

  try {
    const segments: string[] = []
    let page: WebflowPageMeta | null = await client.getPage(templatePage.id)
    const visited = new Set<string>()

    while (page?.parentId && !visited.has(page.parentId)) {
      visited.add(page.parentId)
      const parent = await client.getPage(page.parentId)
      if (parent.slug) segments.unshift(parent.slug.replace(/^\//, ''))
      page = parent
    }

    const template = await client.getPage(templatePage.id)
    if (template.slug) segments.push(template.slug.replace(/^\//, ''))

    const publicPathPrefix = segments.filter(Boolean).join('/') || collectionSlug
    return { publicPathPrefix, collectionSlug, templatePageFound: true }
  } catch {
    return { publicPathPrefix: collectionSlug, collectionSlug, templatePageFound: true }
  }
}

export async function buildWebflowLiveUrlForItem(
  client: WebflowClient,
  opts: {
    siteId: string
    siteShortName?: string | null
    collectionId: string
    itemSlug: string
  },
): Promise<string | null> {
  if (!opts.siteShortName || !opts.itemSlug.trim()) return null
  const pathInfo = await resolveWebflowCollectionPublicPath(
    client,
    opts.siteId,
    opts.collectionId,
  )
  return buildWebflowLiveUrl({
    siteShortName: opts.siteShortName,
    collectionSlug: pathInfo.collectionSlug,
    publicPathPrefix: pathInfo.publicPathPrefix,
    itemSlug: opts.itemSlug,
  })
}
