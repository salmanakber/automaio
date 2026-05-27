'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  ExternalLink,
  Globe,
  Layout,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plug,
  RefreshCw,
} from 'lucide-react'
import {
  SectionCmsMappingPreview,
  type SectionCmsMappingRow,
} from '@/components/projects/SectionCmsMappingPreview'
import { CreateLandingCollectionCard } from '@/components/webflow/CreateLandingCollectionCard'
import { parseJsonResponse } from '@/lib/api/parse-json-response'

type PublishDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Record<string, unknown> | null
  projectId: string
  orgId: string
  onPublished?: () => void
}

type PublishResult = {
  type: 'success' | 'error' | 'warning'
  message: string
  liveUrl?: string
  collectionEmbedSnippet?: string
  embedNeedsReconnect?: boolean
}

type PublishPreview = {
  sectionCmsMapping?: SectionCmsMappingRow[]
  sectionCmsMappedCount?: number
  canPublish?: boolean
  htmlMode?: string
  usesEmbed?: boolean
  resolvedFields?: string[]
  error?: string
}

export function PublishDialog({
  open,
  onOpenChange,
  project,
  projectId,
  orgId,
  onPublished,
}: PublishDialogProps) {
  const [publishing, setPublishing] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PublishPreview | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(Boolean(project?.showOnWebsite))
  const [publishSite, setPublishSite] = useState(project?.publishSite !== false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)

  const isLandingPage = project?.contentType === 'landing_page'
  const integrationId = project?.webflowIntegrationId as string | undefined
  const missingSectionFields =
    preview?.sectionCmsMapping?.some((r) => r.status === 'missing_field') ?? false

  const loadPreview = async () => {
    if (!project?.cmsCollectionId) {
      setPreview(null)
      setPreviewError('Select a CMS collection before publishing.')
      return
    }
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/publish-preview`, {
        headers: { 'ngrok-skip-browser-warning': '1' },
      })
      const data = await parseJsonResponse<PublishPreview & { error?: string }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Preview failed')
      setPreview(data)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Could not load publish preview')
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setShowOnWebsite(Boolean(project?.showOnWebsite))
    setPublishSite(project?.publishSite !== false)
    setResult(null)
    if (isLandingPage) loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, project?.cmsCollectionId, isLandingPage])

  const copySnippet = async (snippet: string) => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const publish = async () => {
    setPublishing(true)
    setResult(null)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ showOnWebsite, publishSite }),
      })

      const res = await fetch(`/api/projects/${projectId}?action=publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ publishSite }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')

      if (data.embedNeedsReconnect) {
        setResult({
          type: 'warning',
          message:
            data.embedMessage ??
            'CMS updated, but automatic iframe embed could not be applied. Reconnect Webflow via OAuth or paste the manual embed below.',
          liveUrl: data.liveUrl,
          collectionEmbedSnippet: data.collectionEmbedSnippet,
          embedNeedsReconnect: true,
        })
      } else {
        setResult({
          type: 'success',
          message: data.embedMessage ?? 'Published to Webflow successfully.',
          liveUrl: data.liveUrl,
        })
      }
      onPublished?.()
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Publish failed',
      })
    } finally {
      setPublishing(false)
    }
  }

  const settingsUrl = `/dashboard/${orgId}/settings?tab=integrations`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#09090b] border-zinc-800 text-white sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Publish to Webflow
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs mt-2">
            Syncs content, SEO fields, section CMS data, and iframe embed for HTML pages.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Layout className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Webflow CMS</p>
                <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tighter">
                  {project?.webflowCmsItemId ? 'Item linked' : 'Will create item'}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              {preview?.canPublish === false ? 'Check fields' : 'Ready'}
            </Badge>
          </div>

          {isLandingPage && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  Publish preview
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-zinc-500 gap-1"
                  onClick={loadPreview}
                  disabled={previewLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {previewLoading && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 py-4 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading field mapping…
                </div>
              )}

              {previewError && !previewLoading && (
                <p className="text-xs text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  {previewError}
                </p>
              )}

              {preview?.sectionCmsMapping && !previewLoading && (
                <SectionCmsMappingPreview
                  rows={preview.sectionCmsMapping}
                  mappedCount={preview.sectionCmsMappedCount}
                />
              )}

              {missingSectionFields && integrationId && !previewLoading && (
                <CreateLandingCollectionCard
                  orgId={orgId}
                  integrationId={integrationId}
                  onCreated={() => loadPreview()}
                  compact
                />
              )}

              {preview?.htmlMode && !previewLoading && (
                <p className="text-[10px] text-zinc-600">
                  Rendering: {preview.htmlMode.replace('_', ' ')}
                  {preview.usesEmbed ? ' · iframe embed' : ''}
                  {preview.resolvedFields?.length
                    ? ` · ${preview.resolvedFields.length} CMS fields`
                    : ''}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Show on website</p>
                <p className="text-[11px] text-zinc-500 leading-snug">Publish as live CMS item (not draft).</p>
              </div>
              <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} />
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Publish Webflow site</p>
                <p className="text-[11px] text-zinc-500 leading-snug">Push site changes live after CMS update.</p>
              </div>
              <Switch checked={publishSite} onCheckedChange={setPublishSite} />
            </div>
          </div>

          {result && (
            <div className="space-y-3">
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                  result.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : result.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 min-w-0">
                  <p>{result.message}</p>
                  {result.embedNeedsReconnect && (
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Automatic embed requires OAuth with <code className="text-amber-200">custom_code</code>{' '}
                      scopes. Site API tokens cannot install the embed script — reconnect once below.
                    </p>
                  )}
                  {result.liveUrl && (
                    <a
                      href={result.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-1"
                    >
                      View live page <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {result.embedNeedsReconnect && (
                <div className="space-y-3">
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 gap-2 h-9">
                    <Link href={settingsUrl}>
                      <Plug className="h-4 w-4" />
                      Reconnect Webflow in Settings
                    </Link>
                  </Button>

                  {result.collectionEmbedSnippet && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                        Manual embed (one-time)
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        In Webflow Designer, open your CMS Collection Template → add an Embed element → paste this
                        before the closing body tag. Publish the site once.
                      </p>
                      <pre className="text-[10px] font-mono text-zinc-300 bg-black/40 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {result.collectionEmbedSnippet}
                      </pre>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 border-zinc-700 text-xs gap-2"
                        onClick={() => copySnippet(result.collectionEmbedSnippet!)}
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? 'Copied!' : 'Copy embed code'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-zinc-800 text-zinc-400 hover:text-white"
            onClick={() => onOpenChange(false)}
            disabled={publishing}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] gap-2"
            onClick={publish}
            disabled={publishing || (preview !== null && preview.canPublish === false)}
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Go Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
