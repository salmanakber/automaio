'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  Upload,
  ArrowRight,
  RefreshCw,
  Zap,
  ExternalLink,
} from 'lucide-react'

type MappingRow = {
  logicalKey: string
  label: string
  webflowSlug: string | null
  value: string
  included: boolean
  note?: string
}

type ProjectPublishPanelProps = {
  projectId: string
  orgId: string
  showOnWebsite: boolean
  publishSite: boolean
  webflowCmsItemId: string | null
  status: string
  onPublished: () => void
  onToggleShowOnWebsite: (checked: boolean) => void
}

export function ProjectPublishPanel({
  projectId,
  orgId,
  showOnWebsite,
  webflowCmsItemId,
  status,
  onPublished,
  onToggleShowOnWebsite,
}: ProjectPublishPanelProps) {
  const [mapping, setMapping] = useState<MappingRow[]>([])
  const [collectionFields, setCollectionFields] = useState<Array<{ slug: string; name?: string; type: string }>>([])
  const [canPublish, setCanPublish] = useState(false)
  const [hasTemplateHtml, setHasTemplateHtml] = useState(false)
  const [resolvedFields, setResolvedFields] = useState<string[]>([])
  const [embedAutoConfigured, setEmbedAutoConfigured] = useState<boolean | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
    liveUrl?: string | null
  } | null>(null)

  const loadPreview = () => {
    setLoadingPreview(true)
    setPreviewError('')
    fetch(`/api/projects/${projectId}/publish-preview`, {
      
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setMapping(d.mapping ?? [])
        setCollectionFields(d.collectionFields ?? [])
        setCanPublish(Boolean(d.canPublish))
        setHasTemplateHtml(Boolean(d.hasTemplateHtml))
        setResolvedFields(d.resolvedFields ?? [])
      })
      .catch((e) => setPreviewError(e instanceof Error ? e.message : 'Could not load field mapping'))
      .finally(() => setLoadingPreview(false))
  }

  useEffect(() => {
    loadPreview()
  }, [projectId])

  const mappedCount = mapping.filter((m) => m.included).length
  const unmappedRequired = mapping.filter(
    (m) => !m.webflowSlug && ['name', 'slug', 'body-html', 'template-html'].includes(m.logicalKey),
  )

  const publish = async () => {
    setPublishing(true)
    setResult(null)
    try {
      const res = await fetch(`/api/projects/${projectId}?action=publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishSite: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')

      setEmbedAutoConfigured(Boolean(data.embedAutoConfigured))

      if (data.embedNeedsReconnect) {
        setResult({
          type: 'warning',
          message:
            data.embedMessage ??
            'Published to CMS, but automatic embed needs a Webflow reconnect. Go to Settings → Integrations and reconnect Webflow.',
          liveUrl: data.liveUrl,
        })
      } else {
        setResult({
          type: 'success',
          message:
            data.embedMessage ??
            (webflowCmsItemId
              ? `Updated in Webflow (${data.mappedFields?.length ?? 0} fields). Your template should appear on the live CMS page automatically.`
              : `Published to Webflow (${data.mappedFields?.length ?? 0} fields). Your template should appear on the live CMS page automatically.`),
          liveUrl: data.liveUrl,
        })
      }
      onPublished()
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Publish failed',
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="size-5 text-primary" />
          Publish to Webflow
        </CardTitle>
        <CardDescription>
          One click saves to CMS, installs the embed on your collection template, and publishes your site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {result && (
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
              result.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : result.type === 'warning'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                  : 'border-destructive/40 bg-destructive/10 text-destructive'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p>{result.message}</p>
              {result.liveUrl && (
                <a
                  href={result.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs underline"
                >
                  View on your Webflow site
                  <ExternalLink className="size-3" />
                </a>
              )}
              {result.type === 'warning' && (
                <Link
                  href={`/dashboard/${orgId}/settings?tab=integrations`}
                  className="text-primary underline text-xs"
                >
                  Reconnect Webflow →
                </Link>
              )}
            </div>
          </div>
        )}

        {(hasTemplateHtml || status === 'published') && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-2">
              <Zap className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Automatic embed</p>
                <p className="text-xs text-muted-foreground">
                  {embedAutoConfigured === true
                    ? 'Content loads in an isolated iframe — your Webflow site stays fast and styles are not affected.'
                    : embedAutoConfigured === false
                      ? 'Reconnect Webflow once to enable automatic iframe embed (Settings → Integrations).'
                      : 'When you publish, content loads via iframe URL — no heavy HTML injected into your page.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Show on live website</p>
              <p className="text-xs text-muted-foreground">
                {showOnWebsite ? 'Published as a live CMS item' : 'Saved as draft in Webflow'}
              </p>
            </div>
          </div>
          <Switch checked={showOnWebsite} onCheckedChange={onToggleShowOnWebsite} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Field mapping preview</p>
            <Button variant="ghost" size="sm" onClick={loadPreview} disabled={loadingPreview}>
              <RefreshCw className={`size-3.5 mr-1 ${loadingPreview ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loadingPreview ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Loading your Webflow collection fields…
            </div>
          ) : previewError ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-2">
              <p>{previewError}</p>
              <Link href={`/dashboard/${orgId}/settings?tab=integrations`} className="text-primary underline text-xs">
                Open Webflow settings →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                {resolvedFields.length} Webflow field{resolvedFields.length !== 1 ? 's' : ''} will be
                updated
                {hasTemplateHtml ? ' · Template HTML ready' : ''}
                {collectionFields.length > 0 && ` (${collectionFields.length} in collection)`}
              </p>
              {hasTemplateHtml && resolvedFields.length > 0 && (
                <p className="text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2 mb-3">
                  Your template will be sent to:{' '}
                  <span className="font-mono">{resolvedFields.join(', ')}</span>
                </p>
              )}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Your content</th>
                      <th className="px-3 py-2 font-medium w-8"></th>
                      <th className="px-3 py-2 font-medium">Webflow field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapping.map((row) => (
                      <tr key={row.logicalKey} className="border-b last:border-0">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-xs">{row.label}</p>
                          {row.value ? (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.value}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Empty</p>
                          )}
                        </td>
                        <td className="px-1 py-2.5 text-muted-foreground">
                          <ArrowRight className="size-3.5" />
                        </td>
                        <td className="px-3 py-2.5">
                          {row.webflowSlug ? (
                            <div>
                              <Badge variant={row.included ? 'default' : 'secondary'} className="font-mono text-xs">
                                {row.webflowSlug}
                              </Badge>
                              {row.note ? (
                                <p className="text-[10px] text-muted-foreground mt-1">{row.note}</p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not in collection</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {unmappedRequired.length > 0 && mappedCount === 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  No fields matched yet. Sync Webflow in Settings, or pick a collection with name and body/content fields.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={publish}
            disabled={publishing || loadingPreview || Boolean(previewError) || !canPublish}
            className="flex-1"
            size="lg"
          >
            {publishing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Publishing…
              </>
            ) : webflowCmsItemId || status === 'published' ? (
              <>
                <Upload className="size-4 mr-2" />
                Update in Webflow
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Publish to Webflow
              </>
            )}
          </Button>
        </div>

        {status === 'published' && webflowCmsItemId && (
          <p className="text-xs text-center text-muted-foreground">
            CMS item ID: <code className="text-[10px]">{webflowCmsItemId}</code>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
