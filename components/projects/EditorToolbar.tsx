'use client'

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
} from 'lucide-react'
import { EDITOR_WIDGETS, type EditorWidgetType } from '@/lib/editor/editor-widgets'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type EditorToolbarProps = {
  canUndo?: boolean
  canRedo?: boolean
  onUndo: () => void
  onRedo: () => void
  onDuplicate: () => void
  onInsertWidget: (type: EditorWidgetType) => void
}

const CATEGORY_LABELS = {
  text: 'Text',
  media: 'Media',
  layout: 'Layout',
  blocks: 'Blocks',
} as const

export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicate,
  onInsertWidget,
}: EditorToolbarProps) {
  const grouped = EDITOR_WIDGETS.reduce(
    (acc, w) => {
      acc[w.category].push(w)
      return acc
    },
    { text: [] as typeof EDITOR_WIDGETS, media: [], layout: [], blocks: [] },
  )

  return (
    <div className="border-t border-zinc-800 bg-[#09090b] shrink-0">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/80">
        <MousePointer2 className="h-3.5 w-3.5 text-zinc-500 mr-1" />
        <span className="text-[10px] text-zinc-500 mr-2">Click any element · drag guides follow cursor</span>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={!canUndo} onClick={onUndo} title="Undo (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={!canRedo} onClick={onRedo} title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={onDuplicate} title="Duplicate selected">
          <Copy className="h-3 w-3" /> Duplicate
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['text', 'blocks']} className="px-2 pb-2">
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => (
          <AccordionItem key={cat} value={cat} className="border-zinc-800">
            <AccordionTrigger className="py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400 hover:no-underline">
              {CATEGORY_LABELS[cat]}
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {grouped[cat].map((w) => (
                  <Button
                    key={w.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] border-zinc-700 bg-zinc-900 gap-1.5"
                    onClick={() => onInsertWidget(w.type)}
                  >
                    {cat === 'text' && w.type === 'heading' ? (
                      <Type className="h-3 w-3" />
                    ) : cat === 'media' && w.type === 'image' ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : cat === 'layout' ? (
                      <LayoutGrid className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {w.label}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
