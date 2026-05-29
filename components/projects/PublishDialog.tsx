'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  Zap,
  ArrowRight,
} from 'lucide-react'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { ScheduleNotifyPanel, type ScheduleNotifySettings } from '@/components/projects/ScheduleNotifyPanel'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { normalizePublishHtmlMode, type PublishHtmlModeOverride } from '@/lib/content/rendering-strategy'
import {
  DEFAULT_PUBLISH_DELIVERY_MODE,
  DELIVERY_MODE_DESCRIPTIONS,
} from '@/lib/webflow/marketplace-policy'

type PublishDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Record<string, unknown> | null
  projectId: string
  orgId: string
  onPublished?: (result?: { liveUrl?: string; previewUrl?: string }) => void
  /** Flush visual editor HTML to DB before publish (blocks, styles, etc.). */
  onBeforePublish?: () => Promise<string | null | void>
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
  runtimeAutoConfigured?: boolean
  usedRemoteRuntime?: boolean
}

type PublishPreview = {
  canPublish?: boolean
  htmlMode?: string
  publishHtmlMode?: string
  htmlLineCount?: number
  htmlLineThreshold?: number
  usesEmbed?: boolean
  usesRemoteRuntime?: boolean
  usesSplitPlainText?: boolean
  usesIframeEmbed?: boolean
  runtimeConfigured?: boolean
  collectionTemplateSnippet?: string
  runtimeUrl?: string
  resolvedFields?: string[]
  error?: string
}

function defaultScheduleInput() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

