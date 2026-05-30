'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Layers,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type NavigatorItem = {
  id: string
  label: string
  tag: string
  widget?: string
  section?: string
}

type EditorNavigatorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavigatorItem[]
  activeId?: string | null
  onRefresh: () => void
  onSelect: (id: string) => void
  onMove: (id: string, targetId: string, position: 'before' | 'after') => void
}

export function EditorNavigator({
  open,
  onOpenChange,
  items,
  activeId,
  onRefresh,
  onSelect,
  onMove,
}: EditorNavigatorProps) {
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    if (open) onRefresh()
  }, [open, onRefresh])

  const handleDrop = useCallback(
    (targetId: string, position: 'before' | 'after') => {
      if (!dragId || dragId === targetId) return
      onMove(dragId, targetId, position)
      setDragId(null)
      setTimeout(onRefresh, 120)
    },
    [dragId, onMove, onRefresh],
  )

  if (!open) return null

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100%-2rem))] rounded-xl border border-zinc-700 bg-[#0c0c0e]/98 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/80">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            Navigator
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">{items.length}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-white"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-8">No blocks on canvas yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                const position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
                handleDrop(item.id, position)
              }}
              className={cn(
                'group flex items-center gap-2 rounded-lg border px-2 py-1.5 cursor-grab active:cursor-grabbing transition-colors',
                activeId === item.id
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/60',
                dragId === item.id && 'opacity-50',
              )}
              onClick={() => onSelect(item.id)}
            >
              <GripVertical className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-medium text-zinc-200 truncate capitalize">
                  {item.label || item.widget || item.tag}
                </p>
                <p className="text-[9px] text-zinc-600 font-mono truncate">
                  &lt;{item.tag}&gt;{item.section ? ` · ${item.section}` : ''}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-zinc-700 opacity-0 group-hover:opacity-100 shrink-0" />
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
        Drag rows to reorder · Click to select on canvas
      </div>
    </div>
  )
}

export function EditorNavigatorToggle({
  open,
  onClick,
  count,
}: {
  open: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold shadow-2xl transition-all',
        open
          ? 'border-violet-500/50 bg-violet-600 text-white'
          : 'border-zinc-700 bg-[#0c0c0e]/95 text-zinc-300 hover:border-zinc-600 hover:text-white backdrop-blur-md',
      )}
    >
      <Layers className="h-3.5 w-3.5" />
      Navigator
      {count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px] font-mono',
            open ? 'bg-white/20' : 'bg-zinc-800 text-zinc-400',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
