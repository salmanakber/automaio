'use client'

import { useEffect, useState } from 'react'
import { Settings2, MousePointerClick, FileText, Palette } from 'lucide-react'
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
import type { StyleTarget, EditViewport, ElementStyles } from '@/lib/editor/responsive-styles'
import type { TemplateTheme } from '@/lib/templates/theme'
import type { EditorWidgetType } from '@/lib/editor/editor-widgets'

type StudioRightSidebarProps = {
  project: Record<string, unknown>
  projectId: string
  isLandingPage: boolean
  editViewport: EditViewport
  editorTheme: TemplateTheme
  publishedLiveUrl: string | null
  selectedElement: SelectedElement | null
  sectionSelection: SectionSelection | null
  styleTarget: StyleTarget | null
  seoGenerating: boolean
  onUpdateProject: (p: Record<string, unknown>) => void
  onImportHtml: (html: string) => void
  onGenerateSeo: () => Promise<void>
  onThemeChange: (theme: TemplateTheme) => void
  onApplyTheme: () => void
  onElementUpdate: (msg: Record<string, unknown>) => void
  onElementDelete: (id: string) => void
  onApplyStyles: (id: string, styles: ElementStyles) => void
  onSetLayout: (layout: '1col' | '2col' | '3col') => void
  onSetPadding: (padding: SectionPadding) => void
  onSetColumnWidths: (widths: number[]) => void
  onSetGap: (gap: number) => void
  onStackMobile: () => void
  onInsertInside: (type: EditorWidgetType) => void
}

export function StudioRightSidebar(props: StudioRightSidebarProps) {
  const {
    project,
    projectId,
    isLandingPage,
    editViewport,
    editorTheme,
    publishedLiveUrl,
    selectedElement,
    sectionSelection,
    styleTarget,
    seoGenerating,
    onUpdateProject,
    onImportHtml,
    onGenerateSeo,
    onThemeChange,
    onApplyTheme,
    onElementUpdate,
    onElementDelete,
    onApplyStyles,
    onSetLayout,
    onSetPadding,
    onSetColumnWidths,
    onSetGap,
    onStackMobile,
    onInsertInside,
  } = props

  const hasElementFocus = Boolean(selectedElement || sectionSelection || styleTarget)
  const [tab, setTab] = useState<'page' | 'element'>('page')

  useEffect(() => {
    if (hasElementFocus) setTab('element')
  }, [hasElementFocus, selectedElement?.id, sectionSelection?.id, styleTarget?.id])

  return (
    <aside className="w-80 border-l border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'page' | 'element')} className="flex flex-col h-full gap-0">
        <div className="px-3 pt-3 pb-2 border-b border-zinc-800 shrink-0">
          <TabsList className="w-full h-9 bg-zinc-900 border border-zinc-800 p-0.5">
            <TabsTrigger
              value="page"
              className="flex-1 text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-zinc-800 data-[state=active]:text-violet-300 gap-1.5"
            >
              <Settings2 className="h-3 w-3" />
              Page
            </TabsTrigger>
            <TabsTrigger
              value="element"
              className="flex-1 text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-300 gap-1.5"
            >
              <MousePointerClick className="h-3 w-3" />
              Element
              {hasElementFocus && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="page" className="flex-1 min-h-0 m-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {isLandingPage && (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5 mb-3">
                    <Palette className="h-3.5 w-3.5" />
                    Brand colors
                  </p>
                  <EditorThemePanel theme={editorTheme} onChange={onThemeChange} onApply={onApplyTheme} />
                </div>
                <ProjectUrlsCard projectId={projectId} liveUrl={publishedLiveUrl} />
              </>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5" />
                Content &amp; SEO
              </p>
              <SidebarFields
                project={project as Parameters<typeof SidebarFields>[0]['project']}
                onUpdate={onUpdateProject}
                onImportHtml={onImportHtml}
                onGenerateSeo={onGenerateSeo}
                seoGenerating={seoGenerating}
                compact
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="element" className="flex-1 min-h-0 m-0 overflow-y-auto custom-scrollbar">
          {!hasElementFocus ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[240px] p-8 text-center">
              <MousePointerClick className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No element selected</p>
              <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px]">
                Click any block on the canvas to edit styles, layout, and content here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {styleTarget && (
                <EditorStylePanel
                  embedded
                  target={styleTarget}
                  editViewport={editViewport}
                  onApplyStyles={onApplyStyles}
                  onClose={() => {}}
                />
              )}

              {sectionSelection && (
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
                />
              )}

              {selectedElement && (
                <ElementEditorPanel
                  embedded
                  element={selectedElement}
                  projectId={projectId}
                  onClose={() => {}}
                  onUpdate={onElementUpdate}
                  onDelete={onElementDelete}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}
