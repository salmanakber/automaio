'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Columns2,
  GripVertical,
  Layers,
  Trash2,
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
  kind?: string
  isBlock?: boolean
  depth?: number
  parentId?: string | null
  hasChildren?: boolean
  childCount?: number
  role?: string
}

type TreeNode = NavigatorItem & { children: TreeNode[] }

type EditorNavigatorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavigatorItem[]
  activeId?: string | null
  onRefresh: () => void
  onSelect: (id: string) => void
  onMove: (id: string, targetId: string, position: 'before' | 'after') => void
  onDelete: (id: string) => void
}

function buildTree(items: NavigatorItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function flattenVisible(nodes: TreeNode[], collapsed: Set<string>, depth = 0): TreeNode[] {
  const out: TreeNode[] = []
  for (const node of nodes) {
    out.push({ ...node, depth })
    if (node.hasChildren && !collapsed.has(node.id)) {
      out.push(...flattenVisible(node.children, collapsed, depth + 1))
    }
  }
  return out
}

export function EditorNavigator({
  open,
  onOpenChange,
  items,
  activeId,
  onRefresh,
  onSelect,
  onMove,
  onDelete,
}: EditorNavigatorProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildTree(items), [items])
  const visibleRows = useMemo(() => flattenVisible(tree, collapsed), [tree, collapsed])

  useEffect(() => {
    if (open) onRefresh()
  }, [open, onRefresh])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 w-[min(460px,calc(100%-2rem))] rounded-xl border border-zinc-700 bg-[#0c0c0e]/98 backdrop-blur-xl shadow-2xl overflow-hidden">
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

      <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {visibleRows.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-8">No elements on canvas yet.</p>
        ) : (
          visibleRows.map((item) => {
            const isCollapsed = collapsed.has(item.id)
            const depth = item.depth ?? 0

            return (
              <div
                key={item.id}
                draggable
                style={{ paddingLeft: `${8 + depth * 16}px` }}
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
                  'group flex items-center gap-1 rounded-lg border px-1.5 py-1 cursor-grab active:cursor-grabbing transition-colors',
                  activeId === item.id
                    ? 'border-violet-500/50 bg-violet-500/10'
                    : 'border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/60',
                  dragId === item.id && 'opacity-50',
                )}
              >
                <GripVertical className="h-3.5 w-3.5 text-zinc-600 shrink-0 opacity-60" />

                {item.hasChildren ? (
                  <button
                    type="button"
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-zinc-800 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCollapse(item.id)
                    }}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-zinc-500" />
                    )}
                  </button>
                ) : (
                  <span className="w-5 shrink-0" />
                )}

                {item.role === 'column' ? (
                  <Columns2 className="h-3 w-3 text-sky-400 shrink-0" />
                ) : item.isBlock ? (
                  <Layers className="h-3 w-3 text-violet-500 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0 opacity-40" />
                )}

                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => onSelect(item.id)}
                >
                  <p className="text-[11px] font-medium text-zinc-200 truncate capitalize">
                    {item.label || item.widget || item.tag}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono truncate">
                    &lt;{item.tag}&gt;
                    {item.kind ? ` · ${item.kind}` : ''}
                    {item.childCount ? ` · ${item.childCount} child${item.childCount === 1 ? '' : 'ren'}` : ''}
                  </p>
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.id)
                    setTimeout(onRefresh, 120)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
        Expand/collapse groups · Drag to reorder · Trash to delete
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
