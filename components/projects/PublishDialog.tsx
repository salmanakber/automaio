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
  ShieldCheck,
  ZapOff,
  Search,
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

/* ─────────────────────────────────── UI Components ─── */

function Divider() {
  return <div className="h-px w-full bg-white/[0.06] my-2" />
}

function StatusBadge({ status }: { status: 'ready' | 'warning' | 'loading' }) {
  const styles = {
    ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    loading: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tight ${styles[status]}`}>
      {status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className={`h-1.5 w-1.5 rounded-full ${status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'}`} />}
      {status === 'ready' ? 'System Ready' : status === 'loading' ? 'Checking' : 'Action Required'}
    </div>
  )
}

function Section({ label, children, action, icon: Icon }: { label: string; children: React.ReactNode; action?: React.ReactNode; icon?: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3 w-3 text-zinc-500" />}
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{label}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────── main ─── */

export function PublishDialog({ open, onOpenChange, project, projectId, orgId, onPublished }: PublishDialogProps) {
  const [publishing, setPublishing] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<any | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(Boolean(project?.showOnWebsite))
  const [publishSite, setPublishSite] = useState(project?.publishSite !== false)
  const [publishMode, setPublishMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [publishHtmlMode, setPublishHtmlMode] = useState<PublishHtmlModeOverride>('auto')
  const [result, setResult] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)
  const [notifySettings, setNotifySettings] = useState<ScheduleNotifySettings>({
    notifySubscribers: false,
    audienceTypes: ['lead', 'newsletter'],
    emailCampaignId: '',
  })

  const isLandingPage = project?.contentType === 'landing_page'
  const canPublish = preview?.canPublish !== false && !previewError

  const loadPreview = async () => {
    if (!project?.cmsCollectionId) {
      setPreviewError('Connect a Webflow CMS collection first.')
      return
    }
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/publish-preview`)
      const data = await parseJsonResponse<any>(res)
      if (!res.ok) throw new Error(data.error ?? 'Connection failed')
      setPreview(data)
    } catch (err: any) {
      setPreviewError(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (open && project?.cmsCollectionId) loadPreview()
  }, [open, projectId])

  const handleSubmit = async () => {
    setPublishing(true)
    setResult(null)
    try {
      const endpoint = `/api/projects/${projectId}?action=${publishMode === 'later' ? 'schedule' : 'publish'}`
      const payload = publishMode === 'later' 
        ? { scheduledFor: new Date(scheduledAt).toISOString(), publishSite, ...notifySettings }
        : { publishSite }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Deployment failed')
      setResult({ type: 'success', ...data })
      if (onPublished) onPublished(data)
    } catch (err: any) {
      setResult({ type: 'error', message: err.message })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 text-white p-0 sm:max-w-[600px] max-h-[95vh] overflow-hidden flex flex-col bg-[#0c0c0e] shadow-2xl">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                <Globe className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Deploy to Webflow</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 font-medium">
                  Push content to <span className="text-zinc-300">{project?.webflowCmsItemId ? 'Linked CMS Item' : 'New Webflow Entry'}</span>
                </DialogDescription>
              </div>
            </div>
            <StatusBadge status={previewLoading ? 'loading' : canPublish ? 'ready' : 'warning'} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            {[
              { label: 'CMS Status', value: project?.webflowCmsItemId ? 'Connected' : 'Pending', icon: ShieldCheck },
              { label: 'Field Sync', value: preview?.resolvedFields?.length ? `${preview.resolvedFields.length} Mapped` : '0 Fields', icon: RefreshCw },
              { label: 'Character Count', value: preview?.htmlLineCount ? `${preview.htmlLineCount} Lines` : '—', icon: Zap },
            ].map((item, i) => (
              <div key={i} className="bg-[#121214] p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                   <item.icon className="h-3 w-3 text-zinc-600" />
                   <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-600">{item.label}</p>
                </div>
                <p className="text-xs font-mono text-zinc-300">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Rendering Strategy Section */}
          {isLandingPage && (
            <Section label="Rendering Strategy" icon={Radio}>
              <Select value={publishHtmlMode} onValueChange={(v: any) => setPublishHtmlMode(v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] h-10 text-sm focus:ring-blue-500/40">
                  <SelectValue placeholder="Choose rendering mode" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/[0.1] text-zinc-300">
                  <SelectItem value="auto">Smart Auto-Select (Recommended)</SelectItem>
                  <SelectItem value="remote_runtime">Remote Runtime (Lightning Fast)</SelectItem>
                  <SelectItem value="split_plain_text">Full HTML (Best for SEO)</SelectItem>
                  <SelectItem value="custom_code">Legacy Rich Text Mode</SelectItem>
                </SelectContent>
              </Select>

              {/* SEO NOTICE - HIGH VISIBILITY */}
              {(publishHtmlMode === 'remote_runtime' || preview?.usesRemoteRuntime) && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Search className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-wide">SEO Performance Note</p>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    <span className="text-zinc-200 font-medium">Remote Runtime</span> uses JavaScript to inject content instantly. While this makes updates 10x faster, search engines prefer direct HTML for crawling.
                  </p>
                  <div className="flex gap-4 pt-1">
                     <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                        <Zap className="h-3 w-3" /> Ultra-fast Updates
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                        <ZapOff className="h-3 w-3" /> Lower SEO Visibility
                     </div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Timing Section */}
          <Section label="Deployment Schedule" icon={Clock}>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              {(['now', 'later'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPublishMode(mode)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    publishMode === mode ? 'bg-white/[0.08] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mode === 'now' ? <Zap className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                  {mode === 'now' ? 'Instant Deploy' : 'Schedule for Later'}
                </button>
              ))}
            </div>

            {publishMode === 'later' && (
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2 block">Select Timezone Date/Time</Label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50"
                />
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              </div>
            )}
          </Section>

          {/* Options Section */}
          <Section label="Site Settings" icon={Eye}>
            <div className="space-y-1">
              {[
                { 
                  id: 'live', 
                  label: 'Set as Live Item', 
                  sub: 'If off, content is pushed as a Webflow draft.', 
                  checked: showOnWebsite, 
                  onchange: setShowOnWebsite 
                },
                { 
                  id: 'site', 
                  label: 'Auto-Publish Site', 
                  sub: 'Automatically trigger a full Webflow site publish.', 
                  checked: publishSite, 
                  onchange: setPublishSite 
                },
              ].map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.06]">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-zinc-200">{opt.label}</p>
                    <p className="text-[11px] text-zinc-500">{opt.sub}</p>
                  </div>
                  <Switch checked={opt.checked} onCheckedChange={opt.onchange} className="data-[state=checked]:bg-blue-600" />
                </div>
              ))}
            </div>
          </Section>

          {/* Results Feedback */}
          {result && (
             <div className={`p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${
                result.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
             }`}>
                <div className="flex gap-3">
                   {result.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
                   <div className="space-y-3 flex-1 overflow-hidden">
                      <p className={`text-sm font-medium ${result.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{result.message}</p>
                      {result.liveUrl && (
                        <Button asChild variant="outline" size="sm" className="bg-transparent border-white/[0.1] h-8 text-xs hover:bg-white/[0.05]">
                           <a href={result.liveUrl} target="_blank">View Live Page <ExternalLink className="ml-2 h-3 w-3" /></a>
                        </Button>
                      )}
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/40 border-t border-white/[0.06] flex gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-zinc-500 hover:text-white hover:bg-white/[0.05]"
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={publishing || !canPublish}
            className="flex-[1.5] bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all active:scale-[0.98]"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : publishMode === 'later' ? (
              <CalendarClock className="h-4 w-4 mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {publishing ? 'Processing...' : publishMode === 'later' ? 'Confirm Schedule' : 'Deploy to Webflow'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}