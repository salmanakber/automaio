'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet,
  Save,
  Loader2,
  Sparkles,
  Upload,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Wand2,
  RefreshCw,
  Trash2,
  LayoutGrid,
  Settings2,
  Eye,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import {
  ProjectVisualEditor,
  type ProjectVisualEditorHandle,
} from '@/components/projects/ProjectVisualEditor'
import { SidebarFields } from '@/components/projects/SidebarFields'
import { ElementEditorPanel, type SelectedElement } from '@/components/projects/ElementEditorPanel'
import { PublishDialog } from '@/components/projects/PublishDialog'
import { AiProgressOverlay } from '@/components/projects/AiProgressOverlay'
import { RepersonalizePanel } from '@/components/projects/RepersonalizePanel'
import { BlogStudioPanel } from '@/components/projects/BlogStudioPanel'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { EditorToolbar } from '@/components/projects/EditorToolbar'
import { EditorThemePanel } from '@/components/projects/EditorThemePanel'
import { EditorSectionPanel, type SectionSelection } from '@/components/projects/EditorSectionPanel'
import { EditorStylePanel } from '@/components/projects/EditorStylePanel'
import type { StyleTarget } from '@/lib/editor/responsive-styles'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { parseStoredBusinessContext } from '@/lib/onboarding/persistence'
import {
  DEFAULT_TEMPLATE_THEME,
  buildThemeCss,
  resolveTemplateTheme,
  type TemplateTheme,
} from '@/lib/templates/theme'
import type { TemplateStructure } from '@/lib/templates/starter-templates'
import { buildBlankStarterPage, buildMinimalStarterPage } from '@/lib/editor/elementor-blocks'

