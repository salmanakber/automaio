'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  Zap,
  Search,
  ArrowRight,
  Lock,
} from 'lucide-react'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { ScheduleNotifyPanel, type ScheduleNotifySettings } from '@/components/projects/ScheduleNotifyPanel'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
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
  runtimeConfigured?: boolean
  runtimeUrl?: string
  resolvedFields?: string[]
  error?: string
}

function defaultScheduleInput() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

const SEO_RISK_MODES = ['remote_runtime', 'iframe_embed']

function isSeoBadMode(mode: string, preview?: PublishPreview | null) {
  return SEO_RISK_MODES.includes(mode) || (mode === 'auto' && preview?.usesRemoteRuntime)
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
  const [result, setResult] = useState<PublishResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [notifySettings, setNotifySettings] = useState<ScheduleNotifySettings>({
    notifySubscribers: false,
    audienceTypes: ['lead', 'newsletter'],
    emailCampaignId: '',
  })

  const isLandingPage = project?.contentType === 'landing_page'
  const minScheduleInput = useMemo(() => new Date().toISOString().slice(0, 16), [open])
  const showSeoAlert = isLandingPage && isSeoBadMode(publishHtmlMode, preview)

  // --- Readiness checks ---
  const hasCmsCollection = Boolean(project?.cmsCollectionId)
  const fieldsReady = preview?.canPublish !== false
  const scheduleValid = publishMode === 'now' || (publishMode === 'later' && scheduledAt.length > 0)
  const canPublish = !publishing && hasCmsCollection && fieldsReady && scheduleValid && !previewLoading

  // Blocking reason shown under the button
  const blockReason = !hasCmsCollection
    ? 'Connect a CMS collection first'
    : previewLoading
      ? 'Checking field mapping…'
      : preview?.canPublish === false
        ? 'Fix the field mapping issues below'
        : publishMode === 'later' && !scheduledAt
          ? 'Pick a scheduled date & time'
          : null

  const savePublishSettings = async () => {
    const params = { ...((project?.parameters as Record<string, unknown>) ?? {}) }
    params.publishHtmlMode = publishHtmlMode
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
    setPublishSite(project?.publishSite !== false)
    setResult(null)
    setPublishMode('now')
    setScheduledAt(defaultScheduleInput())
    const params = (project?.parameters as Record<string, unknown>) ?? {}
    const mode = params.publishHtmlMode
    setPublishHtmlMode(
      mode === 'iframe_embed' || mode === 'rich_text_html' || mode === 'custom_code' ||
      mode === 'remote_runtime' || mode === 'split_plain_text' || mode === 'auto' ? mode : 'auto',
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
          message: `Scheduled for ${scheduledFor.toLocaleString()}${notifySettings.notifySubscribers ? ' · subscriber emails will be sent' : ''}.`,
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
      if (data.embedNeedsReconnect || data.runtimeNeedsReconnect) {
        setResult({
          type: 'warning',
          message: data.embedMessage ?? 'Content updated in CMS, but automatic runtime setup needs attention.',
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
            data.runtimeAutoConfigured || data.embedAutoConfigured ? undefined : data.collectionTemplateSnippet,
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
          className="publish-dialog-scroll relative overflow-hidden border border-zinc-800/80 bg-zinc-950 text-zinc-100 sm:max-w-[580px] max-h-[88vh] overflow-y-auto p-0 gap-0 shadow-2xl backdrop-blur-xl transition-all"
          style={{
            background: 'linear-gradient(160deg, #09090b 0%, #030303 100%)',
          }}
        >
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />

          {/* Premium Glowing Top Accent Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent z-10" />

          {/* ══ HEADER ══ */}
          <div className="relative px-6 pt-6 pb-5 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Globe className="h-[18px] w-[18px] text-blue-400" />
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0 pt-0.5">
                <DialogTitle className="text-[15px] font-semibold text-white tracking-tight leading-none">
                  Publish to Webflow CMS
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Sync content, configure delivery, and push updates live.
                </DialogDescription>
              </div>

              {/* Status Badge */}
              <div
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                  !hasCmsCollection || preview?.canPublish === false
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    !hasCmsCollection || preview?.canPublish === false ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  }`}
                />
                {!hasCmsCollection ? 'Setup needed' : preview?.canPublish === false ? 'Check fields' : 'Ready'}
              </div>
            </div>

            {/* Top Publish CTA Action Area */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={canPublish ? handleSubmit : undefined}
                disabled={!canPublish}
                className="relative w-full h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 overflow-hidden active:scale-[0.99]"
                style={
                  canPublish
                    ? {
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        boxShadow: '0 4px 20px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                        color: '#fff',
                        cursor: 'pointer',
                      }
                    : {
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.25)',
                        cursor: 'not-allowed',
                      }
                }
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !canPublish && !publishing ? (
                  <Lock className="h-3.5 w-3.5 opacity-60" />
                ) : publishMode === 'later' ? (
                  <CalendarClock className="h-4 w-4" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {publishing
                  ? 'Publishing…'
                  : publishMode === 'later'
                    ? 'Schedule Publish'
                    : 'Publish Now'}
              </button>

              {blockReason && (
                <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3 text-zinc-600" />
                  {blockReason}
                </p>
              )}
            </div>
          </div>

          {/* ══ SCROLLABLE BODY ══ */}
          <div className="px-6 py-6 space-y-6">

            {/* Integration Platform Card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40 shadow-inner">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-800/40 border border-zinc-700/30">
                <Layout className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300">Webflow CMS Integration</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {project?.webflowCmsItemId ? 'Updates existing target item.' : 'Generates a new CMS item.'}
                </p>
              </div>
              {hasCmsCollection && (
                <span className="text-[10px] bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 px-2 py-0.5 rounded-full shrink-0">
                  Collection Linked
                </span>
              )}
            </div>

            {/* ── SECTION: Field Mapping & Options ── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Field Mapping</p>
                <button
                  type="button"
                  onClick={loadPreview}
                  disabled={previewLoading}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} />
                  Refresh mapping
                </button>
              </div>

              {previewLoading && (
                <div className="flex items-center justify-center gap-2 py-5 rounded-xl text-xs text-zinc-400 bg-zinc-900/10 border border-zinc-900">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  Checking configuration status…
                </div>
              )}

              {previewError && !previewLoading && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <p className="leading-relaxed">{previewError}</p>
                </div>
              )}

              {preview && !previewLoading && preview.resolvedFields && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl text-xs text-zinc-300 bg-emerald-500/5 border border-emerald-500/15">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>
                      {preview.resolvedFields.length} active field{preview.resolvedFields.length !== 1 ? 's' : ''} mapped
                    </span>
                  </div>
                  {preview.htmlMode && (
                    <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {preview.htmlMode.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

              {/* Delivery Mode Custom Select */}
              {isLandingPage && !previewLoading && (
                <div className="space-y-2 pt-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Delivery Mode
                  </Label>

                  <Select
                    value={publishHtmlMode}
                    onValueChange={(v) => setPublishHtmlMode(v as PublishHtmlModeOverride)}
                  >
                    <SelectTrigger
                      className="h-10 text-xs rounded-xl px-3 text-zinc-200 border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 focus:ring-1 focus:ring-blue-500/40 transition-all"
                    >
                      <SelectValue className="text-zinc-200" />
                    </SelectTrigger>
                    <SelectContent
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl"
                    >
                      {[
                        {
                          value: 'auto',
                          label: `Auto — system selected${preview?.htmlLineCount ? ` (${preview.htmlLineCount} lines)` : ''}`,
                        },
                        { value: 'remote_runtime', label: '⚡ Remote Runtime — instant JS sync' },
                        { value: 'split_plain_text', label: 'Split HTML / CSS / JS — static CMS fields' },
                        { value: 'custom_code', label: 'Full HTML in CMS body' },
                        { value: 'iframe_embed', label: 'iFrame embed' },
                        { value: 'rich_text_html', label: 'Rich Text — force full HTML' },
                      ].map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-xs rounded-lg px-3 py-2 cursor-pointer text-zinc-300 focus:bg-zinc-900 focus:text-white data-[highlighted]:bg-zinc-900 data-[highlighted]:text-white"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* High Quality SEO Warning Card */}
                  {showSeoAlert && (
                    <div className="rounded-xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
                      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/10">
                        <Search className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">SEO Impact Advisory</p>
                      </div>
                      <div className="px-3 py-3 space-y-2 text-xs leading-relaxed">
                        <p className="text-yellow-200/80">
                          Because this mode renders via client-side JavaScript, search engine web-crawlers{' '}
                          <strong className="text-yellow-300">might not index</strong> your complete layout content correctly.
                        </p>
                        <p className="text-yellow-500/70 text-[11px]">
                          If search visibility is a priority, consider using{' '}
                          <strong className="text-yellow-500/90">Split HTML/CSS/JS</strong> or{' '}
                          <strong className="text-yellow-500/90">Rich Text</strong>. These strategies deploy standard code assets directly inside the CMS container allowing native discovery.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Runtime Note */}
                  {preview?.usesRemoteRuntime && !showSeoAlert && (
                    <div className="flex items-start gap-2 px-3 py-3 rounded-xl text-xs text-emerald-400/90 leading-relaxed bg-emerald-500/5 border border-emerald-500/10">
                      <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Runtime is initialized. Delivery updates happen instantaneously on your live website.</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="h-px bg-zinc-900" />

            {/* ── SECTION: Schedule Timing Options ── */}
            <section className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Schedule Options</p>
              <RadioGroup
                value={publishMode}
                onValueChange={(v) => setPublishMode(v as 'now' | 'later')}
                className="grid grid-cols-2 gap-3"
              >
                {(['now', 'later'] as const).map((mode) => (
                  <label
                    key={mode}
                    htmlFor={`publish-${mode}`}
                    className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                      publishMode === mode
                        ? 'border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                        : 'border-zinc-900 bg-zinc-900/10 hover:border-zinc-800'
                    }`}
                  >
                    <RadioGroupItem value={mode} id={`publish-${mode}`} className="sr-only" />
                    <div
                      className={`h-4 w-4 rounded-full border shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                        publishMode === mode ? 'border-blue-500' : 'border-zinc-700'
                      }`}
                    >
                      {publishMode === mode && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${publishMode === mode ? 'text-blue-400' : 'text-zinc-300'}`}>
                        {mode === 'now' ? 'Publish Now' : 'Schedule Later'}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                        {mode === 'now' ? 'Instantly goes live.' : 'Pushes code on custom date.'}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {publishMode === 'later' && (
                <div className="space-y-3 rounded-xl p-4 bg-zinc-900/20 border border-zinc-900">
                  <Label htmlFor="schedule-at" className="text-xs text-zinc-400 font-medium">
                    Scheduled Release Time
                  </Label>
                  <input
                    id="schedule-at"
                    type="datetime-local"
                    min={minScheduleInput}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500/40 border border-zinc-800 bg-zinc-950 transition-all"
                    style={{ colorScheme: 'dark' }}
                  />
                  <p className="text-[11px] text-zinc-500">
                    The queue processor updates content in the background automatically.
                  </p>
                </div>
              )}

              {publishMode === 'later' && (
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              )}
            </section>

            <div className="h-px bg-zinc-900" />

            {/* ── SECTION: Project Visibility ── */}
            <section className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Target Visibility</p>
              {[
                {
                  id: 'show-on-website',
                  checked: showOnWebsite,
                  onChange: setShowOnWebsite,
                  label: 'Visible on Website',
                  description: 'Launches immediately as a public node rather than saving as draft.',
                },
                {
                  id: 'publish-webflow-site',
                  checked: publishSite,
                  onChange: setPublishSite,
                  label: 'Trigger Webflow CMS Publish',
                  description: 'Executes a master rebuild/publish on target domain.',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl border border-transparent hover:border-zinc-900 transition-all duration-200"
                >
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">{item.label}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{item.description}</p>
                  </div>
                  <Switch id={item.id} checked={item.checked} onCheckedChange={item.onChange} className="shrink-0" />
                </div>
              ))}
            </section>

            {/* ── SECTION: Output Result Snippets ── */}
            {result && (
              <div className="space-y-4 pt-2">
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl text-xs leading-relaxed border ${
                    result.type === 'success'
                      ? 'text-emerald-300 bg-emerald-500/5 border-emerald-500/20'
                      : result.type === 'warning'
                        ? 'text-amber-300 bg-amber-500/5 border-amber-500/20'
                        : 'text-red-300 bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {result.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <p className="font-medium text-zinc-200">{result.message}</p>
                    {result.embedNeedsReconnect && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Authorize Webflow API connection using{' '}
                        <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">custom_code</code>{' '}
                        scopes to activate dynamic sync features. You can alternatively configure standard manually below.
                      </p>
                    )}
                    {result.runtimeAutoConfigured && result.usedRemoteRuntime && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Static dynamic runtime setup completed. Realtime changes will push smoothly now.
                      </p>
                    )}
                    {result.liveUrl && (
                      <a
                        href={result.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
                      >
                        Launch live production URL <ExternalLink className="h-3 w-3" />
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
                      Collection Template Embed (Manual Integration)
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

          {/* ══ FOOTER ══ */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-900 bg-zinc-950/20">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={publishing}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 disabled:opacity-40"
            >
              Cancel
            </button>
            <p className="text-[11px] text-zinc-500 font-medium">
              {canPublish ? 'Validation succeeded' : blockReason ?? ''}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}