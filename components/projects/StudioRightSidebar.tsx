'use client'

import { useEffect, useState } from 'react'
import { 
  Settings2, 
  MousePointerClick, 
  FileText, 
  Palette, 
  ChevronRight,
  Globe,
  Sparkles
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SidebarFields } from '@/components/projects/SidebarFields'
import { EditorThemePanel } from '@/components/projects/EditorThemePanel'
import { ProjectUrlsCard } from '@/components/projects/ProjectUrlsCard'
import { EditorStylePanel } from '@/components/projects/EditorStylePanel'
import {
  EditorSectionPanel,
  type SectionPadding,
  type SectionSelection,
} from '@/components/projects/EditorSectionPanel'
import {
  ElementEditorPanel,
  type SelectedElement,
} from '@/components/projects/ElementEditorPanel'
import { EditorCollectionPanel } from '@/components/projects/EditorCollectionPanel'
import { EditorCarouselPanel } from '@/components/projects/EditorCarouselPanel'
import { EditorLeadFormPanel } from '@/components/projects/EditorLeadFormPanel'
import type { StyleTarget, EditViewport, ElementStyles } from '@/lib/editor/responsive-styles'
import type { TemplateTheme } from '@/lib/templates/theme'
import type { EditorWidgetType } from '@/lib/editor/editor-widgets'
import { cn } from '@/lib/utils'

export function StudioRightSidebar(props: any) {
  const {
    project, projectId, isLandingPage, editViewport, editorTheme,
    publishedLiveUrl, selectedElement, sectionSelection, styleTarget,
    seoGenerating, onUpdateProject, onImportHtml, onGenerateSeo,
    onThemeChange, onApplyTheme, onElementUpdate, onElementDelete,
    onApplyStyles, onSetLayout, onSetPadding, onSetColumnWidths,
    onSetGap,     onStackMobile, onInsertInside,
    orgId,
    onCollectionAdd, onCollectionRemove, onCollectionSetColumns, onCollectionImageUpdate,
    onLeadFormUpdate, onCarouselUpdate,
  } = props

  const hasElementFocus = Boolean(selectedElement || sectionSelection || styleTarget)
  const [tab, setTab] = useState<'page' | 'element'>('page')

  useEffect(() => {
    if (hasElementFocus) setTab('element')
  }, [hasElementFocus, selectedElement?.id, sectionSelection?.id, styleTarget?.id])

  return (
    <aside className="w-80 border-l border-zinc-800/60 bg-[#09090b] flex flex-col shrink-0 select-none shadow-2xl">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'page' | 'element')} className="flex flex-col h-full">
        
        {/* Header Section */}
        <div className="p-3 border-b border-zinc-800/50 bg-zinc-950/50 shrink-0">
          <TabsList className="grid w-full grid-cols-2 h-9 bg-zinc-900/50 border border-zinc-800/50 p-1 rounded-lg">
            <TabsTrigger
              value="page"
              className="
  text-[11px] font-semibold transition-all
  text-zinc-400 hover:text-zinc-200
  data-[state=active]:bg-zinc-800
  data-[state=active]:text-violet-400
  data-[state=active]:shadow-inner
"
            >
              <Settings2 className="h-3.5 w-3.5 mr-2" />
              Project
            </TabsTrigger>
            <TabsTrigger
              value="element"
              className="
  text-[11px] font-semibold transition-all
  text-zinc-400 hover:text-zinc-200
  data-[state=active]:bg-zinc-800
  data-[state=active]:text-violet-400
  data-[state=active]:shadow-inner
