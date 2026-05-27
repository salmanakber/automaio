'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WEBFLOW_CMS_SETUP_GUIDE, AUTOMAIO_CAMPAIGNS_COLLECTION_NAME } from '@/lib/webflow/cms-config'
import { CreateLandingCollectionCard } from '@/components/webflow/CreateLandingCollectionCard'
import { RefreshCw, Plug, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { isWebflowOAuthConfigured } from '@/lib/integrations/webflow-oauth'

type Integration = {
  id: string
  siteName: string | null
  webflowSiteId: string
  campaignsCollectionId: string | null
  templatesCollectionId: string | null
  collections: {
    collections?: Array<{
      id: string
      name: string
      slug: string
      fields?: Array<{ slug: string; name: string; type: string }>
    }>
    staticPages?: Array<{ id: string; title?: string; slug?: string }>
  } | null
  syncedAt: string | null
}

interface WebflowCmsSettingsProps {
  orgId: string
}

export function WebflowCmsSettings({ orgId }: WebflowCmsSettingsProps) {
  const searchParams = useSearchParams()
  const webflowStatus = searchParams.get('webflow')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [siteId, setSiteId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedBlogCollection, setSelectedBlogCollection] = useState('')
  const [selectedPagesCollection, setSelectedPagesCollection] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [embedStatus, setEmbedStatus] = useState<{
    customCodeAccess: boolean
    message: string
    embedConfigured: boolean
    collectionEmbedSnippet?: string
  } | null>(null)
  const [embedLoading, setEmbedLoading] = useState(false)
  const [embedSetupLoading, setEmbedSetupLoading] = useState(false)
  const oauthAvailable = isWebflowOAuthConfigured()

  const load = () => {
    fetch(`/api/integrations/webflow?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        setIntegrations(d.integrations ?? [])
        const first = d.integrations?.[0]
        if (first?.campaignsCollectionId) setSelectedBlogCollection(first.campaignsCollectionId)
        if (first?.templatesCollectionId) {
          setSelectedPagesCollection(first.templatesCollectionId)
        } else if (first?.campaignsCollectionId) {
          const cols = (first.collections as Integration['collections'])?.collections ?? []
          if (cols.length === 1) setSelectedPagesCollection(first.campaignsCollectionId)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [orgId])

  const loadEmbedStatus = (integrationId: string) => {
    setEmbedLoading(true)
    fetch(`/api/integrations/webflow/${integrationId}/embed-status`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setEmbedStatus({
            customCodeAccess: Boolean(d.customCodeAccess),
            message: d.message ?? '',
            embedConfigured: Boolean(d.embedConfigured),
            collectionEmbedSnippet: d.collectionEmbedSnippet,
          })
        }
      })
      .finally(() => setEmbedLoading(false))
  }

  useEffect(() => {
    if (integrations[0]?.id) loadEmbedStatus(integrations[0].id)
  }, [integrations])

  const active = integrations[0]
  const collections =
    (active?.collections as Integration['collections'])?.collections ?? []
  const staticPages =
    (active?.collections as Integration['collections'])?.staticPages ?? []
  const singleCollection = collections.length === 1

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch('/api/integrations/webflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, webflowSiteId: siteId, webflowApiKey: apiKey }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setSiteId('')
      setApiKey('')
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  const handleSaveCollections = async () => {
    if (!active) return
    await fetch(`/api/integrations/webflow/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignsCollectionId: selectedBlogCollection || null,
        templatesCollectionId: selectedPagesCollection || null,
        sync: true,
      }),
    })
    load()
  }

  const handleSync = async () => {
    if (!active) return
    setSyncing(true)
    try {
      await fetch('/api/integrations/webflow/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: active.id }),
      })
      load()
      loadEmbedStatus(active.id)
    } finally {
      setSyncing(false)
    }
  }

  const handleRetryEmbed = async () => {
    if (!active) return
    setEmbedSetupLoading(true)
    try {
      const collectionIds = [
        selectedPagesCollection,
        selectedBlogCollection,
      ].filter((id, i, arr) => id && arr.indexOf(id) === i)

      for (const collectionId of collectionIds) {
        const res = await fetch(`/api/integrations/webflow/${active.id}/embed-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionId, publishSite: collectionId === collectionIds[collectionIds.length - 1] }),
        })
        const d = await res.json()
        if (!res.ok || d.needsReconnect) {
          alert(d.error ?? 'Embed setup failed. Reconnect via OAuth first.')
          break
        }
      }
      loadEmbedStatus(active.id)
    } finally {
      setEmbedSetupLoading(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading Webflow…</p>
  }

  return (
    <div className="space-y-6">
      {webflowStatus === 'connected' ? (
        <p className="text-sm text-green-700 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          Webflow connected successfully. Set your blog and pages collections below — they use
          different Webflow templates.
        </p>
      ) : null}
      {webflowStatus === 'error' ? (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          Webflow connection failed
          {searchParams.get('message') ? `: ${searchParams.get('message')}` : '.'}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Connect Webflow site</CardTitle>
          <CardDescription>
            Connect via OAuth (recommended for Webflow App Marketplace) or paste a Site API token
            with CMS read/write scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!active ? (
            <>
              {oauthAvailable ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium">Connect with Webflow OAuth</p>
                  <p className="text-xs text-muted-foreground">
                    Official install flow for marketplace apps. Grants CMS, site, and automatic embed
                    access (custom_code). Reconnect once if you connected before this update.
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <a href={`/api/integrations/webflow/oauth?orgId=${orgId}`}>
                      <Plug className="size-4 mr-2" />
                      Connect with Webflow
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-amber-600 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  Add WEBFLOW_CLIENT_ID and WEBFLOW_CLIENT_SECRET to .env to enable OAuth. You can
                  still connect with a manual API token below.
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">— or use API token —</p>

              <div className="space-y-2">
                <Label>Site ID</Label>
                <Input
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="From Webflow → Site settings → API"
                />
              </div>
              <div className="space-y-2">
                <Label>API token</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Webflow API token"
                />
              </div>
              <Button onClick={handleConnect} disabled={connecting || !siteId || !apiKey}>
                {connecting ? 'Connecting…' : 'Connect Webflow'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{active.siteName ?? 'Webflow site'}</p>
                  <p className="text-xs text-muted-foreground">Site ID: {active.webflowSiteId}</p>
                  {active.syncedAt ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last sync: {new Date(active.syncedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {oauthAvailable && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/integrations/webflow/oauth?orgId=${orgId}`}>
                        <Plug className="size-4 mr-1" />
                        Reconnect OAuth
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={syncing ? 'size-4 animate-spin' : 'size-4'} />
                  </Button>
                </div>
              </div>

              {!embedLoading && embedStatus && (
                <div
                  className={`rounded-lg border p-4 space-y-3 ${
                    embedStatus.customCodeAccess
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {embedStatus.customCodeAccess ? (
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {embedStatus.customCodeAccess
                          ? embedStatus.embedConfigured
                            ? 'Automatic iframe embed is active'
                            : 'Automatic embed available'
                          : 'Automatic embed needs OAuth reconnect'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{embedStatus.message}</p>
                    </div>
                  </div>
                  {embedStatus.customCodeAccess ? (
                    !embedStatus.embedConfigured && (
                      <Button size="sm" onClick={handleRetryEmbed} disabled={embedSetupLoading}>
                        {embedSetupLoading ? 'Setting up…' : 'Apply embed to collection template'}
                      </Button>
                    )
                  ) : oauthAvailable ? (
                    <Button size="sm" asChild>
                      <a href={`/api/integrations/webflow/oauth?orgId=${orgId}`}>
                        <Plug className="size-4 mr-2" />
                        Reconnect with Webflow OAuth
                      </a>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Without custom code access, HTML pages publish to the CMS Rich Text field
                      automatically — no manual embed needed. Bind Rich Text to your body field in
                      Webflow Designer.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">CMS collections</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These are <strong>CMS collections</strong> from your Webflow site (synced via API).
                  Static Designer pages (Home, About, etc.) are listed separately below — HTML projects
                  publish as CMS items, not static pages.
                </p>

                {singleCollection && (
                  <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-muted-foreground space-y-2">
                    <p>
                      Your site has one CMS collection: <strong>{collections[0]?.name}</strong>.
                      You can use it for both blog posts and HTML pages — publish will save HTML to
                      the Rich Text body field when iframe embed is unavailable.
                    </p>
                    {!selectedPagesCollection && selectedBlogCollection && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPagesCollection(selectedBlogCollection)}
                      >
                        Use &quot;{collections[0]?.name}&quot; for HTML pages too
                      </Button>
                    )}
                  </div>
                )}

                {collections.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No collections found. Click Sync, or create a landing page collection below.
                  </p>
                )}

                {active && (
                  <CreateLandingCollectionCard
                    orgId={orgId}
                    integrationId={active.id}
                    onCreated={async (collection) => {
                      setSelectedPagesCollection(collection.id)
                      await fetch(`/api/integrations/webflow/${active.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          templatesCollectionId: collection.id,
                          sync: true,
                        }),
                      })
                      load()
                    }}
                  />
                )}

                <div className="space-y-2">
                  <Label>Blog posts collection</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedBlogCollection}
                    onChange={(e) => setSelectedBlogCollection(e.target.value)}
                  >
                    <option value="">Select blog collection…</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Used for blog_post projects — rich text goes to CMS (no iframe embed).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>HTML pages collection</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedPagesCollection}
                    onChange={(e) => setSelectedPagesCollection(e.target.value)}
                  >
                    <option value="">Select pages collection…</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Used for landing_page / HTML template projects. Can be the same collection as blog
                    if you only have one. Create a new CMS collection in Webflow if you need a separate
                    Pages section.
                  </p>
                </div>

                {staticPages.length > 0 && (
                  <div className="rounded-md border border-dashed p-3 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Static Webflow pages (informational — not CMS)
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {staticPages.slice(0, 8).map((p) => p.title ?? p.id).join(', ')}
                      {staticPages.length > 8 ? ` +${staticPages.length - 8} more` : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      To publish HTML here, create a CMS collection or bind Rich Text on your CMS template.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSaveCollections}
                  disabled={!selectedBlogCollection && !selectedPagesCollection}
                >
                  Save collections
                </Button>
              </div>

              {(selectedBlogCollection || selectedPagesCollection) && (() => {
                const colId = selectedPagesCollection || selectedBlogCollection
                const col = collections.find((c) => c.id === colId) as
                  | { id: string; name: string; fields?: Array<{ slug: string; name: string; type: string }> }
                  | undefined
                const fields = col?.fields ?? []
                if (fields.length === 0) return null
                return (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-medium">
                      Fields in &quot;{col?.name}&quot; ({fields.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Automaio will map title, body, and HTML to matching fields automatically.
                      You don&apos;t need custom Automaio field names.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {fields.map((f) => (
                        <span
                          key={f.slug}
                          className="text-xs px-2 py-0.5 rounded-full bg-background border font-mono"
                        >
                          {f.slug}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How field mapping works</CardTitle>
          <CardDescription>
            Automaio works with any Webflow collection — you don&apos;t need special field names.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            When you publish, Automaio looks at your collection&apos;s actual fields and maps content
            automatically:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong className="text-foreground">Title</strong> → name, title, post-title</li>
            <li><strong className="text-foreground">Body</strong> → post-body, content, summary, description</li>
            <li><strong className="text-foreground">HTML</strong> → rich text or plain text fields</li>
          </ul>
          <p className="text-xs">
            Optional: create an &quot;{AUTOMAIO_CAMPAIGNS_COLLECTION_NAME}&quot; collection with the fields below
            for full campaign features, or use your existing Blog / Projects collection.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional: Automaio collection fields</CardTitle>
          <CardDescription>
            Only needed if you want a dedicated campaigns collection with all Automaio metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Field</th>
                  <th className="pb-2 pr-4">Slug</th>
                  <th className="pb-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {WEBFLOW_CMS_SETUP_GUIDE.map((row) => (
                  <tr key={row.slug} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.field}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{row.slug}</td>
                    <td className="py-2 text-muted-foreground">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            On your Webflow Collection page, add an Embed element and bind it to the{' '}
            <strong>template-html</strong> field, or use our embed script from Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
