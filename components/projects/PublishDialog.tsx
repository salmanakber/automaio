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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plug,
  RefreshCw,
  CalendarClock,
  Zap,
  Eye,
  Radio,
  Clock,
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

/* ─────────────────────────────────── small primitives ─── */

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
}

function Tag({ children, color = 'zinc' }: { children: React.ReactNode; color?: 'zinc' | 'emerald' | 'amber' | 'blue' | 'red' }) {
  const map: Record<string, string> = {
    zinc:    'bg-zinc-800 text-zinc-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber:   'bg-amber-500/10 text-amber-400',
    blue:    'bg-blue-500/10 text-blue-400',
    red:     'bg-red-500/10 text-red-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase ${map[color]}`}>
      {children}
    </span>
  )
}

function StatusDot({ status }: { status: 'ok' | 'warn' | 'off' | 'spin' }) {
  if (status === 'spin') return <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
  const map = { ok: 'bg-emerald-400', warn: 'bg-amber-400', off: 'bg-zinc-600' }
  return (
    <span className="relative flex h-2 w-2">
      {status === 'ok' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${map[status]}`} />
    </span>
  )
}

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────── component ─── */

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
      setPreviewError('Select a CMS collection before publishing.')
      return
    }
    setPreviewLoading(true)
    setPreviewError('')
    try {
      await savePublishSettings()
      const res = await fetch(`/api/projects/${projectId}/publish-preview`, { credentials: 'same-origin' })
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
      mode === 'remote_runtime' || mode === 'split_plain_text' || mode === 'auto'
        ? (mode as PublishHtmlModeOverride) : 'auto',
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
        if (Number.isNaN(scheduledFor.getTime())) throw new Error('Pick a valid date and time')
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
          message: `Scheduled for ${scheduledFor.toLocaleString()}. Webflow publish runs at that time${notifySettings.notifySubscribers ? ' + subscriber emails' : ''}.`,
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
          message: data.embedMessage ?? 'CMS item updated, but automatic runtime setup could not be applied.',
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
          message: data.embedMessage ?? 'Published to Webflow CMS successfully.',
          liveUrl: data.liveUrl,
          previewUrl: data.previewUrl,
          embedSnippet: data.embedSnippet ?? data.projectEmbedSnippet,
          collectionTemplateSnippet:
            data.runtimeAutoConfigured || data.embedAutoConfigured
              ? undefined : data.collectionTemplateSnippet,
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
  const canPublish = preview?.canPublish !== false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 text-white p-0 sm:max-w-[560px] max-h-[92vh] overflow-hidden flex flex-col"
        style={{ background: '#0c0c0e', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,0.8)' }}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <Globe className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-white tracking-tight">
                  Deploy to Webflow
                </DialogTitle>
                <DialogDescription className="text-[11px] text-zinc-500 mt-0.5 leading-none">
                  CMS · {project?.webflowCmsItemId ? 'Item linked' : 'New item'} · {project?.cmsCollectionId ? 'Collection ready' : 'No collection'}
                </DialogDescription>
              </div>
            </div>

            {/* live status pill */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <StatusDot status={previewLoading ? 'spin' : !canPublish ? 'warn' : 'ok'} />
              <span className="text-[10px] font-mono text-zinc-400">
                {previewLoading ? 'checking' : !canPublish ? 'review fields' : 'ready'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── CMS Field Mapping ── */}
          <Section
            label="Field mapping"
            action={
              <button
                type="button"
                onClick={loadPreview}
                disabled={previewLoading}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            }
          >
            {previewLoading && (
              <div
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600 shrink-0" />
                <span className="text-xs text-zinc-600">Loading field mapping…</span>
              </div>
            )}

            {previewError && !previewLoading && (
              <div
                className="flex items-start gap-2.5 px-3 py-3 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/90 leading-relaxed">{previewError}</p>
              </div>
            )}

            {preview && !previewLoading && (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="grid grid-cols-3 divide-x" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', divideColor: 'rgba(255,255,255,0.07)' }}>
                  {[
                    { label: 'Mode', value: (preview.htmlMode ?? '—').replace(/_/g, ' ') },
                    { label: 'Lines', value: preview.htmlLineCount != null ? `${preview.htmlLineCount} / ${preview.htmlLineThreshold ?? 4000}` : '—' },
                    { label: 'Fields', value: preview.resolvedFields?.length != null ? `${preview.resolvedFields.length} mapped` : '—' },
                  ].map((item) => (
                    <div key={item.label} className="px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-0.5">{item.label}</p>
                      <p className="text-[11px] font-mono text-zinc-300 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
                {preview.usesRemoteRuntime && (
                  <div className="px-3 py-2.5 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.015)' }}>
                    <Radio className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Remote runtime active — content injected via runtime.js, no embed paste needed.{' '}
                      <span className="text-amber-500/80">Not ideal for JS-disabled crawlers.</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── HTML Delivery Mode (landing pages only) ── */}
          {isLandingPage && !previewLoading && (
            <>
              <Divider />
              <Section label="HTML delivery">
                <Select
                  value={publishHtmlMode}
                  onValueChange={(v) => setPublishHtmlMode(v as PublishHtmlModeOverride)}
                >
                  <SelectTrigger
                    className="h-9 text-xs text-zinc-300 border-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                    <SelectItem value="auto">Auto ({preview?.htmlLineCount ?? '—'} lines · threshold {preview?.htmlLineThreshold ?? 4000})</SelectItem>
                    <SelectItem value="remote_runtime">Remote runtime — auto-configured, no embed paste</SelectItem>
                    <SelectItem value="split_plain_text">Split HTML / CSS / JS in CMS fields</SelectItem>
                    <SelectItem value="custom_code">Full HTML in CMS body (Rich Text)</SelectItem>
                    <SelectItem value="iframe_embed">iframe embed in CMS body</SelectItem>
                    <SelectItem value="rich_text_html">Full HTML in Rich Text (force)</SelectItem>
                  </SelectContent>
                </Select>
              </Section>
            </>
          )}

          {/* ── When to publish ── */}
          <Divider />
          <Section label="Timing">
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {(['now', 'later'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPublishMode(mode)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                    publishMode === mode
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mode === 'now' ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {mode === 'now' ? 'Publish now' : 'Schedule'}
                </button>
              ))}
            </div>

            {publishMode === 'later' && (
              <div className="space-y-3 mt-1">
                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <Label htmlFor="schedule-at" className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                    Date & time
                  </Label>
                  <input
                    id="schedule-at"
                    type="datetime-local"
                    min={minScheduleInput}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-md px-3 py-2 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500/50"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <p className="text-[10px] text-zinc-600">Queued via Redis — fires at this time, not immediately.</p>
                </div>
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              </div>
            )}
          </Section>

          {/* ── Toggles ── */}
          <Divider />
          <Section label="Options">
            <div
              className="rounded-lg overflow-hidden divide-y"
              style={{ border: '1px solid rgba(255,255,255,0.07)', divideColor: 'rgba(255,255,255,0.07)' }}
            >
              {[
                {
                  key: 'showOnWebsite',
                  icon: <Eye className="h-3.5 w-3.5 text-zinc-500" />,
                  label: 'Show on website',
                  sub: 'Publish as live item, not draft',
                  value: showOnWebsite,
                  setter: setShowOnWebsite,
                },
                {
                  key: 'publishSite',
                  icon: <Globe className="h-3.5 w-3.5 text-zinc-500" />,
                  label: 'Publish Webflow site',
                  sub: 'Push site changes live after CMS update',
                  value: publishSite,
                  setter: setPublishSite,
                },
              ].map((opt, i) => (
                <div
                  key={opt.key}
                  className="flex items-center justify-between px-3 py-3"
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                >
                  <div className="flex items-center gap-2.5">
                    {opt.icon}
                    <div>
                      <p className="text-xs font-medium text-zinc-300 leading-none">{opt.label}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{opt.sub}</p>
                    </div>
                  </div>
                  <Switch
                    checked={opt.value}
                    onCheckedChange={opt.setter}
                    className="scale-90"
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* ── Result ── */}
          {result && (
            <>
              <Divider />
              <div className="space-y-3">
                <div
                  className="flex items-start gap-3 p-3.5 rounded-lg text-xs"
                  style={
                    result.type === 'success'
                      ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }
                      : result.type === 'warning'
                        ? { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }
                        : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }
                  }
                >
                  <div className="mt-0.5 shrink-0">
                    {result.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className={`h-4 w-4 ${result.type === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />
                    )}
                  </div>
                  <div className="space-y-2 min-w-0 flex-1">
                    <p className={`leading-relaxed ${result.type === 'success' ? 'text-emerald-300' : result.type === 'warning' ? 'text-amber-300' : 'text-red-300'}`}>
                      {result.message}
                    </p>
                    {result.embedNeedsReconnect && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Reconnect Webflow via OAuth with <code className="text-amber-300 font-mono bg-amber-500/10 px-1 rounded">custom_code</code> scopes to enable automatic runtime setup.
                      </p>
                    )}
                    {result.runtimeAutoConfigured && result.usedRemoteRuntime && (
                      <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                        Runtime bootstrap applied to collection template — future updates deploy without republishing HTML.
                      </p>
                    )}
                    {result.liveUrl && (
                      <a
                        href={result.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
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

                {(result.type === 'success' || result.type === 'warning') && result.collectionTemplateSnippet && (
                  <div
                    className="rounded-lg p-3 space-y-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Tag color="zinc">Manual fallback</Tag>
                      <span className="text-[10px] text-zinc-600">Collection template embed</span>
                    </div>
                    <pre className="text-[10px] font-mono text-zinc-400 p-2.5 rounded-md overflow-x-auto whitespace-pre-wrap break-all" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      {result.collectionTemplateSnippet}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copySnippet(result.collectionTemplateSnippet!)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copied!' : 'Copy collection template embed'}
                    </button>
                  </div>
                )}

                {result.embedNeedsReconnect && (
                  <div className="space-y-2.5">
                    <Button asChild className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-xs gap-2">
                      <Link href={settingsUrl}>
                        <Plug className="h-3.5 w-3.5" />
                        Reconnect Webflow in Settings
                      </Link>
                    </Button>
                    {result.collectionEmbedSnippet && (
                      <div
                        className="rounded-lg p-3 space-y-2.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <pre className="text-[10px] font-mono text-zinc-400 p-2.5 rounded-md overflow-x-auto whitespace-pre-wrap break-all" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          {result.collectionEmbedSnippet}
                        </pre>
                        <button
                          type="button"
                          onClick={() => copySnippet(result.collectionEmbedSnippet!)}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <Copy className="h-3 w-3" />
                          {copied ? 'Copied!' : 'Copy embed code'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 flex gap-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={publishing}
            className="flex-1 h-9 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={publishing || !canPublish}
            className="flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: publishing ? 'rgba(59,130,246,0.5)' : 'rgb(37,99,235)',
              boxShadow: publishing ? 'none' : '0 0 24px rgba(37,99,235,0.35)',
            }}
          >
            {publishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : publishMode === 'later' ? (
              <CalendarClock className="h-3.5 w-3.5" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {publishing ? 'Deploying…' : publishMode === 'later' ? 'Schedule' : 'Deploy now'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}