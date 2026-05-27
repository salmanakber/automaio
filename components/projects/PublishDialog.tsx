'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  CalendarClock,
} from 'lucide-react'
import { PublishLayoutControls } from '@/components/projects/PublishLayoutControls'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { parseLayoutControls } from '@/lib/webflow/layout-controls'
import type { LayoutControls } from '@/lib/ai/business-context-types'
import type { PublishHtmlModeOverride } from '@/lib/content/rendering-strategy'

type PublishDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Record<string, unknown> | null
  projectId: string
  orgId: string
  onPublished?: (result?: { liveUrl?: string; previewUrl?: string }) => void
}

type PublishResult = {
  type: 'success' | 'error' | 'warning'
  message: string
  liveUrl?: string
  previewUrl?: string
  embedSnippet?: string
  collectionEmbedSnippet?: string
  collectionTemplateSnippet?: string
  embedNeedsReconnect?: boolean
}

type PublishPreview = {
  canPublish?: boolean
  htmlMode?: string
  publishHtmlMode?: string
  htmlLineCount?: number
  htmlLineThreshold?: number
  usesEmbed?: boolean
  resolvedFields?: string[]
  error?: string
}

function defaultScheduleInput() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.toISOString().slice(0, 16)
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
  const [publishMode, setPublishMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleInput)
  const [publishHtmlMode, setPublishHtmlMode] = useState<PublishHtmlModeOverride>('auto')
  const [layoutControls, setLayoutControls] = useState<LayoutControls>(() =>
    parseLayoutControls((project?.parameters as Record<string, unknown>) ?? {}),
  )
  const [result, setResult] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)

  const isLandingPage = project?.contentType === 'landing_page'
  const minScheduleInput = useMemo(() => new Date().toISOString().slice(0, 16), [open])

  const savePublishSettings = async () => {
    const params = { ...((project?.parameters as Record<string, unknown>) ?? {}) }
    params.layoutControls = JSON.stringify(layoutControls)
    params.publishHtmlMode = publishHtmlMode

    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        showOnWebsite,
        publishSite,
        parameters: params,
      }),
    })
  }

  const loadPreview = async () => {
    if (!project?.cmsCollectionId) {
      setPreview(null)
      setPreviewError('Select a CMS collection before publishing.')
      return
    }
    setPreviewLoading(true)
    setPreviewError('')
    try {
      await savePublishSettings()
      const res = await fetch(`/api/projects/${projectId}/publish-preview`, {
        credentials: 'same-origin',
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
    setPublishMode('now')
    setScheduledAt(defaultScheduleInput())
    const params = (project?.parameters as Record<string, unknown>) ?? {}
    setLayoutControls(parseLayoutControls(params))
    const mode = params.publishHtmlMode
    setPublishHtmlMode(
      mode === 'iframe_embed' || mode === 'rich_text_html' || mode === 'custom_code' || mode === 'auto'
        ? mode
        : 'auto',
    )
    if (project?.cmsCollectionId) loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, project?.cmsCollectionId])

  const copySnippet = async (snippet: string) => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    setPublishing(true)
    setResult(null)
    try {
      await savePublishSettings()

      if (publishMode === 'later') {
        const scheduledFor = new Date(scheduledAt)
        if (Number.isNaN(scheduledFor.getTime())) {
          throw new Error('Pick a valid date and time')
        }
        const res = await fetch(`/api/projects/${projectId}?action=schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledFor: scheduledFor.toISOString(),
            frequency: 'once',
            publishSite,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Schedule failed')
        setResult({
          type: 'success',
          message: `Scheduled for ${scheduledFor.toLocaleString()}${publishSite ? ' (includes live site publish)' : ''}.`,
        })
        onPublished?.()
        return
      }

      const res = await fetch(`/api/projects/${projectId}?action=publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishSite }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')

      if (data.embedNeedsReconnect) {
        setResult({
          type: 'warning',
          message:
            data.embedMessage ??
            'CMS item created/updated, but automatic iframe embed could not be applied.',
          liveUrl: data.liveUrl,
          previewUrl: data.previewUrl,
          embedSnippet: data.embedSnippet ?? data.projectEmbedSnippet,
          collectionEmbedSnippet: data.collectionEmbedSnippet,
          embedNeedsReconnect: true,
        })
      } else {
        setResult({
          type: 'success',
          message: data.embedMessage ?? 'Published to Webflow CMS successfully.',
          liveUrl: data.liveUrl,
          previewUrl: data.previewUrl,
          embedSnippet: data.embedSnippet ?? data.projectEmbedSnippet,
          collectionTemplateSnippet: data.collectionTemplateSnippet,
        })
      }
      onPublished?.({
        liveUrl: data.liveUrl,
        previewUrl: data.previewUrl,
      })
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
      <DialogContent className="bg-[#09090b] border-zinc-800 text-white sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Publish to Webflow CMS
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs mt-2">
            Creates or updates a CMS item, maps fields, and optionally publishes your Webflow site.
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                CMS field mapping
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

            {isLandingPage && !previewLoading && (
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wide text-zinc-400">
                  HTML delivery mode
                </Label>
                <Select
                  value={publishHtmlMode}
                  onValueChange={(v) => {
                    setPublishHtmlMode(v as PublishHtmlModeOverride)
                  }}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto ({preview?.htmlLineCount ?? '—'} lines · threshold{' '}
                      {preview?.htmlLineThreshold ?? 4000})
                    </SelectItem>
                    <SelectItem value="split_plain_text">
                      Split HTML / CSS / JS (Plain Text CMS — recommended)
                    </SelectItem>
                    <SelectItem value="custom_code">Full HTML in CMS body (legacy Rich Text)</SelectItem>
                    <SelectItem value="iframe_embed">Iframe embed in CMS body</SelectItem>
                    <SelectItem value="rich_text_html">Full HTML in Rich Text (force)</SelectItem>
                  </SelectContent>
                </Select>
                {preview?.htmlMode && (
                  <p className="text-[10px] text-zinc-600">
                    Resolved: {preview.htmlMode.replace(/_/g, ' ')}
                    {preview.usesEmbed ? ' · collection embed.js' : ''}
                    {preview.resolvedFields?.length
                      ? ` · ${preview.resolvedFields.length} CMS fields`
                      : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {isLandingPage && (
            <PublishLayoutControls
              parameters={{ layoutControls: JSON.stringify(layoutControls) }}
              onChange={setLayoutControls}
              compact
            />
          )}

          <div className="space-y-3">
            <Label className="text-[11px] uppercase tracking-wide text-zinc-400">When to publish</Label>
            <RadioGroup
              value={publishMode}
              onValueChange={(v) => setPublishMode(v as 'now' | 'later')}
              className="flex flex-col gap-2 sm:flex-row sm:gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="now" id="publish-now" />
                <Label htmlFor="publish-now" className="font-normal cursor-pointer text-sm text-zinc-300">
                  Publish now
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="later" id="publish-later" />
                <Label htmlFor="publish-later" className="font-normal cursor-pointer text-sm text-zinc-300">
                  Schedule for later
                </Label>
              </div>
            </RadioGroup>

            {publishMode === 'later' && (
              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <Label htmlFor="schedule-at" className="text-xs text-zinc-400">
                  Date & time
                </Label>
                <input
                  id="schedule-at"
                  type="datetime-local"
                  min={minScheduleInput}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                />
                <p className="text-[10px] text-zinc-500">
                  Requires Redis and the background worker (<code>pnpm run worker</code>).
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Show on website</p>
                <p className="text-[11px] text-zinc-500 leading-snug">Live CMS item (not draft).</p>
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
                      Reconnect Webflow via OAuth with <code className="text-amber-200">custom_code</code> scopes.
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

              {(result.type === 'success' || result.type === 'warning') && result.previewUrl && (
                <ProjectUrlsCard
                  projectId={projectId}
                  liveUrl={result.liveUrl}
                  embedSnippet={result.embedSnippet}
                  compact
                />
              )}

              {(result.type === 'success' || result.type === 'warning') &&
                result.collectionTemplateSnippet && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">
                      Webflow collection template embed (one-time setup)
                    </p>
                    <pre className="text-[10px] font-mono text-zinc-300 bg-black/40 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                      {result.collectionTemplateSnippet}
                    </pre>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 border-zinc-700 text-xs gap-2"
                      onClick={() => copySnippet(result.collectionTemplateSnippet!)}
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copied!' : 'Copy collection template embed'}
                    </Button>
                  </div>
                )}

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
            onClick={handleSubmit}
            disabled={publishing || (preview !== null && preview.canPublish === false)}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : publishMode === 'later' ? (
              <CalendarClock className="h-4 w-4" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {publishMode === 'later' ? 'Schedule' : 'Publish now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