"
            >
              <MousePointerClick className="h-3.5 w-3.5 mr-2" />
              Inspector
              {hasElementFocus && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          
          {/* Project Tab */}
          <TabsContent value="page" className="absolute inset-0 m-0 overflow-y-auto custom-scrollbar bg-zinc-950/20">
            <div className="p-4 space-y-6">
              
              {isLandingPage && (
                <SectionGroup icon={Palette} title="Visual Identity" color="text-violet-400">
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3">
                    <EditorThemePanel theme={editorTheme} onChange={onThemeChange} onApply={onApplyTheme} />
                  </div>
                </SectionGroup>
              )}

              <SectionGroup icon={Globe} title="Deployment" color="text-emerald-400">
                 <ProjectUrlsCard projectId={projectId} liveUrl={publishedLiveUrl} />
              </SectionGroup>

              <SectionGroup icon={FileText} title="Search & Social" color="text-zinc-500">
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3">
                  <SidebarFields
                    project={project as any}
                    onUpdate={onUpdateProject}
                    onImportHtml={onImportHtml}
                    onGenerateSeo={onGenerateSeo}
                    seoGenerating={seoGenerating}
                    compact
                  />
                </div>
              </SectionGroup>
            </div>
          </TabsContent>

          {/* Inspector Tab */}
          <TabsContent value="element" className="absolute inset-0 m-0 overflow-y-auto custom-scrollbar bg-zinc-950/20">
            {!hasElementFocus ? (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
                  <MousePointerClick className="h-7 w-7 text-zinc-700" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">Selection Required</h3>
                <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed">
                  Select a block on the canvas to adjust its specific properties and layout.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50 animate-in slide-in-from-right-2 duration-300">
                {styleTarget && (
                  <InspectorPanel title="Appearance Styles">
                    <EditorStylePanel
                      embedded
                      target={styleTarget}
                      editViewport={editViewport}
                      onApplyStyles={onApplyStyles}
                      onClose={() => {}}
                    />
                  </InspectorPanel>
                )}

                {sectionSelection?.collection && onCollectionAdd && (
                  <InspectorPanel title="Items & rows">
                    <EditorCollectionPanel
                      embedded
                      section={sectionSelection}
                      projectId={projectId}
                      onAddItem={onCollectionAdd}
                      onRemoveItem={onCollectionRemove!}
                      onSetColumns={onCollectionSetColumns!}
                      onImageUpdate={(imageId, src) => onCollectionImageUpdate?.(imageId, src)}
                    />
                  </InspectorPanel>
                )}

                {(sectionSelection?.widget === 'carousel' ||
                  sectionSelection?.collection === 'carousel') &&
                  onCarouselUpdate && (
                  <InspectorPanel title="Slider">
                    <EditorCarouselPanel
                      embedded
                      section={sectionSelection}
                      onUpdate={onCarouselUpdate}
                    />
                  </InspectorPanel>
                )}

                {sectionSelection?.widget === 'leadForm' && onLeadFormUpdate && orgId && (
                  <InspectorPanel title="Lead form">
                    <EditorLeadFormPanel
                      embedded
                      section={sectionSelection}
                      orgId={orgId}
                      onUpdate={onLeadFormUpdate}
                    />
                  </InspectorPanel>
                )}

                {sectionSelection && (
                  <InspectorPanel title="Layout & Grid">
                    <EditorSectionPanel
                      embedded
                      section={sectionSelection}
                      editViewport={editViewport}
                      onSetLayout={onSetLayout}
                      onSetPadding={onSetPadding}
                      onSetColumnWidths={onSetColumnWidths}
                      onSetGap={onSetGap}
                      onStackMobile={onStackMobile}
                      onInsertInside={onInsertInside}
                      onClose={() => {}}
                      onApplyContainerStyles={(id, styles) => onApplyStyles(id, styles)}
                    />
                  </InspectorPanel>
                )}

                {selectedElement && (
                  <InspectorPanel title="Content Properties" last>
                    <ElementEditorPanel
                      embedded
                      element={selectedElement}
                      projectId={projectId}
                      onClose={() => {}}
                      onUpdate={onElementUpdate}
                      onDelete={onElementDelete}
                    />
                  </InspectorPanel>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}

// --- Helper Components for High-End UI ---

function SectionGroup({ icon: Icon, title, children, color }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function InspectorPanel({ title, children, last }: { title: string, children: React.ReactNode, last?: boolean }) {
  return (
    <div className={cn("group overflow-hidden", !last && "border-b border-zinc-800/50")}>
      <div className="px-4 py-2 bg-zinc-900/20 group-hover:bg-zinc-900/40 transition-colors flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{title}</span>
        <ChevronRight className="h-3 w-3 text-zinc-700" />
      </div>
      <div className="p-0">{children}</div>
    </div>
  )
}