'use client'

import { useEffect, useState } from 'react'
import { LayoutGrid, Plus, Columns2, Columns3, Square, Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { BLOCK_CATEGORIES, type EditorWidgetType } from '@/lib/editor/editor-widgets'

export type SectionPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

export type SectionSelection = {
  id: string
  tag: string
  widget?: string
  layout?: string
  isDropZone?: boolean
  padding?: SectionPadding
  columnWidths?: number[]
  gap?: number
}

type EditorSectionPanelProps = {
  section: SectionSelection | null
  editViewport?: 'desktop' | 'tablet' | 'mobile'
  onSetLayout: (layout: '1col' | '2col' | '3col') => void
  onSetPadding: (padding: SectionPadding) => void
  onSetColumnWidths: (widths: number[]) => void
  onSetGap: (gap: number) => void
  onStackMobile?: () => void
  onInsertInside: (type: EditorWidgetType) => void
  onClose: () => void
}

const QUICK_BLOCKS: EditorWidgetType[] = ['heading', 'paragraph', 'button', 'image', 'spacer', 'card']

const DEFAULT_PADDING: SectionPadding = { top: 72, right: 24, bottom: 72, left: 24 }

function PadSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label className="text-[9px] text-zinc-500 uppercase">{label}</Label>
        <span className="text-[9px] text-violet-400 font-mono">{value}px</span>
      </div>
      <Slider min={0} max={120} step={4} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

export function EditorSectionPanel({
  section,
  editViewport = 'desktop',
  onSetLayout,
  onSetPadding,
  onSetColumnWidths,
  onSetGap,
  onStackMobile,
  onInsertInside,
  onClose,
}: EditorSectionPanelProps) {
  const [padding, setPadding] = useState<SectionPadding>(DEFAULT_PADDING)
  const [linkedPadding, setLinkedPadding] = useState(true)
  const [col1, setCol1] = useState(50)
  const [col2, setCol2] = useState(34)
  const [gap, setGap] = useState(32)

  useEffect(() => {
    if (!section) return
    setPadding(section.padding ?? DEFAULT_PADDING)
    if (section.columnWidths?.length === 2) {
      setCol1(section.columnWidths[0])
    } else if (section.columnWidths?.length === 3) {
      setCol1(section.columnWidths[0])
      setCol2(section.columnWidths[1])
    } else {
      setCol1(50)
      setCol2(34)
    }
    setGap(section.gap ?? 32)
  }, [section?.id, section?.padding, section?.columnWidths, section?.gap])

  if (!section) return null

  const label = section.widget
    ? section.widget.charAt(0).toUpperCase() + section.widget.slice(1)
    : section.tag

  const isMultiCol = section.layout === '2col' || section.layout === '3col'

  const commitPadding = (next: SectionPadding) => {
    setPadding(next)
    onSetPadding(next)
  }

  const handleVerticalPad = (v: number) => {
    if (linkedPadding) {
      commitPadding({ top: v, right: padding.right, bottom: v, left: padding.left })
    } else {
      commitPadding({ ...padding, top: v, bottom: v })
    }
  }

  const handleHorizontalPad = (v: number) => {
    if (linkedPadding) {
      commitPadding({ top: padding.top, right: v, bottom: padding.bottom, left: v })
    } else {
      commitPadding({ ...padding, right: v, left: v })
    }
  }

  const handleCol1Change = (v: number) => {
    setCol1(v)
    if (section.layout === '2col') {
      onSetColumnWidths([v, 100 - v])
    } else if (section.layout === '3col') {
      const c3 = Math.max(15, 100 - v - col2)
      onSetColumnWidths([v, col2, c3])
    }
  }

  const handleCol2Change = (v: number) => {
    setCol2(v)
    if (section.layout === '3col') {
      const c3 = Math.max(15, 100 - col1 - v)
      onSetColumnWidths([col1, v, c3])
    }
  }

  return (
    <div className="absolute top-4 right-4 z-20 w-72 rounded-xl border border-violet-500/30 bg-[#0c0c0e]/95 backdrop-blur-md shadow-2xl max-h-[calc(100%-2rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
            {label}
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none">
          &times;
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Layout */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Layout</p>
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant={section.layout === '1col' || !section.layout ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-[9px] gap-1 bg-violet-600 hover:bg-violet-700"
              onClick={() => onSetLayout('1col')}
            >
              <Square className="h-3 w-3" /> 1
            </Button>
            <Button
              type="button"
              variant={section.layout === '2col' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-[9px] gap-1 border-zinc-700"
              onClick={() => onSetLayout('2col')}
            >
              <Columns2 className="h-3 w-3" /> 2
            </Button>
            <Button
              type="button"
              variant={section.layout === '3col' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-[9px] gap-1 border-zinc-700"
              onClick={() => onSetLayout('3col')}
            >
              <Columns3 className="h-3 w-3" /> 3
            </Button>
          </div>
        </div>

        {/* Column widths */}
        {isMultiCol && (
          <div className="space-y-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Column widths</p>
            {section.layout === '2col' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[9px] text-zinc-500">Left / Right</Label>
                  <span className="text-[9px] text-violet-400 font-mono">
                    {col1}% / {100 - col1}%
                  </span>
                </div>
                <Slider min={25} max={75} step={1} value={[col1]} onValueChange={([v]) => handleCol1Change(v)} />
              </div>
            )}
            {section.layout === '3col' && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-[9px] text-zinc-500">Column 1</Label>
                    <span className="text-[9px] text-violet-400 font-mono">{col1}%</span>
                  </div>
                  <Slider min={15} max={60} step={1} value={[col1]} onValueChange={([v]) => handleCol1Change(v)} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-[9px] text-zinc-500">Column 2</Label>
                    <span className="text-[9px] text-violet-400 font-mono">{col2}%</span>
                  </div>
                  <Slider
                    min={15}
                    max={60}
                    step={1}
                    value={[col2]}
                    onValueChange={([v]) => handleCol2Change(v)}
                  />
                </div>
                <p className="text-[9px] text-zinc-600 text-center">
                  Column 3: {Math.max(15, 100 - col1 - col2)}%
                </p>
              </>
            )}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between">
                <Label className="text-[9px] text-zinc-500">Gap</Label>
                <span className="text-[9px] text-violet-400 font-mono">{gap}px</span>
              </div>
              <Slider
                min={0}
                max={80}
                step={4}
                value={[gap]}
                onValueChange={([v]) => {
                  setGap(v)
                  onSetGap(v)
                }}
              />
            </div>
            {editViewport === 'mobile' && isMultiCol && onStackMobile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-[9px] border-violet-800 text-violet-300 mt-2"
                onClick={onStackMobile}
              >
                Stack columns on mobile
              </Button>
            )}
          </div>
        )}

        {/* Padding */}
        <div className="space-y-2.5 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Padding
              {editViewport !== 'desktop' && (
                <span className="ml-1 text-violet-400 normal-case">({editViewport})</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setLinkedPadding((l) => !l)}
              className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-violet-400"
              title={linkedPadding ? 'Unlink sides' : 'Link all sides'}
            >
              {linkedPadding ? <Link2 className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
              {linkedPadding ? 'Linked' : 'Individual'}
            </button>
          </div>
          {linkedPadding ? (
            <>
              <PadSlider label="Vertical" value={padding.top} onChange={handleVerticalPad} />
              <PadSlider label="Horizontal" value={padding.right} onChange={handleHorizontalPad} />
            </>
          ) : (
            <>
              <PadSlider
                label="Top"
                value={padding.top}
                onChange={(v) => commitPadding({ ...padding, top: v })}
              />
              <PadSlider
                label="Right"
                value={padding.right}
                onChange={(v) => commitPadding({ ...padding, right: v })}
              />
              <PadSlider
                label="Bottom"
                value={padding.bottom}
                onChange={(v) => commitPadding({ ...padding, bottom: v })}
              />
              <PadSlider
                label="Left"
                value={padding.left}
                onChange={(v) => commitPadding({ ...padding, left: v })}
              />
            </>
          )}
        </div>

        {/* Add inside */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add inside
          </p>
          <div className="flex flex-wrap gap-1">
            {QUICK_BLOCKS.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[9px] border-zinc-700 bg-zinc-900 capitalize"
                onClick={() => onInsertInside(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <details className="text-[10px]">
          <summary className="cursor-pointer text-zinc-500 font-bold uppercase tracking-wider">
            All blocks
          </summary>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
            {Object.entries(BLOCK_CATEGORIES).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-[8px] text-zinc-600 uppercase mb-1">{cat}</p>
                <div className="flex flex-wrap gap-1">
                  {items.map((w) => (
                    <button
                      key={w.type}
                      type="button"
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:bg-violet-900 hover:text-violet-200 text-[9px]"
                      onClick={() => onInsertInside(w.type as EditorWidgetType)}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}
