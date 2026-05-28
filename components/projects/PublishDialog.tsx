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
  Zap,
  Eye,
  Clock,
  Search,
  Code2,
  Cpu,
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

/* ─────────────────────────────────── UI PRIMITIVES ─── */

function Divider() {
  return <div className="h-px w-full bg-white/[0.06] my-4" />
}

function Tag({ children, color = 'zinc' }: { children: React.ReactNode; color?: 'zinc' | 'emerald' | 'amber' | 'blue' }) {
  const map: Record<string, string> = {
    zinc: 'bg-zinc-800 text-zinc-400',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${map[color]}`}>
      {children}
    </span>
  )
}

function StatusDot({ status }: { status: 'ok' | 'warn' | 'spin' }) {
  if (status === 'spin') return <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
  return (
    <span className="relative flex h-2 w-2">
      {status === 'ok' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
    </span>
  )
}

function SectionLabel({ label, icon: Icon }: { label: string; icon?: any }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-3 w-3 text-zinc-500" />}
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">{label}</p>
    </div>
  )
}

/* ─────────────────────────────────── MAIN COMPONENT ─── */

export function PublishDialog({ open, onOpenChange, project, projectId, orgId, onPublished }: PublishDialogProps) {
  const [publishing, setPublishing] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [previewError, setPreviewError] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(Boolean(project?.showOnWebsite))
  const [publishSite, setPublishSite] = useState(project?.publishSite !== false)
  const [publishMode, setPublishMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [publishHtmlMode, setPublishHtmlMode] = useState<PublishHtmlModeOverride>('auto')
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [notifySettings, setNotifySettings] = useState<ScheduleNotifySettings>({
    notifySubscribers: false, audienceTypes: ['lead', 'newsletter'], emailCampaignId: '',
  })

  const isLandingPage = project?.contentType === 'landing_page'
  const canPublish = preview?.canPublish !== false

  const loadPreview = async () => {
    if (!project?.cmsCollectionId) return setPreviewError('Connect a CMS collection first.')
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/publish-preview`)
      const data = await parseJsonResponse<any>(res)
      if (!res.ok) throw new Error(data.error ?? 'Preview failed')
      setPreview(data)
    } catch (err: any) {
      setPreviewError(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setResult(null)
      if (project?.cmsCollectionId) loadPreview()
    }
  }, [open, projectId])

  const copySnippet = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    setPublishing(true)
    setResult(null)
    try {
      const action = publishMode === 'later' ? 'schedule' : 'publish'
      const res = await fetch(`/api/projects/${projectId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publishSite, 
          showOnWebsite,
          parameters: { publishHtmlMode },
          ...(publishMode === 'later' ? { scheduledFor: new Date(scheduledAt).toISOString(), ...notifySettings } : {})
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Deployment failed')
      setResult({ type: data.embedNeedsReconnect ? 'warning' : 'success', ...data })
      onPublished?.(data)
    } catch (err: any) {
      setResult({ type: 'error', message: err.message })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 text-white p-0 sm:max-w-[560px] max-h-[92vh] overflow-hidden flex flex-col bg-[#09090b] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_64px_rgba(0,0,0,0.8)]">
        
        {/* HEADER */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold tracking-tight">Deploy to Webflow</DialogTitle>
                <DialogDescription className="text-[11px] text-zinc-500 mt-1">
                  CMS · {project?.webflowCmsItemId ? 'Syncing Existing' : 'Creating New Item'} · {project?.cmsCollectionId ? 'Collection Linked' : 'No Collection'}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <StatusDot status={previewLoading ? 'spin' : canPublish ? 'ok' : 'warn'} />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                {previewLoading ? 'checking' : canPublish ? 'Ready' : 'Issues'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          {/* FIELD MAPPING PREVIEW */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel label="System Synchronization" icon={Cpu} />
              <button onClick={loadPreview} className="text-[10px] text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1">
                <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} /> Sync
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08] rounded-xl overflow-hidden">
              {[
                { label: 'Fields', value: preview?.resolvedFields?.length ? `${preview.resolvedFields.length} Mapped` : '—' },
                { label: 'Payload', value: preview?.htmlLineCount ? `${preview.htmlLineCount} Lines` : '—' },
                { label: 'Strategy', value: (preview?.htmlMode ?? 'Auto').replace('_', ' ') },
              ].map((item, i) => (
                <div key={i} className="bg-[#0c0c0e] p-3">
                  <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-wider mb-1">{item.label}</p>
                  <p className="text-[11px] font-mono text-zinc-300">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* STRATEGY & SEO NOTICE */}
          {isLandingPage && (
            <section className="animate-in fade-in slide-in-from-bottom-2">
              <SectionLabel label="Deployment Strategy" icon={Code2} />
              <Select value={publishHtmlMode} onValueChange={(v: any) => setPublishHtmlMode(v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] h-10 text-xs text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                  <SelectItem value="auto">Automatic Intelligence (Best Fit)</SelectItem>
                  <SelectItem value="remote_runtime">Remote Runtime (Fastest Updates)</SelectItem>
                  <SelectItem value="split_plain_text">Native CMS Fields (High SEO)</SelectItem>
                  <SelectItem value="custom_code">Legacy Rich Text (Standard)</SelectItem>
                </SelectContent>
              </Select>

              {/* SEO NOTICE - ONLY SHOWS ON REMOTE RUNTIME */}
              {publishHtmlMode === 'remote_runtime' && (
                <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-3">
                  <Search className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">SEO Consideration Required</p>
                    <p className="text-[12px] text-zinc-400 leading-relaxed">
                      Remote Runtime injects content via JavaScript. This provides <span className="text-zinc-200">near-instant updates</span>, but some search engine crawlers may struggle to index the full content. 
                      <span className="block mt-1">Use <span className="text-amber-200/80 italic">Native CMS Fields</span> if deep search indexing is your primary goal.</span>
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TIMING CONTROL */}
          <section>
            <SectionLabel label="Execution Timing" icon={Clock} />
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl mb-4">
              {(['now', 'later'] as const).map((m) => (
                <button key={m} onClick={() => setPublishMode(m)} className={`py-2 rounded-lg text-xs font-semibold transition-all ${publishMode === m ? 'bg-white/[0.08] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {m === 'now' ? 'Deploy Immediately' : 'Schedule Deployment'}
                </button>
              ))}
            </div>

            {publishMode === 'later' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500/50 transition-all" />
                <ScheduleNotifyPanel orgId={orgId} value={notifySettings} onChange={setNotifySettings} />
              </div>
            )}
          </section>

          {/* TOGGLES */}
          <section className="space-y-1">
            <SectionLabel label="Environment Options" />
            {[
              { label: 'Set as Live CMS Item', sub: 'Immediately visible on site', icon: Eye, state: showOnWebsite, setter: setShowOnWebsite },
              { label: 'Push Site Changes', sub: 'Triggers global Webflow publish', icon: Zap, state: publishSite, setter: setPublishSite },
            ].map((opt, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] border border-transparent transition-all">
                <div className="flex gap-3">
                  <opt.icon className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{opt.label}</p>
                    <p className="text-[10px] text-zinc-500">{opt.sub}</p>
                  </div>
                </div>
                <Switch checked={opt.state} onCheckedChange={opt.setter} className="scale-90" />
              </div>
            ))}
          </section>

          {/* RESULTS & ERROR HANDLING */}
          {result && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
              <Divider />
              <div className={`p-4 rounded-xl border ${result.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <div className="flex gap-3">
                  {result.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />}
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className={`text-[13px] font-medium ${result.type === 'success' ? 'text-emerald-300' : 'text-amber-300'}`}>{result.message}</p>
                    {result.liveUrl && (
                      <a href={result.liveUrl} target="_blank" className="text-blue-400 text-xs inline-flex items-center gap-1 hover:underline">
                        View Live Site <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* RECONNECT PROMPT */}
              {result.embedNeedsReconnect && (
                <div className="space-y-3">
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 gap-2 h-10 shadow-lg shadow-blue-600/20">
                    <Link href={`/dashboard/${orgId}/settings?tab=integrations`}><Plug className="h-4 w-4" />Reconnect Webflow Permissions</Link>
                  </Button>
                  {result.collectionEmbedSnippet && (
                    <div className="p-3 rounded-xl bg-black border border-white/[0.08] space-y-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Manual Collection Embed</p>
                      <pre className="text-[10px] font-mono text-zinc-400 bg-white/[0.03] p-3 rounded overflow-x-auto whitespace-pre-wrap">{result.collectionEmbedSnippet}</pre>
                      <button onClick={() => copySnippet(result.collectionEmbedSnippet)} className="w-full py-2 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors">
                        {copied ? 'Copied to Clipboard!' : 'Copy Snippet'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* URL CARD */}
              {!result.embedNeedsReconnect && result.previewUrl && (
                <ProjectUrlsCard projectId={projectId} liveUrl={result.liveUrl} embedSnippet={result.embedSnippet} compact />
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-5 bg-black/40 border-t border-white/[0.06] flex gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={publishing} className="flex-1 text-zinc-500 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={publishing || !canPublish} className="flex-[1.5] bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : publishMode === 'later' ? <Clock className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {publishing ? 'Deploying...' : publishMode === 'later' ? 'Schedule Sync' : 'Deploy to Webflow'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}