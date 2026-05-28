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
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { ScheduleNotifyPanel, type ScheduleNotifySettings } from '@/components/projects/ScheduleNotifyPanel'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import type { PublishHtmlModeOverride } from '@/lib/content/rendering-strategy'
import { cn } from '@/lib/utils'

// Types and Helper functions remain same as logic...
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

export function PublishDialog({
  open,
  onOpenChange,
  project,
  projectId,
  orgId,
  onPublished,
}: PublishDialogProps) {
  // ... Keep all existing state and logic (savePublishSettings, loadPreview, handleSubmit, etc.)
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
      setPreviewError('Configure a CMS collection mapping to enable deployment.')
      return
    }
    setPreviewLoading(true)
    setPreviewError('')
    try {
      await savePublishSettings()
      const res = await fetch(`/api/projects/${projectId}/publish-preview`)
      const data = await parseJsonResponse<PublishPreview & { error?: string }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Validation failed')
      setPreview(data)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Validation service unavailable')
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
    setPublishHtmlMode((params.publishHtmlMode as PublishHtmlModeOverride) || 'auto')
    if (project?.cmsCollectionId) loadPreview()
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
        if (Number.isNaN(scheduledFor.getTime())) throw new Error('Invalid timestamp')
        const res = await fetch(`/api/projects/${projectId}?action=schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledFor: scheduledFor.toISOString(),
            frequency: 'once',
            publishSite,
            ...notifySettings,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Scheduling failed')
        setResult({ type: 'success', message: `Deployment successfully queued for ${scheduledFor.toLocaleString()}.` })
        onPublished?.()
        return
      }
      const res = await fetch(`/api/projects/${projectId}?action=publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishSite }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      setResult({
        type: data.embedNeedsReconnect ? 'warning' : 'success',
        message: data.embedMessage ?? 'Project successfully synchronized with Webflow.',
        ...data
      })
      onPublished?.({ liveUrl: data.liveUrl, previewUrl: data.previewUrl })
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Deployment failed' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#09090b] border-zinc-800 text-white sm:max-w-[620px] max-h-[92vh] overflow-y-auto selection:bg-blue-500/30">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0 h-5 text-[10px] uppercase tracking-wider font-bold">
              Production Release
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
            Deployment Center
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            Synchronize content with Webflow CMS and manage production availability.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Status Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 group hover:border-zinc-700/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Environment</p>
                <p className="text-sm font-semibold truncate">Webflow CMS</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 group hover:border-zinc-700/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", preview?.canPublish === false ? "bg-amber-500" : "bg-emerald-500")} />
                  <p className="text-sm font-semibold truncate">
                    {previewLoading ? 'Validating...' : preview?.canPublish === false ? 'Action Required' : 'Ready to Sync'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Configuration */}
          <div className="space-y-3 pt-2">
             <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Delivery Strategy</h4>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-zinc-500 hover:text-white gap-1" onClick={loadPreview} disabled={previewLoading}>
                  <RefreshCw className={cn("h-3 w-3", previewLoading && "animate-spin")} />
                  Refresh Manifest
                </Button>
             </div>

            {isLandingPage && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Rendering Mode</Label>
                  <Select value={publishHtmlMode} onValueChange={(v) => setPublishHtmlMode(v as PublishHtmlModeOverride)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs focus:ring-blue-500/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectItem value="auto">System Default (Intelligent Auto-switch)</SelectItem>
                      <SelectItem value="remote_runtime">🔥 Remote Runtime (Instant Updates)</SelectItem>
                      <SelectItem value="split_plain_text">SEO Optimized (Legacy Split)</SelectItem>
                      <SelectItem value="custom_code">Full Payload (Rich Text Body)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {preview?.usesRemoteRuntime && (
                  <div className="flex gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                      High-performance runtime detected. Content will synchronize via Automaio Edge — no manual code injection required.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Release Strategy */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Release Strategy</h4>
            <RadioGroup value={publishMode} onValueChange={(v) => setPublishMode(v as 'now' | 'later')} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", publishMode === 'now' ? "bg-blue-500/5 border-blue-500/40" : "bg-zinc-900/30 border-zinc-800/50")}>
                <RadioGroupItem value="now" id="now" className="border-zinc-700 text-blue-500" />
                <Label htmlFor="now" className="flex-1 cursor-pointer">
                  <p className="text-sm font-semibold">Immediate Release</p>
                  <p className="text-[10px] text-zinc-500">Sync to production now</p>
                </Label>
              </div>
              <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer", publishMode === 'later' ? "bg-blue-500/5 border-blue-500/40" : "bg-zinc-900/30 border-zinc-800/50")}>
                <RadioGroupItem value="later" id="later" className="border-zinc-700 text-blue-500" />
                <Label htmlFor="later" className="flex-1 cursor-pointer">
                  <p className="text-sm font-semibold">Scheduled Deployment</p>
                  <p className="text-[10px] text-zinc-500">Deploy at a specific time</p>
                </Label>
              </div>
            </RadioGroup>

            {publishMode === 'later' && (
              <div className="space-y-3 p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/20 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                   <Label htmlFor="schedule" className="text-[10px] uppercase font-bold text-zinc-500">Execution Time</Label>
                   <input
                    id="schedule" type="datetime-local" min={minScheduleInput} value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              </div>
            )}
          </div>

          {/* Visibility Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-t border-zinc-800/50">
            <div className="flex items-center justify-between p-2">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-200">Live Visibility</p>
                <p className="text-[10px] text-zinc-500 italic leading-snug">Toggle CMS "Published" status.</p>
              </div>
              <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} className="data-[state=checked]:bg-blue-500" />
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-200">Site-wide Sync</p>
                <p className="text-[10px] text-zinc-500 italic leading-snug">Republish global site files.</p>
              </div>
              <Switch checked={publishSite} onCheckedChange={setPublishSite} className="data-[state=checked]:bg-blue-500" />
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className={cn(
              "p-4 rounded-xl border animate-in zoom-in-95 duration-200",
              result.type === 'success' ? "bg-emerald-500/5 border-emerald-500/20" : result.type === 'warning' ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20"
            )}>
              <div className="flex items-start gap-3">
                {result.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />}
                <div className="space-y-3 w-full">
                  <p className={cn("text-xs font-medium", result.type === 'success' ? "text-emerald-400" : "text-amber-400")}>{result.message}</p>
                  
                  {result.embedNeedsReconnect && (
                    <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg space-y-3">
                       <p className="text-[11px] text-zinc-400 leading-relaxed">
                         OAuth scopes for <code className="text-amber-300">custom_code</code> are required for automated sync. 
                       </p>
                       <Button asChild variant="outline" className="w-full h-8 text-[11px] border-zinc-700 hover:bg-zinc-800 gap-2">
                          <Link href={`/dashboard/${orgId}/settings?tab=integrations`}><Plug className="h-3.5 w-3.5" /> Authorize Scopes</Link>
                       </Button>
                    </div>
                  )}

                  {result.liveUrl && (
                    <Button asChild size="sm" variant="secondary" className="h-8 text-[11px] font-bold w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                      <a href={result.liveUrl} target="_blank" rel="noreferrer">
                        Open Production Page <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
          <Button variant="ghost" className="flex-1 text-zinc-500 hover:text-white" onClick={() => onOpenChange(false)} disabled={publishing}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 font-bold transition-all active:scale-[0.98] gap-2"
            onClick={handleSubmit}
            disabled={publishing || (preview !== null && preview.canPublish === false)}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : publishMode === 'later' ? (
              <CalendarClock className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4 fill-current" />
            )}
            {publishMode === 'later' ? 'Schedule Release' : 'Initiate Release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}