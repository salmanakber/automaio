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
      `/collections/${collectionId}/items${options?.isDraft ? '?cmsLocaleId' : ''}`,
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

  async deleteCollectionItem(collectionId: string, itemId: string) {
    return this.request<void>(`/collections/${collectionId}/items/${itemId}`, {
      method: 'DELETE',
    })
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
