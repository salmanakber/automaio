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
  Zap,
  Eye,
  Search,
  Info,
  ArrowRight,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 text-white sm:max-w-[600px] max-h-[92vh] overflow-y-auto p-0"
        style={{
          background: 'linear-gradient(145deg, #0c0c0f 0%, #0a0a0d 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.8), 0 0 120px rgba(37,99,235,0.08)',
        }}
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-6 border-b border-white/[0.06]">
          {/* Subtle glow accent */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)' }}
          />
          <div className="flex items-start gap-4">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.05))',
                border: '1px solid rgba(59,130,246,0.25)',
                boxShadow: '0 0 20px rgba(37,99,235,0.15)',
              }}
            >
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[15px] font-semibold text-white tracking-tight mb-1">
                Publish to Webflow CMS
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[12px] leading-relaxed">
                Sync your content to Webflow, configure how it renders, and go live — all in one step.
              </DialogDescription>
            </div>
            {/* Status pill */}
            <div
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: preview?.canPublish === false
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(16,185,129,0.1)',
                border: preview?.canPublish === false
                  ? '1px solid rgba(245,158,11,0.25)'
                  : '1px solid rgba(16,185,129,0.25)',
                color: preview?.canPublish === false ? '#f59e0b' : '#10b981',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: preview?.canPublish === false ? '#f59e0b' : '#10b981',
                  boxShadow: preview?.canPublish === false
                    ? '0 0 6px rgba(245,158,11,0.6)'
                    : '0 0 6px rgba(16,185,129,0.6)',
                }}
              />
              {preview?.canPublish === false ? 'Needs attention' : 'Ready'}
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-7">

          {/* CMS Connection Status */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Layout className="h-4.5 w-4.5 text-zinc-400" style={{ height: '18px', width: '18px' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-zinc-200">Webflow CMS</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {project?.webflowCmsItemId ? 'Existing item will be updated' : 'A new CMS item will be created'}
              </p>
            </div>
            {project?.cmsCollectionId && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                Collection linked
              </div>
            )}
          </div>

          {/* CMS Field Mapping */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                Field Mapping
              </p>
              <button
                type="button"
                onClick={loadPreview}
                disabled={previewLoading}
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {previewLoading && (
              <div
                className="flex items-center justify-center gap-2.5 py-5 rounded-xl text-xs text-zinc-600"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                Checking field mapping…
              </div>
            )}

            {previewError && !previewLoading && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[12px] text-amber-400/90"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {previewError}
              </div>
            )}

            {preview && !previewLoading && preview.resolvedFields && (
              <div
                className="px-4 py-3 rounded-xl text-[11px] text-zinc-500 leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {preview.resolvedFields.length} CMS field{preview.resolvedFields.length !== 1 ? 's' : ''} mapped
                {preview.htmlMode && (
                  <span className="text-zinc-700"> · {preview.htmlMode.replace(/_/g, ' ')}</span>
                )}
              </div>
            )}

            {/* HTML Delivery Mode (landing pages only) */}
            {isLandingPage && !previewLoading && (
              <div className="space-y-2.5 pt-1">
                <Label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                  Delivery Mode
                </Label>
                <Select
                  value={publishHtmlMode}
                  onValueChange={(v) => setPublishHtmlMode(v as PublishHtmlModeOverride)}
                >
                  <SelectTrigger
                    className="h-10 text-[13px] border-0 rounded-xl px-4"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#d4d4d8',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: '#111113',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <SelectItem value="auto" className="text-[12px]">
                      Auto — let the system decide{preview?.htmlLineCount ? ` (${preview.htmlLineCount} lines)` : ''}
                    </SelectItem>
                    <SelectItem value="remote_runtime" className="text-[12px]">
                      ⚡ Remote Runtime — fastest updates, JS-rendered
                    </SelectItem>
                    <SelectItem value="split_plain_text" className="text-[12px]">
                      Split HTML/CSS/JS — static CMS fields
                    </SelectItem>
                    <SelectItem value="custom_code" className="text-[12px]">
                      Full HTML in CMS body
                    </SelectItem>
                    <SelectItem value="iframe_embed" className="text-[12px]">
                      iFrame embed
                    </SelectItem>
                    <SelectItem value="rich_text_html" className="text-[12px]">
                      Rich Text (force full HTML)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* SEO Alert — shown when JS-rendered mode is active */}
                {showSeoAlert && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.04))',
                      border: '1px solid rgba(234,179,8,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-yellow-500/10">
                      <Search className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                      <p className="text-[12px] font-semibold text-yellow-400">SEO heads-up</p>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[12px] text-yellow-300/80 leading-relaxed">
                        This mode renders your content via JavaScript <em>after</em> the page loads.
                        Google and most crawlers <strong className="text-yellow-300">will not index</strong> your full page text.
                      </p>
                      <p className="text-[11px] text-yellow-500/60 leading-relaxed">
                        If organic search traffic matters for this page, switch to <strong className="text-yellow-500/80">Split HTML/CSS/JS</strong> or <strong className="text-yellow-500/80">Rich Text</strong> mode — those write content directly into the CMS so crawlers can read it.
                      </p>
                      {publishHtmlMode === 'remote_runtime' && (
                        <p className="text-[11px] text-yellow-500/50 mt-1">
                          Remote Runtime is ideal for internal tools, dashboards, or pages where SEO isn't a priority.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Runtime success note */}
                {preview?.usesRemoteRuntime && !showSeoAlert && (
                  <div
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[11px] text-emerald-400/80 leading-relaxed"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}
                  >
                    <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                    <span>
                      Runtime is active — Webflow only stores your page ID and metadata. Content streams in via runtime.js with no manual embed needed.
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* When to Publish */}
          <section className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Timing</p>
            <RadioGroup
              value={publishMode}
              onValueChange={(v) => setPublishMode(v as 'now' | 'later')}
              className="grid grid-cols-2 gap-3"
            >
              {(['now', 'later'] as const).map((mode) => (
                <label
                  key={mode}
                  htmlFor={`publish-${mode}`}
                  className="relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: publishMode === mode ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                    border: publishMode === mode
                      ? '1px solid rgba(59,130,246,0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <RadioGroupItem value={mode} id={`publish-${mode}`} className="sr-only" />
                  <div
                    className="h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: publishMode === mode ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {publishMode === mode && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-300">
                      {mode === 'now' ? 'Publish now' : 'Schedule for later'}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {mode === 'now' ? 'Goes live immediately' : 'Pick a date & time'}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>

            {publishMode === 'later' && (
              <div
                className="space-y-3 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Label htmlFor="schedule-at" className="text-[11px] font-medium text-zinc-500">
                  When should this go live?
                </Label>
                <input
                  id="schedule-at"
                  type="datetime-local"
                  min={minScheduleInput}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-[13px] text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500/40 transition"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    colorScheme: 'dark',
                  }}
                />
                <p className="text-[11px] text-zinc-700 leading-relaxed">
                  Your publish job is queued and will run automatically at this time — no need to keep this window open.
                </p>
              </div>
            )}

            {publishMode === 'later' && (
              <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
            )}
          </section>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* Visibility Toggles */}
          <section className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-4">Visibility</p>
            {[
              {
                id: 'show-on-website',
                checked: showOnWebsite,
                onChange: setShowOnWebsite,
                label: 'Visible on your website',
                description: 'Publishes the CMS item as live, not draft.',
              },
              {
                id: 'publish-webflow-site',
                checked: publishSite,
                onChange: setPublishSite,
                label: 'Trigger a Webflow site publish',
                description: 'Pushes all pending site changes live after updating the CMS.',
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                style={{ border: '1px solid transparent' }}
              >
                <div>
                  <p className="text-[13px] font-medium text-zinc-300">{item.label}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{item.description}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={item.onChange}
                  className="shrink-0"
                />
              </div>
            ))}
          </section>

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div
                className={`flex items-start gap-3 p-4 rounded-2xl text-[13px] leading-relaxed ${
                  result.type === 'success'
                    ? 'text-emerald-300'
                    : result.type === 'warning'
                      ? 'text-amber-300'
                      : 'text-red-300'
                }`}
                style={{
                  background:
                    result.type === 'success'
                      ? 'rgba(16,185,129,0.08)'
                      : result.type === 'warning'
                        ? 'rgba(245,158,11,0.08)'
                        : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${
                    result.type === 'success'
                      ? 'rgba(16,185,129,0.2)'
                      : result.type === 'warning'
                        ? 'rgba(245,158,11,0.2)'
                        : 'rgba(239,68,68,0.2)'
                  }`,
                }}
              >
                {result.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2.5 min-w-0 flex-1">
                  <p>{result.message}</p>
                  {result.embedNeedsReconnect && (
                    <p className="text-[12px] opacity-80 leading-relaxed">
                      To enable automatic runtime setup, reconnect Webflow via OAuth with <code className="text-amber-200 bg-amber-500/10 px-1 rounded">custom_code</code> scopes. In the meantime, use the manual embed below.
                    </p>
                  )}
                  {result.runtimeAutoConfigured && result.usedRemoteRuntime && (
                    <p className="text-[12px] opacity-80 leading-relaxed">
                      Runtime bootstrap applied to your collection template. Future updates deploy instantly — no republishing needed.
                    </p>
                  )}
                  {result.liveUrl && (
                    <a
                      href={result.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2"
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
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    Manual fallback — collection template embed
                  </p>
                  <pre className="text-[11px] font-mono text-zinc-400 bg-black/40 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    {result.collectionTemplateSnippet}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-9 border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 text-[12px] gap-2 rounded-xl"
                    onClick={() => copySnippet(result.collectionTemplateSnippet!)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied to clipboard!' : 'Copy embed snippet'}
                  </Button>
                </div>
              )}

              {result.embedNeedsReconnect && (
                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full h-10 gap-2 rounded-xl font-medium text-[13px]"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      boxShadow: '0 0 20px rgba(37,99,235,0.3)',
                    }}
                  >
                    <Link href={settingsUrl}>
                      <Plug className="h-4 w-4" />
                      Reconnect Webflow in Settings
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                  </Button>

                  {result.collectionEmbedSnippet && (
                    <div
                      className="rounded-2xl p-4 space-y-3"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <pre className="text-[11px] font-mono text-zinc-400 bg-black/40 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all">
                        {result.collectionEmbedSnippet}
                      </pre>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-9 border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 text-[12px] gap-2 rounded-xl"
                        onClick={() => copySnippet(result.collectionEmbedSnippet!)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? 'Copied!' : 'Copy embed code'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-7 py-5 flex gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl text-[13px] font-medium border-0 text-zinc-500 hover:text-zinc-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => onOpenChange(false)}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold gap-2 transition-all"
            style={{
              background: publishing
                ? 'rgba(37,99,235,0.5)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: publishing ? 'none' : '0 0 30px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: 'none',
            }}
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
            {publishing
              ? 'Publishing…'
              : publishMode === 'later'
                ? 'Schedule publish'
                : 'Publish now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}