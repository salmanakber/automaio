'use client'

import type { ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Undo2,
  Redo2,
  Copy,
  Plus,
  MousePointer2,
  GripVertical,
  Layers,
  Box,
  Sparkles,
} from 'lucide-react'
import {
  EDITOR_WIDGETS,
  EDITOR_CATEGORY_LABELS,
  buildWidgetHtml,
  type EditorWidgetType,
} from '@/lib/editor/editor-widgets'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type EditorToolbarProps = {
  canUndo?: boolean
  canRedo?: boolean
  layout?: 'bottom' | 'sidebar'
  onUndo: () => void
  onRedo: () => void
  onDuplicate: () => void
  onInsertWidget: (type: EditorWidgetType) => void
}

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  structure: Layers,
  basic: Type,
  media: ImageIcon,
  blocks: Box,
}

function WidgetButton({
  type,
  label,
  category,
  onInsert,
  compact,
}: {
  type: EditorWidgetType
  label: string
  category: string
  onInsert: (type: EditorWidgetType) => void
  compact?: boolean
}) {
  const html = buildWidgetHtml(type)

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-am-widget', type)
        e.dataTransfer.setData('application/x-am-widget-html', html)
        e.dataTransfer.setData('text/plain', `am-widget:${type}`)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => onInsert(type)}
      className={
        compact
          ? 'group relative flex flex-col items-center justify-center gap-0.5 h-14 rounded-lg border border-zinc-700/80 bg-zinc-900/80 hover:border-violet-500/60 hover:bg-violet-950/30 transition-all cursor-grab active:cursor-grabbing'
          : 'group relative flex flex-col items-center justify-center gap-1 h-16 w-[calc(50%-4px)] rounded-lg border border-zinc-700/80 bg-zinc-900/80 hover:border-violet-500/60 hover:bg-violet-950/30 transition-all cursor-grab active:cursor-grabbing'
      }
      title={`Drag onto canvas or click to insert · ${label}`}
    >
      <GripVertical className="absolute top-1 right-1 h-2.5 w-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      {category === 'basic' && type === 'heading' ? (
        <Type className="h-4 w-4 text-violet-400" />
      ) : category === 'media' && type === 'image' ? (
        <ImageIcon className="h-4 w-4 text-violet-400" />
      ) : category === 'structure' ? (
        <LayoutGrid className="h-4 w-4 text-violet-400" />
      ) : category === 'blocks' ? (
        <Sparkles className="h-4 w-4 text-violet-400" />
      ) : (
        <Plus className="h-4 w-4 text-violet-400" />
      )}
      <span className="text-[9px] font-medium text-zinc-400 group-hover:text-zinc-200 text-center leading-tight px-1">
        {label}
      </span>
    </button>
  )
}

export function EditorToolbar({
  canUndo,
  canRedo,
  layout = 'bottom',
  onUndo,
  onRedo,
  onDuplicate,
  onInsertWidget,
}: EditorToolbarProps) {
  const grouped = EDITOR_WIDGETS.reduce(
    (acc, w) => {
      if (!acc[w.category]) acc[w.category] = []
      acc[w.category].push(w)
      return acc
    },
    {} as Record<string, typeof EDITOR_WIDGETS>,
  )

  const categories = Object.keys(EDITOR_CATEGORY_LABELS) as Array<keyof typeof EDITOR_CATEGORY_LABELS>

  const isSidebar = layout === 'sidebar'

  return (
    <div
      className={
        isSidebar
          ? 'flex flex-col h-full bg-[#09090b]'
          : 'border-t border-zinc-800 bg-[#09090b] shrink-0 max-h-[42vh] flex flex-col'
      }
    >
      <div
        className={
          isSidebar
            ? 'flex items-center gap-1 px-3 py-2.5 border-b border-zinc-800 shrink-0'
            : 'flex items-center gap-1 px-3 py-2 border-b border-zinc-800/80 shrink-0'
        }
      >
        <MousePointer2 className="h-3.5 w-3.5 text-violet-400 mr-1 shrink-0" />
        <span className="text-[10px] text-zinc-500 leading-tight">
          {isSidebar ? 'Drag or click to add blocks' : 'Drag blocks onto canvas · reorder by dragging'}
        </span>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={!canUndo} onClick={onUndo} title="Undo (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={!canRedo} onClick={onRedo} title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        {!isSidebar && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={onDuplicate} title="Duplicate selected">
            <Copy className="h-3 w-3" /> Dup
          </Button>
        )}
      </div>

      {isSidebar && (
        <div className="px-3 py-2 border-b border-zinc-800/80 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-8 text-[10px] gap-1.5 border-zinc-700"
            onClick={onDuplicate}
          >
            <Copy className="h-3 w-3" /> Duplicate selected
          </Button>
        </div>
      )}

      <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
        <Accordion type="multiple" defaultValue={['structure', 'blocks']} className="px-2 pb-2">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? Plus
            const items = grouped[cat] ?? []
            if (!items.length) return null
            return (
              <AccordionItem key={cat} value={cat} className="border-zinc-800">
                <AccordionTrigger className="py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400 hover:no-underline gap-2">
                  <Icon className="h-3 w-3 text-violet-500" />
                  {EDITOR_CATEGORY_LABELS[cat]}
                  <span className="text-zinc-600 font-normal normal-case">({items.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className={isSidebar ? 'grid grid-cols-2 gap-1.5 pb-2' : 'flex flex-wrap gap-2 pb-2'}>
                    {items.map((w) => (
                      <WidgetButton
                        key={w.type}
                        type={w.type}
                        label={w.label}
                        category={cat}
                        onInsert={onInsertWidget}
                        compact={isSidebar}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}