export default function ProjectStudioPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const orgId = params.orgId as string
  const justOnboarded = searchParams.get('onboarded') === '1'
  const editorRef = useRef<ProjectVisualEditorHandle>(null)

  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [focusZoom, setFocusZoom] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiProgress, setAiProgress] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [seoGenerating, setSeoGenerating] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [repersonalizeOpen, setRepersonalizeOpen] = useState(false)
  const [repersonalizing, setRepersonalizing] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [publishedLiveUrl, setPublishedLiveUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editorCanUndo, setEditorCanUndo] = useState(false)
  const [editorCanRedo, setEditorCanRedo] = useState(false)
  const [sectionSelection, setSectionSelection] = useState<SectionSelection | null>(null)
  const [styleTarget, setStyleTarget] = useState<StyleTarget | null>(null)
  const [bootstrappingBlank, setBootstrappingBlank] = useState(false)
  const [editorTheme, setEditorTheme] = useState<TemplateTheme>(DEFAULT_TEMPLATE_THEME)
  const seoAutoTried = useRef(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`, {
      
      credentials: 'same-origin',
    })
    const data = await parseJsonResponse<{ project?: Record<string, unknown>; error?: string }>(res)
    if (!res.ok) throw new Error(data.error ?? 'Failed to load project')
    setProject(data.project ?? null)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load().catch((err) => {
      console.error(err)
      setLoading(false)
    })
  }, [load])

  useEffect(() => {
    if (!project) return
    const params = (project.parameters as Record<string, unknown>) ?? {}
    if (typeof params.liveUrl === 'string') setPublishedLiveUrl(params.liveUrl)
    try {
      const stored = params.editorTheme
      if (typeof stored === 'string') setEditorTheme(JSON.parse(stored) as TemplateTheme)
      else if (stored && typeof stored === 'object') setEditorTheme(stored as TemplateTheme)
      else {
        const structure = (project as { template?: { templateStructure?: unknown } }).template
          ?.templateStructure as TemplateStructure | undefined
        setEditorTheme(resolveTemplateTheme(structure))
      }
    } catch {
      setEditorTheme(DEFAULT_TEMPLATE_THEME)
    }
  }, [project])

  const saveParameters = async (nextProject: Record<string, unknown>) => {
    setProject(nextProject)
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters: nextProject.parameters }),
    })
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    setSaveError('')
    try {
      if (project?.parameters) {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parameters: project.parameters }),
          credentials: 'same-origin',
        })
        const data = await parseJsonResponse<{ error?: string }>(res)
        if (!res.ok) throw new Error(data.error ?? 'Failed to save fields')
      }
      await editorRef.current?.save()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportHtml = async (html: string) => {
    const res = await fetch(`/api/projects/${projectId}/html`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renderedHtml: html }),
      credentials: 'same-origin',
    })
    const data = await parseJsonResponse<{ error?: string }>(res)
    if (!res.ok) throw new Error(data.error ?? 'Import failed')
    setProject((p) => (p ? { ...p, renderedHtml: html } : p))
  }

  const handleGenerateSeo = async () => {
    setSeoGenerating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/seo`, {
        method: 'POST',
        
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'SEO generation failed')
      setProject((p) => (p ? { ...p, parameters: data.seo } : p))
    } catch (err) {
      console.error(err)
    } finally {
      setSeoGenerating(false)
    }
  }

  const runBulkAi = async () => {
    if (!aiPrompt.trim()) return
    setAiOpen(false)
    setAiProgress(true)
    setAiStep(0)
    const stepTimer = setInterval(() => setAiStep((s) => Math.min(s + 1, 3)), 4000)
    try {
      await editorRef.current?.runBulkAi(aiPrompt)
      setAiPrompt('')
    } finally {
      clearInterval(stepTimer)
      setAiProgress(false)
      setAiStep(0)
    }
  }

  const handleFocusRect = useCallback(() => {
    setFocusZoom(true)
    setZoom((z) => Math.max(z, 1.15))
  }, [])

  const handleSelectElement = useCallback((el: SelectedElement | null) => {
    setSelectedElement(el)
    if (el) {
      setFocusZoom(true)
      setZoom((z) => Math.max(z, 1.15))
    }
  }, [])

  const handleSectionSelect = useCallback((section: SectionSelection | null) => {
    setSectionSelection(section)
  }, [])

  const bootstrapBlankPage = async (mode: 'full' | 'minimal') => {
    setBootstrappingBlank(true)
    try {
      const starter = mode === 'full' ? buildBlankStarterPage() : buildMinimalStarterPage()
      await handleImportHtml(starter)
      setEditorKey((k) => k + 1)
    } finally {
      setBootstrappingBlank(false)
    }
  }

  useEffect(() => {
    if (!project || loading || seoAutoTried.current) return
    const params = (project.parameters as Record<string, string>) ?? {}
    if (params.seoTitle) return
    const summary = params.body || (project.description as string) || ''
    if (summary.length > 20) {
      seoAutoTried.current = true
      handleGenerateSeo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, loading])

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090b]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-zinc-500 font-medium tracking-widest uppercase text-[10px]">Initializing Studio</p>
      </div>
    )
  }

  const renderedHtml = (project?.renderedHtml as string) || ''
  const isLandingPage = project?.contentType === 'landing_page'
  const isBlogPost = project?.contentType === 'blog_post'
  const hasBusinessContext = Boolean(
    parseStoredBusinessContext((project?.parameters as Record<string, unknown>) ?? {}),
  )

  const handleRepersonalized = async (updated: Record<string, unknown>) => {
    setProject(updated)
    setEditorKey((k) => k + 1)
    await load()
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project? The Webflow CMS item will also be removed if linked.')) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await parseJsonResponse<{ error?: string }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      router.push(`/dashboard/${orgId}/projects`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="h-screen w-full flex flex-col bg-[#09090b] text-zinc-200 overflow-hidden font-sans">
        
        {/* --- REFINED HEADER --- */}
        <header className="h-14 border-b border-zinc-800/60 flex items-center justify-between px-4 bg-[#09090b]/80 backdrop-blur-md z-[60] shrink-0">
          <div className="flex items-center gap-3 w-1/3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              onClick={() => router.push(`/dashboard/${orgId}/projects`)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-semibold truncate text-zinc-100">
                {project?.name as string || 'Untitled Project'}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] uppercase tracking-tighter bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {String(project?.contentType ?? '').replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* CENTRAL VIEWPORT CONTROLS - Now more integrated */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-lg shadow-inner">
            <ViewportButton icon={Monitor} active={viewport === 'desktop'} onClick={() => setViewport('desktop')} label="Desktop" />
            <ViewportButton icon={Tablet} active={viewport === 'tablet'} onClick={() => setViewport('tablet')} label="Tablet" />
            <ViewportButton icon={Smartphone} active={viewport === 'mobile'} onClick={() => setViewport('mobile')} label="Mobile" />
            <Separator orientation="vertical" className="h-4 mx-1 bg-zinc-800" />
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] font-mono w-9 text-center text-zinc-400 selection:bg-none">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-1/3">
            <AnimatePresence> {/* ─── FRAMER MOTION ─── */}
              {saved && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-500 flex items-center gap-1.5 mr-2 font-medium"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </motion.span>
              )}
            </AnimatePresence>

            <Button
              variant="outline"
              size="sm"
              className="h-9 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setShowPublish(true)}
            >
              <Upload className="h-3.5 w-3.5 mr-2" /> Publish
            </Button>
            
            <Button
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-500 text-white px-4 font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* --- SIDEBAR --- */}
          <aside className="w-[320px] border-r border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0 z-20">
            <div className="h-12 flex items-center px-4 border-b border-zinc-800/50 bg-[#09090b]">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Project Configuration</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <SidebarFields
                project={project!}
                onUpdate={saveParameters}
                onImportHtml={handleImportHtml}
                onGenerateSeo={handleGenerateSeo}
                seoGenerating={seoGenerating}
              />
              
              {isLandingPage && (
                <div className="p-4 border-t border-zinc-800/50 space-y-6">
                  <EditorThemePanel theme={editorTheme} onChange={setEditorTheme} onApply={() => {/* logic */}} />
                  <ProjectUrlsCard projectId={projectId} liveUrl={publishedLiveUrl} />
                </div>
              )}
            </div>
          </aside>

          {/* --- THE STAGE (MAIN EDITOR AREA) --- */}
          <main className="flex-1 bg-[#18181b] relative overflow-hidden flex flex-col">
            
            {/* Contextual Toolbar for AI & Customization */}
            {!isBlogPost && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 bg-zinc-900/80 backdrop-blur border border-zinc-700/50 rounded-full shadow-2xl">
                <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs gap-2 text-zinc-300 hover:text-white" onClick={() => setAiOpen(true)}>
                  <Wand2 className="h-3.5 w-3.5 text-blue-400" /> AI Update
                </Button>
                <Separator orientation="vertical" className="h-4 bg-zinc-700" />
                {isLandingPage && (
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs gap-2 text-zinc-300 hover:text-white" onClick={() => setRepersonalizeOpen(true)}>
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> Personalize
                  </Button>
                )}
              </div>
            )}

            {/* THE CANVAS CONTAINER */}
            <div className={`flex-1 relative transition-all duration-500 ease-in-out p-8 flex items-start justify-center overflow-auto custom-scrollbar bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]`}>
              
              {isBlogPost ? (
                <div className="w-full max-w-4xl h-full">
                   <BlogStudioPanel project={project!} projectId={projectId} onUpdate={saveParameters} />
                </div>
              ) : (
                <motion.div
                  layout
                  initial={false}
                  animate={{
                    width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
                  }}
                  className="relative min-h-[100%] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden border border-zinc-800 transition-shadow duration-700"
                >
                  {/* Internal Editor Logic */}
                  {!renderedHtml.trim() && isLandingPage ? (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-900 p-12 text-center">
                       <LayoutGrid className="h-12 w-12 text-blue-500 mb-6 opacity-50" />
                       <h3 className="text-xl font-medium text-white mb-3">Your canvas is empty</h3>
                       <p className="text-zinc-400 mb-8 max-w-xs text-sm">Start with a professionally designed starter layout.</p>
                       <div className="flex flex-col gap-3 w-full max-w-xs">
                         <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => bootstrapBlankPage('full')}>
                           Full Starter Pack
                         </Button>
                         <Button variant="outline" className="border-zinc-700" onClick={() => bootstrapBlankPage('minimal')}>
                           Minimal Section
                         </Button>
                       </div>
                    </div>
                  ) : (
                    <ProjectVisualEditor
                      key={editorKey}
                      ref={editorRef}
                      html={renderedHtml}
                      projectId={projectId}
                      variant="studio"
                      zoom={zoom}
                      editViewport={viewport}
                      onSelectElement={handleSelectElement}
                      onFocusRect={handleFocusRect}
                      onSectionSelect={handleSectionSelect}
                      onStyleTargetChange={setStyleTarget}
                      onHistoryChange={({ canUndo, canRedo }) => {
                        setEditorCanUndo(canUndo)
                        setEditorCanRedo(canRedo)
                      }}
                      onSave={(html) => setProject((p) => (p ? { ...p, renderedHtml: html } : p))}
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Floating Editor Controls */}
            {!isBlogPost && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                 <EditorToolbar
                    canUndo={editorCanUndo}
                    canRedo={editorCanRedo}
                    onUndo={() => editorRef.current?.undo()}
                    onRedo={() => editorRef.current?.redo()}
                    onDuplicate={() => editorRef.current?.duplicate()}
                    onInsertWidget={(type) => editorRef.current?.insertWidget(type)}
                  />
              </div>
            )}
            
            {/* Side Floating Panels */}
            <ElementEditorPanel
              element={selectedElement}
              projectId={projectId}
              onClose={() => setSelectedElement(null)}
              onUpdate={(msg) => editorRef.current?.postMessage(msg)}
              onDelete={(id) => {
                editorRef.current?.postMessage({ type: 'am-delete-external', id })
                setSelectedElement(null)
              }}
            />

            <EditorStylePanel
              target={styleTarget}
              editViewport={viewport}
              onClose={() => setStyleTarget(null)}
              onApplyStyles={(id, styles) => editorRef.current?.setElementStyles(id, styles)}
            />

            <EditorSectionPanel
              section={sectionSelection}
              // ... props
            />
          </main>
        </div>

        {/* ... (Dialogs and Overlays stay the same) */}
      </div>
    </TooltipProvider>
  )
}

function ViewportButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        className={`h-8 w-10 flex items-center justify-center rounded-md transition-all ${
          active 
            ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700' 
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Icon className="h-4 w-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-[10px] font-bold">
      {label}
    </TooltipContent>
  </Tooltip>
  )
}