function slugifyForWebflow(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function PublishDialog({
  open,
  onOpenChange,
  project,
  projectId,
  orgId,
  onPublished,
  onBeforePublish,
}: PublishDialogProps) {
  const [publishing, setPublishing] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PublishPreview | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(Boolean(project?.showOnWebsite))
  const [publishSite, setPublishSite] = useState(project?.publishSite === false ? false : true)
  const [publishMode, setPublishMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleInput)
  const [publishHtmlMode, setPublishHtmlMode] = useState<PublishHtmlModeOverride>(
    DEFAULT_PUBLISH_DELIVERY_MODE,
  )
  const [cmsSlug, setCmsSlug] = useState('')
  const [result, setResult] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [notifySettings, setNotifySettings] = useState<ScheduleNotifySettings>({
    notifySubscribers: false,
    audienceTypes: ['lead', 'newsletter'],
    emailCampaignId: '',
  })

  const isLandingPage = project?.contentType === 'landing_page'
  const minScheduleInput = useMemo(() => new Date().toISOString().slice(0, 16), [open])
  const deliveryDescription =
    DELIVERY_MODE_DESCRIPTIONS[
      publishHtmlMode === 'auto' ? DEFAULT_PUBLISH_DELIVERY_MODE : publishHtmlMode
    ] ?? DELIVERY_MODE_DESCRIPTIONS.remote_runtime

  // --- Readiness checks ---
  const hasCmsCollection = Boolean(project?.cmsCollectionId)
  const fieldsReady = preview?.canPublish !== false
  const scheduleValid = publishMode === 'now' || (publishMode === 'later' && scheduledAt.length > 0)
  const slugValid = !isLandingPage || cmsSlug.trim().length > 0
  const canPublish =
    !publishing &&
    hasCmsCollection &&
    fieldsReady &&
    scheduleValid &&
    slugValid &&
    !previewLoading

  const blockReason = !hasCmsCollection
    ? 'Connect a CMS collection first'
    : previewLoading
      ? 'Checking fields…'
      : preview?.canPublish === false
        ? 'Resolve field mapping errors'
        : !slugValid
          ? 'Enter a Webflow CMS slug'
          : publishMode === 'later' && !scheduledAt
            ? 'Specify a release date'
            : null

  const savePublishSettings = async () => {
    const params = { ...((project?.parameters as Record<string, unknown>) ?? {}) }
    params.publishHtmlMode = publishHtmlMode
    if (cmsSlug.trim()) params.slug = slugifyForWebflow(cmsSlug.trim())
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showOnWebsite, publishSite, parameters: params }),
    })
  }

  const loadPreview = async () => {
    if (!project?.cmsCollectionId) {
      setPreview(null)
      setPreviewError('Please connect a CMS collection before publishing.')
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
    setPublishSite(project?.publishSite === false ? false : true)
    setResult(null)
    setPublishMode('now')
    setScheduledAt(defaultScheduleInput())
    const params = (project?.parameters as Record<string, unknown>) ?? {}
    const normalized = normalizePublishHtmlMode(params.publishHtmlMode)
    setPublishHtmlMode(normalized === 'auto' ? DEFAULT_PUBLISH_DELIVERY_MODE : normalized)
    const name = String(project?.name ?? 'page')
    setCmsSlug(
      slugifyForWebflow(String(params.slug ?? params.cmsSlug ?? name)),
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
      let renderedHtml: string | undefined
      if (onBeforePublish) {
        const flushed = await onBeforePublish()
        if (typeof flushed === 'string' && flushed.trim()) {
          renderedHtml = flushed.trim()
        }
      }
      if (publishMode === 'later') {
        const scheduledFor = new Date(scheduledAt)
        if (Number.isNaN(scheduledFor.getTime())) throw new Error('Please pick a valid date and time')
        const res = await fetch(`/api/projects/${projectId}?action=schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledFor: scheduledFor.toISOString(),
            frequency: 'once',
            publishSite,
            notifySubscribers: notifySettings.notifySubscribers,
            audienceTypes: notifySettings.audienceTypes,
            emailCampaignId: notifySettings.emailCampaignId || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Schedule failed')
        setResult({
          type: 'success',
          message: `Scheduled for ${scheduledFor.toLocaleString()}${notifySettings.notifySubscribers ? ' · subscriber emails queued' : ''}.`,
        })
        onPublished?.()
        return
      }
      const res = await fetch(`/api/projects/${projectId}?action=publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishSite,
          renderedHtml,
          publishHtmlMode,
          slug: slugifyForWebflow(cmsSlug.trim()),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')
      if (data.embedNeedsReconnect || data.runtimeNeedsReconnect || data.livePageWarning) {
        setResult({
          type: 'warning',
          message: data.embedMessage ?? data.livePageWarning ?? 'Content updated in CMS, but automatic runtime setup needs attention.',
          liveUrl: data.liveUrl,
          previewUrl: data.previewUrl,
          embedSnippet: data.embedSnippet ?? data.projectEmbedSnippet,
          collectionEmbedSnippet: data.collectionEmbedSnippet,
          collectionTemplateSnippet: data.collectionTemplateSnippet,
          embedNeedsReconnect: true,
          runtimeAutoConfigured: false,
          usedRemoteRuntime: Boolean(data.usedRemoteRuntime),
        })
      } else {
        setResult({
          type: 'success',
          message: data.embedMessage ?? 'Successfully published to Webflow CMS.',
          liveUrl: data.liveUrl,
          previewUrl: data.previewUrl,
          embedSnippet: data.embedSnippet ?? data.projectEmbedSnippet,
          collectionTemplateSnippet:
            data.usedRemoteRuntime && (data.runtimeAutoConfigured || data.embedAutoConfigured)
              ? undefined
              : data.collectionTemplateSnippet,
          runtimeAutoConfigured: Boolean(data.runtimeAutoConfigured ?? data.embedAutoConfigured),
          usedRemoteRuntime: Boolean(data.usedRemoteRuntime),
        })
      }
      onPublished?.({ liveUrl: data.liveUrl, previewUrl: data.previewUrl })
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Publish failed' })
    } finally {
      setPublishing(false)
    }
  }

  const settingsUrl = `/dashboard/${orgId}/settings?tab=integrations`

  return (
    <>
      <style>{`
        .publish-dialog-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
        }
        .publish-dialog-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .publish-dialog-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .publish-dialog-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
        }
        .publish-dialog-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        [data-radix-popper-content-wrapper] [role="option"] {
          color: #d4d4d8 !important;
        }
        [data-radix-popper-content-wrapper] [role="option"]:hover,
        [data-radix-popper-content-wrapper] [role="option"][data-highlighted] {
          background: rgba(255, 255, 255, 0.07) !important;
          color: #ffffff !important;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 border border-zinc-800/80 bg-zinc-950 text-zinc-100 sm:max-w-[580px] w-full h-[85vh] max-h-[720px] flex flex-col p-0 gap-0 shadow-2xl rounded-xl overflow-hidden"
        >
          {/* Subtle Background Glow under layout panels */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[80px] pointer-events-none z-0" />

          {/* ══ STICKY HEADER ══ */}
          <div className="relative sticky top-0 z-30 px-6 py-5 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-zinc-900 border border-zinc-800">
                <Globe className="h-4.5 w-4.5 text-zinc-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-white tracking-tight">
                  Publish to Webflow CMS
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                  Configure dynamic strategy settings and dispatch updates.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* ══ SCROLLABLE CONTENT BODY ══ */}
          <div className="flex-1 overflow-y-auto publish-dialog-scroll px-6 py-6 space-y-6 relative z-10">

            {/* Platform Integration Destination Card */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Layout className="h-4 w-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Webflow CMS Destination</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {project?.webflowCmsItemId ? 'Updates existing target item.' : 'Generates a new CMS item.'}
                  </p>
                </div>
              </div>
              {hasCmsCollection && (
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Connected
                </span>
              )}
            </div>

            {/* ── SECTION: Field Mapping & Logic ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Field Configuration</p>
                <button
                  type="button"
                  onClick={loadPreview}
                  disabled={previewLoading}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {previewLoading && (
                <div className="flex items-center justify-center gap-2 py-4 rounded-xl text-xs text-zinc-400 bg-zinc-900/10 border border-zinc-900/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                  Resolving schemas...
                </div>
              )}

              {previewError && !previewLoading && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs text-amber-400/90 bg-amber-500/[0.03] border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <p className="leading-relaxed">{previewError}</p>
                </div>
              )}

              {preview && !previewLoading && preview.resolvedFields && (
                <div className="flex items-center justify-between p-3.5 rounded-xl text-xs text-zinc-300 bg-zinc-900/20 border border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{preview.resolvedFields.length} active fields mapped successfully</span>
                  </div>
                  {preview.htmlMode && (
                    <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                      {preview.htmlMode.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

              {isLandingPage && !previewLoading && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Webflow CMS slug
                  </Label>
                  <Input
                    value={cmsSlug}
                    onChange={(e) => setCmsSlug(slugifyForWebflow(e.target.value))}
                    placeholder="my-landing-page"
                    className="h-9 text-xs rounded-lg border-zinc-800 bg-zinc-950/80 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    URL path for this item in Webflow (e.g. /your-collection/{cmsSlug || 'slug'}).
                  </p>
                </div>
              )}

              {isLandingPage && !previewLoading && (
                <div className="space-y-3 pt-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Delivery mode
                  </Label>
                  <Select
                    value={publishHtmlMode === 'auto' ? DEFAULT_PUBLISH_DELIVERY_MODE : publishHtmlMode}
                    onValueChange={async (v) => {
                      setPublishHtmlMode(v as PublishHtmlModeOverride)
                      const params = { ...((project?.parameters as Record<string, unknown>) ?? {}) }
                      params.publishHtmlMode = v
                      await fetch(`/api/projects/${projectId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ parameters: params }),
                      })
                      loadPreview()
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-zinc-800 bg-zinc-950/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                      <SelectItem value="remote_runtime" className="text-xs">
                        Remote runtime (recommended)
                      </SelectItem>
                      <SelectItem value="split_plain_text" className="text-xs">
                        Split HTML / CSS / JS
                      </SelectItem>
                      <SelectItem value="iframe_embed" className="text-xs">
                        Iframe embed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{deliveryDescription}</p>
                  <p className="text-[10px] text-zinc-500">
                    On publish, missing CMS fields and collection template custom code are added automatically for
                    the selected mode.
                  </p>
                  {(publishHtmlMode === 'remote_runtime' || preview?.usesRemoteRuntime) && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-emerald-400/90 bg-emerald-500/[0.02] border border-emerald-500/10">
                      <Zap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Template script + Page ID fields will be configured if not present.</span>
                    </div>
                  )}
                  {(publishHtmlMode === 'split_plain_text' || preview?.usesSplitPlainText) && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-blue-400/90 bg-blue-500/[0.02] border border-blue-500/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>Will publish html, css, js to CMS and install the split template script.</span>
                    </div>
                  )}
                  {(publishHtmlMode === 'iframe_embed' || preview?.usesIframeEmbed) && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-violet-400/90 bg-violet-500/[0.02] border border-violet-500/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      <span>Will set iframe-url and install the iframe template script.</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="h-px bg-zinc-900" />

            {/* ── SECTION: Schedule Timings ── */}
            <section className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Dispatch Timeline</p>
              
              {/* Premium Horizontal Slider Selector */}
              <div className="grid grid-cols-2 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    publishMode === 'now'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('later')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    publishMode === 'later'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Schedule Release
                </button>
              </div>

              {publishMode === 'later' && (
                <div className="space-y-3 p-4 rounded-xl bg-zinc-900/20 border border-zinc-900">
                  <Label htmlFor="schedule-at" className="text-xs text-zinc-400 font-medium">
                    Scheduled Publish Date
                  </Label>
                  <input
                    id="schedule-at"
                    type="datetime-local"
                    min={minScheduleInput}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-xs text-zinc-100 outline-none border border-zinc-800 bg-zinc-950 transition focus:border-zinc-700"
                    style={{ colorScheme: 'dark' }}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Your updates will queue in the background and publish at the exact chosen time.
                  </p>
                </div>
              )}

              {publishMode === 'later' && (
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              )}
            </section>

            <div className="h-px bg-zinc-900" />

            {/* ── SECTION: Project Visibility Preferences ── */}
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Preferences</p>
              <div className="divide-y divide-zinc-900 rounded-xl border border-zinc-900 bg-zinc-900/10">
                {[
                  {
                    id: 'show-on-website',
                    checked: showOnWebsite,
                    onChange: setShowOnWebsite,
                    label: 'Visible on Live Website',
                    description: 'Deploy asset active on client interfaces immediately rather than draft.',
                  },
                  {
                    id: 'publish-webflow-site',
                    checked: publishSite,
                    onChange: setPublishSite,
                    label: 'Trigger Master Webflow Site Publish',
                    description: 'Initiate standard domain compile sequence across staging and production.',
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-300">{item.label}</p>
                      <p className="text-[11px] text-zinc-500 leading-normal">{item.description}</p>
                    </div>
                    <Switch id={item.id} checked={item.checked} onCheckedChange={item.onChange} className="shrink-0" />
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION: Response Log Outputs ── */}
            {result && (
              <div className="space-y-4 pt-1">
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl text-xs leading-relaxed border ${
                    result.type === 'success'
                      ? 'text-emerald-300 bg-emerald-500/[0.02] border-emerald-500/20'
                      : result.type === 'warning'
                        ? 'text-amber-300 bg-amber-500/[0.02] border-amber-500/20'
                        : 'text-red-300 bg-red-500/[0.02] border-red-500/20'
                  }`}
                >
                  {result.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <p className="font-semibold text-zinc-200">{result.message}</p>
                    {result.embedNeedsReconnect && (
                      <p className="text-[11px] text-zinc-400">
                        Authorize Webflow API connection with{' '}
                        <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">custom_code</code>{' '}
                        scopes to allow automated configuration.
                      </p>
                    )}
                    {result.runtimeAutoConfigured && result.usedRemoteRuntime && (
                      <p className="text-[11px] text-zinc-400">
                        Server-side runtime pipeline verified. Real-time updates active.
                      </p>
                    )}
                    {result.liveUrl && (
                      <a
                        href={result.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
                      >
                        Launch live production URL <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {(result.type === 'success' || result.type === 'warning') && result.previewUrl && (
                  <ProjectUrlsCard projectId={projectId} liveUrl={result.liveUrl} embedSnippet={result.embedSnippet} compact />
                )}

                {(result.type === 'success' || result.type === 'warning') && result.collectionTemplateSnippet && (
                  <div className="rounded-xl p-4 bg-zinc-950 border border-zinc-900 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Manual Fallback Embed
                    </p>
                    <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-[160px] publish-dialog-scroll border border-zinc-900">
                      {result.collectionTemplateSnippet}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copySnippet(result.collectionTemplateSnippet!)}
                      className="w-full h-9 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? 'Snippet Copied' : 'Copy Embed Snippet'}
                    </button>
                  </div>
                )}

                {result.embedNeedsReconnect && (
                  <div className="space-y-3">
                    <Button
                      asChild
                      className="w-full h-10 gap-2 rounded-xl font-medium text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                    >
                      <Link href={settingsUrl}>
                        <Plug className="h-4 w-4" />
                        Configure Webflow Integration Settings
                        <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                      </Link>
                    </Button>

                    {result.collectionEmbedSnippet && (
                      <div className="rounded-xl p-4 bg-zinc-950 border border-zinc-900 space-y-3">
                        <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-[160px] publish-dialog-scroll border border-zinc-900">
                          {result.collectionEmbedSnippet}
                        </pre>
                        <button
                          type="button"
                          onClick={() => copySnippet(result.collectionEmbedSnippet!)}
                          className="w-full h-9 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? 'Code Snippet Copied' : 'Copy Embed Code'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ STICKY FOOTER ══ */}
          <div className="relative sticky bottom-0 z-30 px-6 py-4 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md shrink-0 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={publishing}
              className="h-10 px-4 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {blockReason && (
                <span className="text-[11px] text-zinc-500 hidden sm:inline">{blockReason}</span>
              )}
              <button
                type="button"
                onClick={canPublish ? handleSubmit : undefined}
                disabled={!canPublish}
                className={`h-10 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 transition active:scale-[0.98] ${
                  canPublish
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15 border border-blue-400/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {publishing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : publishMode === 'later' ? (
                  <CalendarClock className="h-3.5 w-3.5" />
                ) : (
                  <Globe className="h-3.5 w-3.5" />
                )}
                {publishing ? 'Publishing...' : publishMode === 'later' ? 'Schedule Release' : 'Publish to CMS'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}