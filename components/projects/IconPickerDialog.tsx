'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shapes, Check, Search } from 'lucide-react'
import {
  ICON_CATEGORY_LABELS,
  ICON_SET_LABELS,
  findIconEntry,
  searchIconCatalog,
  type IconCategory,
  type IconCatalogEntry,
  type IconSetId,
} from '@/lib/editor/icon-catalog'
import { cn } from '@/lib/utils'
import { MATERIAL_SYMBOLS_FONT_URL } from '@/lib/editor/icon-render'

type IconPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  title?: string
  onSelect: (iconRef: string) => void
}

function IconPreviewCell({ entry, size = 22 }: { entry: IconCatalogEntry; size?: number }) {
  if (entry.set === 'material') {
    return (
      <span
        className="material-symbols-outlined text-zinc-200"
        style={{ fontSize: size, fontVariationSettings: "'FILL' 0, 'wght' 400" }}
      >
        {entry.name}
      </span>
    )
  }
  if (!entry.path) return <span className="text-zinc-600">?</span>
  const fill = entry.set === 'bootstrap' ? 'currentColor' : 'none'
  const stroke = entry.set === 'bootstrap' ? 'none' : 'currentColor'
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="text-zinc-200"
      fill={fill}
      stroke={stroke}
      strokeWidth={entry.set === 'bootstrap' ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={entry.path} />
    </svg>
  )
}

export function IconPickerDialog({
  open,
  onOpenChange,
  value,
  title = 'Icon library',
  onSelect,
}: IconPickerDialogProps) {
  const [query, setQuery] = useState('')
  const [setFilter, setSetFilter] = useState<IconSetId | 'all'>('all')
  const [category, setCategory] = useState<IconCategory>('all')
  const [picked, setPicked] = useState(value ?? '')

  const icons = useMemo(
    () => searchIconCatalog(query, setFilter, category),
    [query, setFilter, category],
  )

  const handleUse = () => {
    if (!picked) return
    onSelect(picked)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) {
          setPicked(value ?? '')
          setQuery('')
        }
      }}
    >
      <DialogContent className="bg-[#0c0c0e] border-zinc-800 text-white sm:max-w-2xl max-h-[85vh] flex flex-col">
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_FONT_URL} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shapes className="h-5 w-5 text-violet-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Material Symbols, Lucide, and Bootstrap-style icons. Filter by library or category.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            className="pl-8 h-9 bg-zinc-950 border-zinc-800 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'material', 'lucide', 'bootstrap'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSetFilter(id)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors',
                setFilter === id
                  ? 'border-violet-500/50 bg-violet-600/20 text-violet-200'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
              )}
            >
              {id === 'all' ? 'All libraries' : ICON_SET_LABELS[id]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              'all',
              'arrows',
              'navigation',
              'media',
              'ui',
              'business',
              'communication',
              'social',
              'shapes',
            ] as IconCategory[]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-medium border transition-colors',
                category === cat
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                  : 'border-zinc-800/80 text-zinc-600 hover:text-zinc-400',
              )}
            >
              {cat === 'all' ? 'All categories' : ICON_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-zinc-800 rounded-lg p-2 bg-zinc-950/50">
          {icons.length === 0 ? (
            <p className="text-center text-sm text-zinc-600 py-12">No icons match your filters.</p>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {icons.map((entry) => {
                const ref = `${entry.set}:${entry.name}`
                const selected = picked === ref
                return (
                  <button
                    key={ref}
                    type="button"
                    title={entry.label}
                    onClick={() => setPicked(ref)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-1 rounded-lg border p-2 min-h-[64px] transition-all',
                      selected
                        ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30'
                        : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
                    )}
                  >
                    <IconPreviewCell entry={entry} />
                    <span className="text-[8px] text-zinc-600 truncate w-full text-center leading-tight">
                      {entry.label}
                    </span>
                    {selected && (
                      <span className="absolute top-1 right-1 bg-violet-600 rounded-full p-0.5">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 truncate flex-1">
            {picked ? `Selected: ${picked}` : 'Pick an icon'}
          </p>
          <Button
            type="button"
            size="sm"
            className="bg-violet-600 hover:bg-violet-500"
            disabled={!picked}
            onClick={handleUse}
          >
            Use icon
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Inline preview for inspector panels */
export function IconPreviewBadge({ iconRef, size = 20 }: { iconRef: string; size?: number }) {
  const entry = useMemo(() => findIconEntry(iconRef), [iconRef])

  if (!entry) return null
  return (
    <span className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 p-2">
      <IconPreviewCell entry={entry} size={size} />
    </span>
  )
}
