'use client'

import { useEffect, useState } from 'react'
import { Paintbrush, Smartphone, Tablet, Monitor, RotateCcw, Hash } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  STYLE_PRESETS,
  type EditViewport,
  type ElementStyles,
  type StyleTarget,
} from '@/lib/editor/responsive-styles'
import { cn } from '@/lib/utils'

type EditorStylePanelProps = {
  target: StyleTarget | null
  editViewport: EditViewport
  onApplyStyles: (id: string, styles: ElementStyles) => void
  onClose: () => void
  embedded?: boolean
}

const VIEWPORT_META: Record<
  EditViewport,
  { label: string; icon: typeof Monitor; color: string; hint: string }
> = {
  desktop: {
    label: 'Desktop',
    icon: Monitor,
    color: 'text-blue-400',
    hint: 'Base Styles',
  },
  tablet: {
    label: 'Tablet',
    icon: Tablet,
    color: 'text-amber-400',
    hint: '≤991px Only',
  },
  mobile: {
    label: 'Mobile',
    icon: Smartphone,
    color: 'text-rose-400',
    hint: '≤767px Only',
  },
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const safe = value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)' ? value : '#ffffff'
  
  return (
    <div className="space-y-1.5 flex-1">
      <div className="flex items-center gap-1.5 px-0.5">
         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</span>
      </div>
      <div className="relative group flex items-center">
        <div 
          className="absolute left-1.5 z-10 w-4 h-4 rounded-sm border border-white/10 shadow-sm transition-transform group-hover:scale-110 overflow-hidden"
          style={{ backgroundColor: value || 'transparent' }}
        >
          <input
            type="color"
            value={safe.startsWith('#') ? safe : '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
          />
          {!value && <div className="w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZEADJEYGhj9MDIyMDEwMDAxMDCCAgQECAM8HAwXm1sqfAAAAAElFTkSuQmCC')] opacity-50" />}
        </div>
        <div className="absolute left-7 text-zinc-600 group-hover:text-zinc-400 transition-colors">
          <Hash className="h-3 w-3" />
        </div>
        <Input
          value={value?.replace('#', '')}
          onChange={(e) => {
            const v = e.target.value
            onChange(v === '' ? '' : v.startsWith('#') ? v : `#${v}`)
          }}
          placeholder="None"
          className="h-8 pl-10 pr-2 font-mono text-[10px] bg-zinc-950 border-zinc-800 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
        />
      </div>
    </div>
  )
}

export function EditorStylePanel({
  target,
  editViewport,
  onApplyStyles,
  onClose,
  embedded = false,
}: EditorStylePanelProps) {
  const [styles, setStyles] = useState<ElementStyles>({})
  const [radius, setRadius] = useState(0)

  useEffect(() => {
    if (!target) return
    setStyles(target.styles)
    const r = parseInt(String(target.styles.borderRadius ?? '0').replace('px', ''), 10)
    setRadius(Number.isFinite(r) ? r : 0)
  }, [target?.id, target?.styles, editViewport])

  if (!target) return null

  const vp = VIEWPORT_META[editViewport]
  const VpIcon = vp.icon

  const commit = (next: ElementStyles) => {
    setStyles(next)
    onApplyStyles(target.id, next)
  }

  const shellClass = cn(
    "flex flex-col bg-[#09090b] select-none",
    embedded ? "w-full" : "fixed top-4 left-4 z-[100] w-72 rounded-2xl border border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-hidden"
  )

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Paintbrush className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 leading-none">
              Appearance
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">
              {target.label}
            </span>
          </div>
        </div>
        {!embedded && (
          <button 
            type="button" 
            onClick={onClose} 
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white"
          >
            &times;
          </button>
        )}
      </div>

      {/* Viewport Indicator */}
      <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1 rounded-md bg-zinc-950 border border-zinc-800 shadow-sm", vp.color)}>
             <VpIcon className="h-3 w-3" />
          </div>
          <span className="text-[10px] font-bold text-zinc-300">{vp.label}</span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
          {vp.hint}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Color Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-3">
             <ColorField
              label="Background"
              value={styles.backgroundColor ?? ''}
              onChange={(v) => commit({ ...styles, backgroundColor: v })}
            />
             <ColorField
              label="Text"
              value={styles.color ?? ''}
              onChange={(v) => commit({ ...styles, color: v })}
            />
          </div>
          <ColorField
            label="Border Stroke"
            value={styles.borderColor ?? ''}
            onChange={(v) => commit({ ...styles, borderColor: v })}
          />
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Corner Radius</Label>
            <div className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-violet-400">
              {radius}px
            </div>
          </div>
          <Slider
            min={0}
            max={48}
            step={1}
            value={[radius]}
            className="py-2"
            onValueChange={([v]) => {
              setRadius(v)
              commit({ ...styles, borderRadius: v ? `${v}px` : '' })
            }}
          />
        </div>

        {/* Quick Palette */}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
            <RotateCcw className="h-3 w-3" /> Quick Colors
          </p>
          <div className="grid grid-cols-6 gap-2">
            {STYLE_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className="group relative h-8 w-full rounded-lg border border-white/5 shadow-md overflow-hidden transition-all hover:scale-110 active:scale-90"
                style={{ backgroundColor: c }}
                onClick={() => commit({ ...styles, backgroundColor: c })}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 mt-auto border-t border-zinc-800/50 bg-zinc-950/30">
        <Button
          type="button"
          variant="ghost"
          className="w-full h-9 text-[10px] font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-400/5 transition-all gap-2"
          onClick={() =>
            commit({
              backgroundColor: '',
              color: '',
              borderColor: '',
              borderRadius: '',
            })
          }
        >
          <RotateCcw className="h-3 w-3" />
          Reset {vp.label} Styles
        </Button>
      </div>
    </div>
  )
}