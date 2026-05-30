'use client'

import { useMemo, useState, type ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Columns,
  Square,
  Minus,
  Navigation,
  CreditCard,
  MessageSquare,
  Users,
  Mail,
  Quote,
  List,
  PlayCircle,
  FileInput,
  Search,
  Images,
  GalleryHorizontal,
  LayoutDashboard,
  Timer,
  AlertCircle,
  Code2,
  Rows3,
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
import { cn } from '@/lib/utils'

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
  structure: LayoutGrid,
  basic: Type,
  media: ImageIcon,
  blocks: Box,
}

// Logic-less Icon Mapper for a cleaner WidgetButton
const WIDGET_SPECIFIC_ICONS: Record<string, any> = {
  header: Navigation,
  footer: Square,
  section: Layers,
  columns2: Columns,
  columns3: Columns,
  heading: Type,
  paragraph: List,
  button: MousePointer2,
  image: ImageIcon,
  video: PlayCircle,
  pricing: CreditCard,
  faq: MessageSquare,
  team: Users,
  newsletter: Mail,
  quote: Quote,
  hero: Sparkles,
  divider: Minus,
  leadForm: FileInput,
  carousel: GalleryHorizontal,
  marquee: Sparkles,
  gallery: Images,
  bento: LayoutDashboard,
  accordion: Rows3,
  countdown: Timer,
  alert: AlertCircle,
  embed: Code2,
  logoStrip: Sparkles,
  timeline: Layers,
  caseStudy: FileInput,
  services: Box,
  portfolio: Images,
  awards: Sparkles,
  stats: CreditCard,
  steps: List,
  map: Navigation,
  socialProof: Users,
  comparison: Columns,
  callout: MessageSquare,
  videoHero: PlayCircle,
  counters: CreditCard,
  tabs: Rows3,
  countdown: Timer,
  bento: LayoutDashboard,
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
  const Icon = WIDGET_SPECIFIC_ICONS[type] || Plus

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
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all duration-200",
        "border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]",
        "active:scale-95 cursor-grab active:cursor-grabbing",
        compact ? "h-16 w-full" : "h-20 w-[calc(50%-4px)]"
      )}
      title={`Drag onto canvas or click to insert · ${label}`}
    >
      <GripVertical className="absolute top-1.5 right-1.5 h-3 w-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-2 rounded-lg bg-zinc-950/50 group-hover:bg-violet-500/10 transition-colors">
        <Icon className="h-4 w-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
      </div>

      <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-200 text-center leading-tight px-1 truncate w-full">
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
  const [query, setQuery] = useState('')

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
  const normalizedQuery = query.trim().toLowerCase()

  const filteredGrouped = useMemo(() => {
    if (!normalizedQuery) return grouped
    const next: Record<string, typeof EDITOR_WIDGETS> = {}
    for (const cat of categories) {
      const items = (grouped[cat] ?? []).filter(
        (w) =>
          w.label.toLowerCase().includes(normalizedQuery) ||
          w.type.toLowerCase().includes(normalizedQuery) ||
          cat.toLowerCase().includes(normalizedQuery),
      )
      if (items.length) next[cat] = items
    }
    return next
  }, [categories, grouped, normalizedQuery])

  const visibleCount = Object.values(filteredGrouped).reduce((n, items) => n + items.length, 0)

  return (
    <div className={cn(
      "flex flex-col bg-[#09090b] text-zinc-400",
      isSidebar ? "h-full border-r border-zinc-800 w-64" : "border-t border-zinc-800 w-full max-h-[42vh]"
    )}>
      {/* Top Bar / Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-5 w-5 rounded bg-violet-500/10">
             <MousePointer2 className="h-3 w-3 text-violet-400" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {isSidebar ? 'Library' : 'Editor Tools'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800" disabled={!canUndo} onClick={onUndo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800" disabled={!canRedo} onClick={onRedo} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1.5" onClick={onDuplicate}>
            <Copy className="h-3 w-3" /> {!isSidebar && "Duplicate"}
          </Button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-zinc-800/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks…"
            className="h-8 pl-8 text-[11px] bg-zinc-900/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-600"
          />
        </div>
        {normalizedQuery && (
          <p className="text-[10px] text-zinc-600 mt-1.5">
            {visibleCount} block{visibleCount === 1 ? '' : 's'} match
          </p>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
        <Accordion type="multiple" defaultValue={['structure', 'blocks']} className="space-y-1">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? Plus
            const items = filteredGrouped[cat] ?? []
            if (!items.length) return null
            
            return (
              <AccordionItem key={cat} value={cat} className="border-none">
                <AccordionTrigger className="py-2 px-2 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-md hover:no-underline transition-all">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-violet-500/80" />
                    {EDITOR_CATEGORY_LABELS[cat]}
                    <span className="text-zinc-700 text-[10px]">({items.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1">
                  <div className={cn(
                    "grid gap-2",
                    isSidebar ? "grid-cols-2" : "flex flex-wrap"
                  )}>
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

      {/* Instructional Footer */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/40">
         <p className="text-[9px] text-zinc-600 text-center uppercase tracking-widest font-bold">
            Drag and Drop into Canvas
         </p>
      </div>
    </div>
  )
}