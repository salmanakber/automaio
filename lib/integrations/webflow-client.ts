/** True when Webflow returns 404 / resource_not_found (stale CMS item, missing collection, etc.). */
export function isWebflowNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /404|not found|resource_not_found|Requested resource/i.test(msg)
}

/**
 * Webflow Data API v2 client for CMS operations (App Marketplace SaaS pattern).
 */
export class WebflowClient {
  constructor(private readonly apiKey: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.webflow.com/v2${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Webflow API ${response.status}: ${text || response.statusText}`)
    }

    if (response.status === 204) return {} as T
    return response.json()
  }

  /** GET custom code — returns empty scripts when none configured yet (Webflow 404). */
  private async getCustomCodeSafe(path: string) {
    try {
      return await this.request<{ scripts?: Array<{ id: string; location: string; version: string }> }>(
        path,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (
        message.includes('404') &&
        (message.includes('Custom code block not found') ||
          message.includes('resource_not_found') ||
          message.includes('not found'))
      ) {
        return { scripts: [] as Array<{ id: string; location: string; version: string }> }
      }
      throw err
    }
  }

  async listSites() {
    const data = await this.request<{ sites: Array<{ id: string; displayName: string; shortName: string }> }>(
      '/sites',
    )
    return data.sites ?? []
  }

  async listCollections(siteId: string) {
    const data = await this.request<{
      collections: Array<{ id: string; displayName: string; slug: string }>
    }>(`/sites/${siteId}/collections`)
    return data.collections ?? []
  }

  async getCollection(collectionId: string) {
    return this.request<{
      id: string
      displayName: string
      slug: string
      fields: Array<{ id: string; slug: string; displayName: string; type: string }>
    }>(`/collections/${collectionId}`)
  }

  async createCollectionField(
    collectionId: string,
    field: {
      type: string
      displayName: string
      isRequired?: boolean
      isEditable?: boolean
    },
  ) {
    return this.request<{
      id: string
      slug: string
      displayName: string
      type: string
    }>(`/collections/${collectionId}/fields`, {
      method: 'POST',
      body: JSON.stringify({
        type: field.type,
        displayName: field.displayName,
        isRequired: field.isRequired ?? false,
        isEditable: field.isEditable ?? true,
      }),
    })
  }

  async createCollection(
    siteId: string,
    payload: {
      displayName: string
      singularName: string
      slug: string
      fields?: Array<{
        type: string
        displayName: string
        isRequired?: boolean
        isEditable?: boolean
      }>
    },
  ) {
    return this.request<{
      id: string
      displayName: string
      slug: string
      fields: Array<{ id: string; slug: string; displayName: string; type: string }>
    }>(`/sites/${siteId}/collections`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async createCollectionItem(
    collectionId: string,
    fieldData: Record<string, unknown>,
    options?: { isDraft?: boolean },
  ) {
    return this.request<{ id: string; fieldData: Record<string, unknown> }>(
      `/collections/${collectionId}/items`,
      {
        method: 'POST',
        body: JSON.stringify({
          isArchived: false,
          isDraft: options?.isDraft ?? false,
          fieldData,
        }),
      },
    )
  }

  /** Create + immediately publish a CMS item to the live site. */
  async createLiveCollectionItem(collectionId: string, fieldData: Record<string, unknown>) {
    return this.request<{ id: string; fieldData?: Record<string, unknown> }>(
      `/collections/${collectionId}/items/live`,
      {
        method: 'POST',
        body: JSON.stringify({
          isArchived: false,
          fieldData,
        }),
      },
    )
  }

  /** Publish staged CMS item(s) to the live Webflow site. */
  async publishCollectionItems(collectionId: string, itemIds: string[]) {
    if (!itemIds.length) return { publishedItemIds: [] as string[] }
    return this.request<{ publishedItemIds?: string[] }>(
      `/collections/${collectionId}/items/publish`,
      {
        method: 'POST',
        body: JSON.stringify({ itemIds }),
      },
    )
  }

  async updateCollectionItem(
    collectionId: string,
    itemId: string,
    fieldData: Record<string, unknown>,
  ) {
    return this.request<{ id: string }>(`/collections/${collectionId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldData }),
    })
  }

  /** Update a live (published) CMS item. */
  async updateLiveCollectionItem(
    collectionId: string,
    itemId: string,
    fieldData: Record<string, unknown>,
  ) {
    return this.request<{ id: string }>(`/collections/${collectionId}/items/live/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fieldData }),
    })
  }

  /**
   * Create or update a CMS item. Recovers from stale item IDs (404) by creating a new item.
   */
  async upsertCollectionItem(
    collectionId: string,
    itemId: string | null | undefined,
    fieldData: Record<string, unknown>,
    options?: { goLive?: boolean },
  ): Promise<{ id: string; created: boolean }> {
    const goLive = options?.goLive !== false
    let existingId = itemId?.trim() || null

    if (existingId) {
      try {
        await this.updateCollectionItem(collectionId, existingId, fieldData)
      } catch (updateErr) {
        if (!isWebflowNotFoundError(updateErr)) throw updateErr
        try {
          await this.updateLiveCollectionItem(collectionId, existingId, fieldData)
        } catch (liveErr) {
          if (!isWebflowNotFoundError(liveErr)) throw liveErr
          existingId = null
        }
      }

      if (existingId) {
        if (goLive) {
          try {
            await this.publishCollectionItems(collectionId, [existingId])
          } catch (pubErr) {
            if (!isWebflowNotFoundError(pubErr)) throw pubErr
          }
        }
        return { id: existingId, created: false }
      }
    }

    if (goLive) {
      const created = await this.createLiveCollectionItem(collectionId, fieldData)
      return { id: created.id, created: true }
    }

    const created = await this.createCollectionItem(collectionId, fieldData, { isDraft: true })
    return { id: created.id, created: true }
  }

  async deleteCollectionItem(collectionId: string, itemId: string) {
    return this.request<void>(`/collections/${collectionId}/items/${itemId}`, {
      method: 'DELETE',
    })
  }

  /** Find a live CMS item by exact slug (public site URLs use live items). */
  async findLiveCollectionItemBySlug(collectionId: string, slug: string) {
    const data = await this.request<{
      items?: Array<{ id: string; fieldData?: Record<string, unknown> }>
    }>(`/collections/${collectionId}/items/live?slug=${encodeURIComponent(slug)}&limit=1`)

    return data.items?.[0] ?? null
  }

  /** Staged CMS item — for Webflow preview / unpublished items. */
  async findStagedCollectionItemBySlug(collectionId: string, slug: string) {
    const data = await this.request<{
      items?: Array<{ id: string; fieldData?: Record<string, unknown> }>
    }>(`/collections/${collectionId}/items?slug=${encodeURIComponent(slug)}&limit=1`)

    return data.items?.[0] ?? null
  }

  async publishSite(siteId: string) {
    return this.request(`/sites/${siteId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publishToWebflowSubdomain: true }),
    })
  }

  async registerInlineScript(
    siteId: string,
    payload: {
      sourceCode: string
      displayName: string
      version: string
      canCopy?: boolean
    },
  ) {
    return this.request<{ id: string }>(`/sites/${siteId}/registered_scripts/inline`, {
      method: 'POST',
      body: JSON.stringify({
        sourceCode: payload.sourceCode,
        displayName: payload.displayName,
        version: payload.version,
        canCopy: payload.canCopy ?? false,
      }),
    })
  }

  async listRegisteredScripts(siteId: string) {
    const scripts: Array<{ id: string; displayName?: string; version?: string }> = []
    let offset = 0
    const limit = 100

    for (;;) {
      const data = await this.request<{
        registeredScripts?: Array<{ id: string; displayName?: string; version?: string }>
        pagination?: { total: number; limit: number; offset: number }
      }>(`/sites/${siteId}/registered_scripts?limit=${limit}&offset=${offset}`)

      scripts.push(...(data.registeredScripts ?? []))
      const total = data.pagination?.total ?? scripts.length
      offset += limit
      if (offset >= total || (data.registeredScripts?.length ?? 0) === 0) break
    }

    return scripts
  }

  async listPages(siteId: string) {
    const pages: Array<{ id: string; title?: string; collectionId?: string | null }> = []
    let offset = 0
    const limit = 100

    for (;;) {
      const data = await this.request<{
        pages?: Array<{ id: string; title?: string; collectionId?: string | null }>
        pagination?: { total: number; limit: number; offset: number }
      }>(`/sites/${siteId}/pages?limit=${limit}&offset=${offset}`)

      pages.push(...(data.pages ?? []))
      const total = data.pagination?.total ?? pages.length
      offset += limit
      if (offset >= total || (data.pages?.length ?? 0) === 0) break
    }

    return pages
  }

  async findCollectionTemplatePage(siteId: string, collectionId: string) {
    const pages = await this.listPages(siteId)
    return pages.find((p) => p.collectionId === collectionId) ?? null
  }

  async getSiteCustomCode(siteId: string) {
    return this.getCustomCodeSafe(`/sites/${siteId}/custom_code`)
  }

  async upsertSiteCustomCode(
    siteId: string,
    scripts: Array<{ id: string; location: string; version: string }>,
  ) {
    return this.request(`/sites/${siteId}/custom_code`, {
      method: 'PUT',
      body: JSON.stringify({ scripts }),
    })
  }

  async getPageCustomCode(pageId: string) {
    return this.getCustomCodeSafe(`/pages/${pageId}/custom_code`)
  }

  async upsertPageCustomCode(
    pageId: string,
    scripts: Array<{ id: string; location: string; version: string }>,
  ) {
    return this.request(`/pages/${pageId}/custom_code`, {
      method: 'PUT',
      body: JSON.stringify({ scripts }),
    })
  }
}
