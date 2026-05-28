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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plug,
  RefreshCw,
  CalendarClock,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Layout,
} from 'lucide-react'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { ScheduleNotifyPanel, type ScheduleNotifySettings } from '@/components/projects/ScheduleNotifyPanel'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import type { PublishHtmlModeOverride } from '@/lib/content/rendering-strategy'
import { cn } from '@/lib/utils'

// --- Types ---

type PublishDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Record<string, any> | null
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

// --- Component ---

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

  // --- Logic ---

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
        ...data,
      })
      onPublished?.({ liveUrl: data.liveUrl, previewUrl: data.previewUrl })
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Deployment failed' })
    } finally {
      setPublishing(false)
    }
  }

  // --- Render ---

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#09090b] border-zinc-800 text-white sm:max-w-[640px] p-0 gap-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] border-t-violet-500/20">
        
        {/* Sticky Header */}
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800/50 bg-zinc-950/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                Deployment Center
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">
                Webflow CMS Sync & Release Strategy
              </DialogDescription>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1 border-2 font-bold transition-all",
                preview?.canPublish === false 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
            >
              {previewLoading ? 'Validating...' : preview?.canPublish === false ? 'Action Required' : 'Ready to Sync'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Main Form Body - Scrollable */}
        <div className="max-h-[62vh] overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Status Row */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Environment</p>
              <p className="text-sm font-semibold truncate">Webflow CMS Integration</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Instance</p>
              <p className="text-xs text-zinc-400 font-medium">
                {project?.webflowCmsItemId ? 'Linked Record' : 'Create New'}
              </p>
            </div>
          </div>

          {/* Section: Delivery Strategy */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-violet-400" /> Delivery Strategy
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] text-zinc-500 hover:text-white" 
                onClick={loadPreview} 
                disabled={previewLoading}
              >
                <RefreshCw className={cn("h-3 w-3 mr-1.5", previewLoading && "animate-spin")} />
                Sync Metadata
              </Button>
            </div>

            {isLandingPage && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <Select value={publishHtmlMode} onValueChange={(v) => setPublishHtmlMode(v as PublishHtmlModeOverride)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs focus:ring-violet-500/40">
                    <SelectValue placeholder="Select Delivery Mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="auto">System Intelligent Default</SelectItem>
                    <SelectItem value="remote_runtime">Edge Runtime (Direct JS Render)</SelectItem>
                    <SelectItem value="split_plain_text">Static Split (Optimized for SEO)</SelectItem>
                    <SelectItem value="custom_code">Full Payload (Rich Text Body)</SelectItem>
                  </SelectContent>
                </Select>

                {/* RESTORED & IMPROVED: SEO Note */}
                {(publishHtmlMode === 'remote_runtime' || preview?.htmlMode === 'remote_runtime') && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-[11px] font-black uppercase tracking-tight">Critical SEO Assessment</span>
                    </div>
                    <p className="text-[11px] text-amber-200/70 leading-relaxed">
                      Edge Runtime delivers high-performance interactivity via JavaScript. However, 
                      <span className="text-amber-400 font-bold underline decoration-amber-400/30"> this is not optimal for search bots</span> that do not execute JS. 
                      Switch to <span className="text-white font-semibold">Static Split</span> if organic search indexing is your primary goal.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Release Timing */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Release Management</h4>
            <RadioGroup 
              value={publishMode} 
              onValueChange={(v) => setPublishMode(v as 'now' | 'later')} 
              className="grid grid-cols-2 gap-3"
            >
              <Label 
                htmlFor="now" 
                className={cn(
                  "flex flex-col gap-1.5 p-3.5 rounded-xl border cursor-pointer transition-all",
                  publishMode === 'now' ? "bg-violet-500/10 border-violet-500/40" : "bg-zinc-900/30 border-zinc-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="now" id="now" className="border-zinc-700" />
                  <span className="text-sm font-bold">Immediate Sync</span>
                </div>
                <span className="text-[10px] text-zinc-500 ml-6 italic">Deploy changes instantly</span>
              </Label>
              <Label 
                htmlFor="later" 
                className={cn(
                  "flex flex-col gap-1.5 p-3.5 rounded-xl border cursor-pointer transition-all",
                  publishMode === 'later' ? "bg-violet-500/10 border-violet-500/40" : "bg-zinc-900/30 border-zinc-800/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="later" id="later" className="border-zinc-700" />
                  <span className="text-sm font-bold">Scheduled</span>
                </div>
                <span className="text-[10px] text-zinc-500 ml-6 italic">Queue for future release</span>
              </Label>
            </RadioGroup>

            {publishMode === 'later' && (
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Execution Window</Label>
                  <input
                    type="datetime-local"
                    min={minScheduleInput}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/50 outline-none transition-colors"
                  />
                </div>
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              </div>
            )}
          </div>

          {/* Visibility Switches */}
          <div className="grid grid-cols-2 gap-6 py-4 border-y border-zinc-800/50 bg-zinc-950/20 -mx-6 px-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] font-black text-zinc-200 uppercase tracking-tight">Public Release</p>
                <p className="text-[10px] text-zinc-500 italic">Toggle Live/Draft state</p>
              </div>
              <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} className="data-[state=checked]:bg-emerald-500 shadow-lg" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] font-black text-zinc-200 uppercase tracking-tight">Global Sync</p>
                <p className="text-[10px] text-zinc-500 italic">Republish full Webflow site</p>
              </div>
              <Switch checked={publishSite} onCheckedChange={setPublishSite} className="data-[state=checked]:bg-emerald-500 shadow-lg" />
            </div>
          </div>

          {/* Results Area */}
          {result && (
            <div className={cn(
              "p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-300",
              result.type === 'success' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
            )}>
              <div className="flex gap-3">
                {result.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-red-400" />}
                <div className="space-y-3 flex-1 min-w-0">
                  <p className={cn("text-sm font-bold", result.type === 'success' ? "text-emerald-400" : "text-red-400")}>{result.message}</p>
                  
                  {result.liveUrl && (
                    <Button asChild size="sm" variant="secondary" className="h-8 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-white w-full border border-zinc-700">
                      <a href={result.liveUrl} target="_blank" rel="noreferrer">
                        View Live Production <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <DialogFooter className="p-4 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 sticky bottom-0 w-full flex flex-row gap-3 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <Button
            variant="ghost"
            className="flex-1 text-zinc-500 hover:text-white font-bold h-11"
            onClick={() => onOpenChange(false)}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            className="flex-[2] bg-violet-600 hover:bg-violet-500 shadow-2xl shadow-violet-900/30 font-black tracking-tight transition-all active:scale-[0.97] gap-2 h-11 text-[13px]"
            onClick={handleSubmit}
            disabled={publishing || (preview !== null && preview.canPublish === false)}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : publishMode === 'later' ? (
              <CalendarClock className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4 fill-white/10" />
            )}
            {publishMode === 'later' ? 'Confirm Schedule' : 'Initiate Sync Release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}