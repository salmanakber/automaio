'use client'

import { EditorToolbar } from '@/components/projects/EditorToolbar'
import type { EditorWidgetType } from '@/lib/editor/editor-widgets'
import { Layers } from 'lucide-react'

type StudioLeftSidebarProps = {
  canUndo?: boolean
  canRedo?: boolean
  onUndo: () => void
  onRedo: () => void
  onDuplicate: () => void
  onInsertWidget: (type: EditorWidgetType) => void
}

export function StudioLeftSidebar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicate,
  onInsertWidget,
}: StudioLeftSidebarProps) {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Layers className="h-4 w-4 text-violet-400" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">Global</span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <EditorToolbar
          layout="sidebar"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onDuplicate={onDuplicate}
          onInsertWidget={onInsertWidget}
        />
      </div>
    </aside>
  )
}
