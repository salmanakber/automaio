'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet,
  Save,
  Loader2,
  Upload,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Trash2,
  LayoutGrid,
  Eye,
  Pencil,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import {
  ProjectVisualEditor,
  type ProjectVisualEditorHandle,
} from '@/components/projects/ProjectVisualEditor'
import { SidebarFields } from '@/components/projects/SidebarFields'
import { StudioLeftSidebar } from '@/components/projects/StudioLeftSidebar'
import { StudioRightSidebar } from '@/components/projects/StudioRightSidebar'
import { EditorNavigator, EditorNavigatorToggle, type NavigatorItem } from '@/components/projects/EditorNavigator'
import type { SelectedElement } from '@/components/projects/ElementEditorPanel'
import { PublishDialog } from '@/components/projects/PublishDialog'
import { AiProgressOverlay } from '@/components/projects/AiProgressOverlay'
import { RepersonalizePanel } from '@/components/projects/RepersonalizePanel'
import { BlogStudioPanel } from '@/components/projects/BlogStudioPanel'
import type { StyleTarget } from '@/lib/editor/responsive-styles'
import type { SectionSelection } from '@/components/projects/EditorSectionPanel'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { parseStoredBusinessContext } from '@/lib/onboarding/persistence'
import {
  DEFAULT_TEMPLATE_THEME,
  buildThemeCss,
  resolveTemplateTheme,
  type TemplateTheme,
} from '@/lib/templates/theme'
import type { TemplateStructure } from '@/lib/templates/starter-templates'
import { buildBlankStarterPage, buildMinimalStarterPage, buildEmptyStarterPage } from '@/lib/editor/elementor-blocks'
import { buildProjectIframeUrl } from '@/lib/webflow/embed-page'

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
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [editorSaveState, setEditorSaveState] = useState({
    hasChanges: false,
    autoSaving: false,
    saved: false,
  })
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
  const [previewMode, setPreviewMode] = useState(false)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [navigatorItems, setNavigatorItems] = useState<NavigatorItem[]>([])
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
      await editorRef.current?.flushSave()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const openPublishDialog = async () => {
    setSaveError('')
    try {
      await editorRef.current?.flushSave()
      setShowPublish(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save before publish failed')
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

  const handleFocusRect = useCallback(() => {
    /* scroll only — no auto zoom */
  }, [])

  const handleSelectElement = useCallback((el: SelectedElement | null) => {
    setSelectedElement(el)
  }, [])

  const handleSectionSelect = useCallback((section: SectionSelection | null) => {
    setSectionSelection(section)
  }, [])

  const bootstrapBlankPage = async (mode: 'full' | 'minimal' | 'empty') => {
    setBootstrappingBlank(true)
    try {
      const starter =
        mode === 'full'
          ? buildBlankStarterPage()
          : mode === 'minimal'
            ? buildMinimalStarterPage()
            : buildEmptyStarterPage()
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
  const previewUrl =
    typeof window !== 'undefined'
      ? buildProjectIframeUrl(window.location.origin, projectId)
      : `/webflow/embed/project/${projectId}`
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
      <div className="h-screen w-full flex flex-col bg-[#09090b] text-zinc-200 overflow-hidden">
        <header className="h-14 border-b border-zinc-800 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:px-4 bg-[#09090b] z-50 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-zinc-400 hover:text-white"
              onClick={() => router.push(`/dashboard/${orgId}/projects`)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6 bg-zinc-800 shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{project?.name as string}</h1>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter truncate">
                {String(project?.contentType ?? '').replace('_', ' ')}
              </p>
            </div>
          </div>

          {!isBlogPost && (
            <div className="flex items-center justify-center shrink-0">
              <div className="flex items-center bg-zinc-900 rounded-full border border-zinc-800 p-0.5 shadow-lg">
                <ViewportButton icon={Monitor} active={viewport === 'desktop'} onClick={() => setViewport('desktop')} label="Desktop" />
                <ViewportButton icon={Tablet} active={viewport === 'tablet'} onClick={() => setViewport('tablet')} label="Tablet" />
                <ViewportButton icon={Smartphone} active={viewport === 'mobile'} onClick={() => setViewport('mobile')} label="Mobile" />
                <Separator orientation="vertical" className="h-5 bg-zinc-700 mx-0.5" />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] font-mono w-9 text-center text-zinc-400 tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {isBlogPost && <div />}

          <div className="flex items-center justify-end gap-1 sm:gap-1.5 min-w-0 overflow-x-auto custom-scrollbar">
            {!isBlogPost && renderedHtml.trim() && (
              <div className="flex items-center shrink-0 rounded-full border border-zinc-800 bg-zinc-900/80 p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant={previewMode ? 'default' : 'ghost'}
                      className={`h-7 w-7 shrink-0 ${previewMode ? 'bg-violet-600 hover:bg-violet-500' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setPreviewMode((v) => !v)}
                    >
                      {previewMode ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {previewMode ? 'Back to edit mode' : 'View mode (read-only)'}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-zinc-400 hover:text-white"
                      onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Open preview in new tab
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {saveError && (
              <span className="text-xs text-red-400 max-w-[120px] truncate shrink-0 hidden lg:inline" title={saveError}>
                {saveError}
              </span>
            )}
            {saved && (
              <span className="text-xs text-emerald-500 items-center gap-1 shrink-0 hidden md:flex">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
            {!isBlogPost && editorSaveState.autoSaving && (
              <span className="text-xs text-zinc-500 items-center gap-1 shrink-0 hidden md:flex">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </span>
            )}
            {!isBlogPost && editorSaveState.hasChanges && !editorSaveState.autoSaving && (
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 shrink-0 hidden sm:flex">
                Unsaved
              </Badge>
            )}
            {!isBlogPost && (
              <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 shrink-0">
                <Switch
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                  className="scale-75"
                />
                <Label htmlFor="auto-save" className="text-[10px] text-zinc-400 cursor-pointer whitespace-nowrap">
                  Auto-save
                </Label>
              </div>
            )}
            {isLandingPage && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-zinc-700 bg-zinc-900 text-zinc-300 gap-1 shrink-0 hidden lg:flex"
                onClick={() => setRepersonalizeOpen(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{hasBusinessContext ? 'Re-personalize' : 'Personalize'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-zinc-700 bg-zinc-900 text-zinc-300 shrink-0 px-2 sm:px-3"
              onClick={() => void openPublishDialog()}
            >
              <Upload className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Publish</span>
            </Button>
            <Button
              size="sm"
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] shrink-0 px-2 sm:px-3"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 sm:mr-1.5" />}
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-zinc-500 hover:text-red-400"
              onClick={handleDeleteProject}
              disabled={deleting}
              title="Delete project"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {justOnboarded && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/90 backdrop-blur px-4 py-3 text-sm text-emerald-300 flex items-center justify-between gap-3 shadow-lg">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Landing page personalized! Refine in the studio, then publish.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-emerald-700 text-emerald-300 shrink-0"
                  onClick={() => setShowPublish(true)}
                >
                  Publish
                </Button>
              </div>
            </div>
          )}

          {!isBlogPost && isLandingPage && (
            <StudioLeftSidebar
              canUndo={editorCanUndo}
              canRedo={editorCanRedo}
              onUndo={() => editorRef.current?.undo()}
              onRedo={() => editorRef.current?.redo()}
              onDuplicate={() => editorRef.current?.duplicate()}
              onInsertWidget={(type) => editorRef.current?.insertWidget(type)}
            />
          )}

          {!isBlogPost && !isLandingPage && (
            <aside className="w-72 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
              <div className="py-3 px-4 border-b border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Content</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <SidebarFields
                  project={project!}
                  onUpdate={saveParameters}
                  onImportHtml={handleImportHtml}
                  onGenerateSeo={handleGenerateSeo}
                  seoGenerating={seoGenerating}
                />
              </div>
            </aside>
          )}

          <main className={`flex-1 bg-[#121214] relative overflow-auto flex items-start justify-center p-6 ${isBlogPost ? '' : ''}`}>
            {!isBlogPost && (
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono text-[10px]">
                {viewport === 'desktop' ? '1440px' : viewport === 'tablet' ? '768px' : '375px'}
              </Badge>
              {viewport !== 'desktop' && (
                <Badge variant="outline" className="bg-pink-950/50 border-pink-800 text-pink-400 font-mono text-[10px] capitalize">
                  Editing {viewport} styles
                </Badge>
              )}
            </div>
            )}

            {isBlogPost ? (
              <BlogStudioPanel
                project={project!}
                projectId={projectId}
                onUpdate={saveParameters}
              />
            ) : (
            <motion.div
              animate={{
                width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
                height: '100%',
              }}
              className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-zinc-800 relative h-full shrink-0"
            >
              <div className="h-full min-h-0 relative">
                {!renderedHtml.trim() && isLandingPage && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#121214]/95 backdrop-blur-sm p-8 text-center">
                    <LayoutGrid className="h-10 w-10 text-violet-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Start building your page</h3>
                    <p className="text-sm text-zinc-400 mb-6 max-w-sm">
                      Choose a starter layout with header &amp; footer blocks, then drag more blocks from the Global panel on the left.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button
                        className="bg-violet-600 hover:bg-violet-700 gap-2"
                        disabled={bootstrappingBlank}
                        onClick={() => bootstrapBlankPage('full')}
                      >
                        {bootstrappingBlank ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Full starter (Header + Hero + Footer)
                      </Button>
                      <Button
                        variant="outline"
                        className="border-zinc-600 gap-2"
                        disabled={bootstrappingBlank}
                        onClick={() => bootstrapBlankPage('minimal')}
                      >
                        Minimal (Header + Section + Footer)
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-zinc-400 gap-2"
                        disabled={bootstrappingBlank}
                        onClick={() => bootstrapBlankPage('empty')}
                      >
                        True blank canvas
                      </Button>
                    </div>
                  </div>
                )}
                <ProjectVisualEditor
                  key={editorKey}
                  ref={editorRef}
                  html={renderedHtml}
                  projectId={projectId}
                  variant="studio"
                  editViewport={viewport}
                  zoom={zoom}
                  previewMode={previewMode}
                  autoSaveEnabled={autoSaveEnabled && !previewMode}
                  onAutoSaveStateChange={setEditorSaveState}
                  onSelectElement={handleSelectElement}
                  onFocusRect={handleFocusRect}
                  onSectionSelect={handleSectionSelect}
                  onStyleTargetChange={setStyleTarget}
                  onOutlineChange={setNavigatorItems}
                  onHistoryChange={({ canUndo, canRedo }) => {
                    setEditorCanUndo(canUndo)
                    setEditorCanRedo(canRedo)
                  }}
                  onSave={(html) => setProject((p) => (p ? { ...p, renderedHtml: html } : p))}
                />
                {!previewMode && (
                  <>
                    <EditorNavigatorToggle
                      open={navigatorOpen}
                      count={navigatorItems.length}
                      onClick={() => setNavigatorOpen((v) => !v)}
                    />
                    <EditorNavigator
                      open={navigatorOpen}
                      onOpenChange={setNavigatorOpen}
                      items={navigatorItems}
                      activeId={sectionSelection?.id ?? selectedElement?.id ?? styleTarget?.id ?? null}
                      onRefresh={() => editorRef.current?.refreshOutline()}
                      onSelect={(id) => editorRef.current?.selectById(id)}
                      onMove={(id, targetId, position) =>
                        editorRef.current?.moveNavigatorItem(id, targetId, position)
                      }
                    />
                  </>
                )}
              </div>
            </motion.div>
            )}
          </main>

          {!isBlogPost && isLandingPage && (
            <StudioRightSidebar
              project={project!}
              projectId={projectId}
              orgId={orgId}
              isLandingPage={isLandingPage}
              editViewport={viewport}
              editorTheme={editorTheme}
              publishedLiveUrl={publishedLiveUrl}
              selectedElement={selectedElement}
              sectionSelection={sectionSelection}
              styleTarget={styleTarget}
              seoGenerating={seoGenerating}
              onUpdateProject={saveParameters}
              onImportHtml={handleImportHtml}
              onGenerateSeo={handleGenerateSeo}
              onThemeChange={setEditorTheme}
              onApplyTheme={() => {
                editorRef.current?.applyThemeCss(buildThemeCss(editorTheme))
                const params = (project?.parameters as Record<string, unknown>) ?? {}
                saveParameters({
                  ...project!,
                  parameters: {
                    ...params,
                    editorTheme: JSON.stringify(editorTheme),
                  },
                })
              }}
              onElementUpdate={(msg) => editorRef.current?.postMessage(msg)}
              onElementDelete={(id) => {
                editorRef.current?.postMessage({ type: 'am-delete-external', id })
                setSelectedElement(null)
              }}
              onApplyStyles={(id, styles) => editorRef.current?.setElementStyles(id, styles)}
              onSetLayout={(layout) => {
                if (sectionSelection?.id) {
                  editorRef.current?.setSectionLayout(sectionSelection.id, layout)
                }
              }}
              onSetPadding={(padding) => {
                if (sectionSelection?.id) {
                  editorRef.current?.setSectionPadding(sectionSelection.id, padding)
                }
              }}
              onSetColumnWidths={(widths) => {
                if (sectionSelection?.id) {
                  editorRef.current?.setColumnWidths(sectionSelection.id, widths)
                }
              }}
              onSetGap={(gap) => {
                if (sectionSelection?.id) {
                  editorRef.current?.setColumnGap(sectionSelection.id, gap)
                }
              }}
              onStackMobile={() => {
                if (sectionSelection?.id) {
                  editorRef.current?.stackColumnsOnMobile(sectionSelection.id)
                }
              }}
              onInsertInside={(type) => {
                if (sectionSelection?.id) {
                  editorRef.current?.insertWidget(type, {
                    targetId: sectionSelection.id,
                    position: 'inside',
                  })
                }
              }}
              onCollectionAdd={() => {
                if (sectionSelection?.id) editorRef.current?.addCollectionItem(sectionSelection.id)
              }}
              onCollectionRemove={() => {
                if (sectionSelection?.id) editorRef.current?.removeCollectionItem(sectionSelection.id)
              }}
              onCollectionSetColumns={(columns) => {
                if (sectionSelection?.id) editorRef.current?.setCollectionColumns(sectionSelection.id, columns)
              }}
              onCollectionImageUpdate={(imageId, src) => {
                if (sectionSelection?.id) {
                  editorRef.current?.setCollectionImage(sectionSelection.id, imageId, src)
                }
              }}
              onLeadFormUpdate={(config) => {
                if (sectionSelection?.id) editorRef.current?.updateLeadForm(sectionSelection.id, config)
              }}
            />
          )}
        </div>

        <PublishDialog
          open={showPublish}
          onOpenChange={setShowPublish}
          project={project}
          projectId={projectId}
          orgId={orgId}
          onBeforePublish={async () => (await editorRef.current?.flushSave()) ?? null}
          onPublished={(result) => {
            if (result?.liveUrl) setPublishedLiveUrl(result.liveUrl)
            load()
          }}
        />

        <AiProgressOverlay
          open={repersonalizing}
          step={aiStep}
          label="Re-personalizing your landing page"
        />

        {isLandingPage && (
          <RepersonalizePanel
            open={repersonalizeOpen}
            onOpenChange={setRepersonalizeOpen}
            orgId={orgId}
            projectId={projectId}
            projectParameters={(project?.parameters as Record<string, unknown>) ?? {}}
            onComplete={handleRepersonalized}
            onRunningChange={setRepersonalizing}
          />
        )}
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
          className={`p-2 rounded-full transition-all ${active ? 'bg-zinc-800 text-blue-500 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-xs uppercase font-bold tracking-tighter">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
