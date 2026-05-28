'use client'

import { Plus, Minus, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { SectionSelection } from '@/components/projects/EditorSectionPanel'

type EditorCollectionPanelProps = {
  section: SectionSelection
  embedded?: boolean
  onAddItem: () => void
  onRemoveItem: () => void
  onSetColumns: (columns: number) => void
}

export function EditorCollectionPanel({
  section,
  embedded: _embedded,
  onAddItem,
  onRemoveItem,
  onSetColumns,
}: EditorCollectionPanelProps) {
  const itemCount = section.collectionItemCount ?? 1
  const columns = section.collectionColumns ?? 1
  const isFaq = section.collection === 'faq' || section.collection === 'tabs'

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
          Repeatable items
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Add or remove rows in this {section.collection} block. Edit each item on the canvas.
      </p>

      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
        <span className="text-[10px] text-zinc-500 uppercase font-bold">Items</span>
        <span className="text-sm font-mono text-violet-300">{itemCount}</span>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-[10px] gap-1 border-zinc-700"
          onClick={onAddItem}
        >
          <Plus className="h-3 w-3" /> Add item
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[10px] gap-1 border-zinc-700"
          disabled={itemCount <= 1}
          onClick={onRemoveItem}
        >
          <Minus className="h-3 w-3" /> Remove
        </Button>
      </div>

      {!isFaq && (
        <div className="space-y-2 pt-1">
          <div className="flex justify-between">
            <Label className="text-[9px] text-zinc-500 uppercase">Columns</Label>
            <span className="text-[9px] text-violet-400 font-mono">{columns}</span>
          </div>
          <Slider
            min={1}
            max={4}
            step={1}
            value={[columns]}
            onValueChange={([v]) => onSetColumns(v)}
          />
        </div>
      )}
    </div>
  )
}
