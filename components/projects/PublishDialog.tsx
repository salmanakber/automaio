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
        ? 'Fix the field mapping issues above'
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
      {/* Custom scrollbar style scoped inside the dialog */}
      <style>{`
        .publish-dialog-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .publish-dialog-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .publish-dialog-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .publish-dialog-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
        }
        .publish-dialog-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
        /* Force dropdown items light */
        [data-radix-popper-content-wrapper] [role="option"] {
          color: #d4d4d8 !important;
        }
        [data-radix-popper-content-wrapper] [role="option"]:hover,
        [data-radix-popper-content-wrapper] [role="option"][data-highlighted] {
          background: rgba(255,255,255,0.07) !important;
          color: #ffffff !important;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="publish-dialog-scroll border-0 text-white sm:max-w-[580px] max-h-[88vh] overflow-y-auto p-0 gap-0"
          style={{
            background: 'linear-gradient(160deg, #0e0e12 0%, #09090c 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.85), 0 0 140px rgba(37,99,235,0.07)',
          }}
        >
          {/* ── TOP ACCENT LINE ── */}
          <div
            className="absolute top-0 inset-x-0 h-px z-10"
            style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(59,130,246,0.55) 50%, transparent 90%)' }}
          />

          {/* ══ HEADER ══ */}
          <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.22), rgba(37,99,235,0.06))',
                  border: '1px solid rgba(59,130,246,0.28)',
                  boxShadow: '0 0 18px rgba(37,99,235,0.18)',
                }}
              >
                <Globe className="h-[18px] w-[18px] text-blue-400" />
              </div>

              {/* Title + desc */}
              <div className="flex-1 min-w-0 pt-0.5">
                <DialogTitle className="text-[14px] font-semibold text-white tracking-tight leading-tight">
                  Publish to Webflow CMS
                </DialogTitle>
                <DialogDescription className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Sync your content, configure delivery, and go live — all in one step.
                </DialogDescription>
              </div>

              {/* Live / needs-attention pill */}
              <div
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                style={{
                  background: !hasCmsCollection || preview?.canPublish === false
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(16,185,129,0.1)',
                  border: !hasCmsCollection || preview?.canPublish === false
                    ? '1px solid rgba(245,158,11,0.25)'
                    : '1px solid rgba(16,185,129,0.25)',
                  color: !hasCmsCollection || preview?.canPublish === false ? '#f59e0b' : '#10b981',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: !hasCmsCollection || preview?.canPublish === false ? '#f59e0b' : '#10b981',
                    boxShadow: !hasCmsCollection || preview?.canPublish === false
                      ? '0 0 5px rgba(245,158,11,0.7)'
                      : '0 0 5px rgba(16,185,129,0.7)',
                  }}
                />
                {!hasCmsCollection ? 'Setup needed' : preview?.canPublish === false ? 'Check fields' : 'Ready'}
              </div>
            </div>

            {/* ── PUBLISH BUTTON (top, always visible, disabled until ready) ── */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={canPublish ? handleSubmit : undefined}
                disabled={!canPublish}
                className="relative w-full h-11 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 overflow-hidden"
                style={
                  canPublish
                    ? {
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        boxShadow: '0 0 28px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
                        color: '#fff',
                        cursor: 'pointer',
                      }
                    : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.25)',
                        cursor: 'not-allowed',
                      }
                }
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !canPublish && !publishing ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : publishMode === 'later' ? (
                  <CalendarClock className="h-4 w-4" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {publishing
                  ? 'Publishing…'
                  : publishMode === 'later'
                    ? 'Schedule publish'
                    : 'Publish now'}
              </button>

              {/* Blocking reason hint */}
              {blockReason && (
                <p className="text-center text-[11px] text-zinc-600 flex items-center justify-center gap-1.5">
                  <Lock className="h-2.5 w-2.5" />
                  {blockReason}
                </p>
              )}
            </div>
          </div>

          {/* ══ SCROLLABLE BODY ══ */}
          <div className="px-6 py-6 space-y-6">

            {/* CMS connection row */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Layout className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-zinc-300">Webflow CMS</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {project?.webflowCmsItemId ? 'Existing item will be updated' : 'A new CMS item will be created'}
                </p>
              </div>
              {hasCmsCollection && (
                <span className="text-[10px] text-zinc-600 shrink-0">Collection linked</span>
              )}
            </div>

            {/* ── SECTION: Field Mapping ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Field Mapping</p>
                <button
                  type="button"
                  onClick={loadPreview}
                  disabled={previewLoading}
                  className="flex items-center gap-1 text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${previewLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {previewLoading && (
                <div
                  className="flex items-center justify-center gap-2 py-4 rounded-xl text-[11px] text-zinc-600"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking field mapping…
                </div>
              )}

              {previewError && !previewLoading && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-[11px] text-amber-400/90"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  {previewError}
                </div>
              )}

              {preview && !previewLoading && preview.resolvedFields && (
                <div
                  className="px-3 py-2 rounded-xl text-[11px] text-zinc-500"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 inline mr-1.5 -mt-px" />
                  {preview.resolvedFields.length} field{preview.resolvedFields.length !== 1 ? 's' : ''} mapped
                  {preview.htmlMode && (
                    <span className="text-zinc-700"> · {preview.htmlMode.replace(/_/g, ' ')}</span>
                  )}
                </div>
              )}

              {/* Delivery Mode */}
              {isLandingPage && !previewLoading && (
                <div className="space-y-2 pt-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    Delivery Mode
                  </Label>

                  {/* The Select — force light text via className */}
                  <Select
                    value={publishHtmlMode}
                    onValueChange={(v) => setPublishHtmlMode(v as PublishHtmlModeOverride)}
                  >
                    <SelectTrigger
                      className="h-9 text-[12px] rounded-xl px-3 text-zinc-200 focus:ring-1 focus:ring-blue-500/40"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                      }}
                    >
                      <SelectValue className="text-zinc-200" />
                    </SelectTrigger>
                    <SelectContent
                      className="rounded-xl border-0 p-1"
                      style={{
                        background: '#16161a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                      }}
                    >
                      {[
                        {
                          value: 'auto',
                          label: `Auto — let the system decide${preview?.htmlLineCount ? ` (${preview.htmlLineCount} lines)` : ''}`,
                        },
                        { value: 'remote_runtime', label: '⚡ Remote Runtime — fastest updates, JS-rendered' },
                        { value: 'split_plain_text', label: 'Split HTML / CSS / JS — static CMS fields' },
                        { value: 'custom_code', label: 'Full HTML in CMS body' },
                        { value: 'iframe_embed', label: 'iFrame embed' },
                        { value: 'rich_text_html', label: 'Rich Text — force full HTML' },
                      ].map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-[12px] rounded-lg px-3 py-2 cursor-pointer text-zinc-200 focus:bg-white/[0.07] focus:text-white data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-white"
                          style={{ color: '#d4d4d8' }}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* SEO Alert */}
                  {showSeoAlert && (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(234,179,8,0.07), rgba(234,179,8,0.03))',
                        border: '1px solid rgba(234,179,8,0.18)',
                      }}
                    >
                      <div
                        className="flex items-center gap-2 px-3 py-2"
                        style={{ borderBottom: '1px solid rgba(234,179,8,0.1)' }}
                      >
                        <Search className="h-3 w-3 text-yellow-500 shrink-0" />
                        <p className="text-[11px] font-semibold text-yellow-400">SEO heads-up</p>
                      </div>
                      <div className="px-3 py-2.5 space-y-1.5">
                        <p className="text-[12px] text-yellow-300/80 leading-relaxed">
                          This mode renders via JavaScript — Google and most crawlers{' '}
                          <strong className="text-yellow-300">won't index</strong> your full page content.
                        </p>
                        <p className="text-[11px] text-yellow-500/60 leading-relaxed">
                          If search traffic matters, switch to{' '}
                          <strong className="text-yellow-500/80">Split HTML/CSS/JS</strong> or{' '}
                          <strong className="text-yellow-500/80">Rich Text</strong> — those write content
                          directly into the CMS so crawlers can read it without running JS.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Runtime OK note */}
                  {preview?.usesRemoteRuntime && !showSeoAlert && (
                    <div
                      className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-[11px] text-emerald-400/80 leading-relaxed"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}
                    >
                      <Zap className="h-3 w-3 shrink-0 mt-0.5 text-emerald-500" />
                      Runtime active — content streams via runtime.js, no manual embed needed.
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* ── SECTION: Timing ── */}
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">When to Publish</p>
              <RadioGroup
                value={publishMode}
                onValueChange={(v) => setPublishMode(v as 'now' | 'later')}
                className="grid grid-cols-2 gap-2.5"
              >
                {(['now', 'later'] as const).map((mode) => (
                  <label
                    key={mode}
                    htmlFor={`publish-${mode}`}
                    className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: publishMode === mode ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                      border: publishMode === mode
                        ? '1px solid rgba(59,130,246,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <RadioGroupItem value={mode} id={`publish-${mode}`} className="sr-only" />
                    <div
                      className="h-3.5 w-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: publishMode === mode ? '#3b82f6' : 'rgba(255,255,255,0.2)' }}
                    >
                      {publishMode === mode && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-zinc-300">
                        {mode === 'now' ? 'Publish now' : 'Schedule'}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {mode === 'now' ? 'Goes live immediately' : 'Pick a date & time'}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {publishMode === 'later' && (
                <div
                  className="space-y-2.5 rounded-xl p-3.5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Label htmlFor="schedule-at" className="text-[11px] text-zinc-500">
                    When should this go live?
                  </Label>
                  <input
                    id="schedule-at"
                    type="datetime-local"
                    min={minScheduleInput}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-[12px] text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500/40 transition"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      colorScheme: 'dark',
                    }}
                  />
                  <p className="text-[10px] text-zinc-700 leading-relaxed">
                    Queued in the background — no need to keep this window open.
                  </p>
                </div>
              )}

              {publishMode === 'later' && (
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              )}
            </section>

            <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* ── SECTION: Visibility ── */}
            <section className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Visibility</p>
              {[
                {
                  id: 'show-on-website',
                  checked: showOnWebsite,
                  onChange: setShowOnWebsite,
                  label: 'Visible on your website',
                  description: 'Publishes as live, not a draft.',
                },
                {
                  id: 'publish-webflow-site',
                  checked: publishSite,
                  onChange: setPublishSite,
                  label: 'Trigger Webflow site publish',
                  description: 'Pushes all pending site changes live.',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-3 py-3 rounded-xl transition-colors"
                  style={{ border: '1px solid transparent' }}
                >
                  <div>
                    <p className="text-[12px] font-medium text-zinc-300">{item.label}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{item.description}</p>
                  </div>
                  <Switch id={item.id} checked={item.checked} onCheckedChange={item.onChange} className="shrink-0" />
                </div>
              ))}
            </section>

            {/* ── Result ── */}
            {result && (
              <div className="space-y-3">
                <div
                  className={`flex items-start gap-2.5 p-3.5 rounded-xl text-[12px] leading-relaxed ${
                    result.type === 'success' ? 'text-emerald-300' : result.type === 'warning' ? 'text-amber-300' : 'text-red-300'
                  }`}
                  style={{
                    background:
                      result.type === 'success' ? 'rgba(16,185,129,0.08)' : result.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${result.type === 'success' ? 'rgba(16,185,129,0.2)' : result.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}
                >
                  {result.type === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 min-w-0 flex-1">
                    <p>{result.message}</p>
                    {result.embedNeedsReconnect && (
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        Reconnect Webflow via OAuth with{' '}
                        <code className="text-amber-200 bg-amber-500/10 px-1 rounded text-[10px]">custom_code</code>{' '}
                        scopes to enable automatic runtime setup. Use the manual embed below as a fallback.
                      </p>
                    )}
                    {result.runtimeAutoConfigured && result.usedRemoteRuntime && (
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        Runtime bootstrap applied. Future content updates deploy instantly — no republishing needed.
                      </p>
                    )}
                    {result.liveUrl && (
                      <a
                        href={result.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium underline underline-offset-2"
                      >
                        View live page <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {(result.type === 'success' || result.type === 'warning') && result.previewUrl && (
                  <ProjectUrlsCard projectId={projectId} liveUrl={result.liveUrl} embedSnippet={result.embedSnippet} compact />
                )}

                {(result.type === 'success' || result.type === 'warning') && result.collectionTemplateSnippet && (
                  <div
                    className="rounded-xl p-3.5 space-y-2.5"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      Manual fallback — collection template embed
                    </p>
                    <pre className="text-[10px] font-mono text-zinc-400 bg-black/40 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                      {result.collectionTemplateSnippet}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copySnippet(result.collectionTemplateSnippet!)}
                      className="w-full h-8 rounded-lg text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copied!' : 'Copy embed snippet'}
                    </button>
                  </div>
                )}

                {result.embedNeedsReconnect && (
                  <div className="space-y-2.5">
                    <Button
                      asChild
                      className="w-full h-9 gap-2 rounded-xl font-medium text-[12px]"
                      style={{
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        boxShadow: '0 0 20px rgba(37,99,235,0.3)',
                      }}
                    >
                      <Link href={settingsUrl}>
                        <Plug className="h-3.5 w-3.5" />
                        Reconnect Webflow in Settings
                        <ArrowRight className="h-3 w-3 ml-auto" />
                      </Link>
                    </Button>

                    {result.collectionEmbedSnippet && (
                      <div
                        className="rounded-xl p-3.5 space-y-2.5"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <pre className="text-[10px] font-mono text-zinc-400 bg-black/40 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                          {result.collectionEmbedSnippet}
                        </pre>
                        <button
                          type="button"
                          onClick={() => copySnippet(result.collectionEmbedSnippet!)}
                          className="w-full h-8 rounded-lg text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <Copy className="h-3 w-3" />
                          {copied ? 'Copied!' : 'Copy embed code'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ FOOTER ══ */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={publishing}
              className="h-9 px-4 rounded-xl text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Cancel
            </button>
            <p className="text-[10px] text-zinc-700 text-center">
              {canPublish ? 'All checks passed · ready to go' : blockReason ?? ''}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}