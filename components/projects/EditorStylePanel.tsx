'use client'

import { useEffect, useState } from 'react'
import { Paintbrush, Smartphone, Tablet, Monitor } from 'lucide-react'
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

type EditorStylePanelProps = {
  target: StyleTarget | null
  editViewport: EditViewport
  onApplyStyles: (id: string, styles: ElementStyles) => void
  onClose: () => void
}

const VIEWPORT_META: Record<
  EditViewport,
  { label: string; icon: typeof Monitor; hint: string }
> = {
  desktop: {
    label: 'Desktop',
    icon: Monitor,
    hint: 'Styles apply to all screen sizes (base)',
  },
  tablet: {
    label: 'Tablet',
    icon: Tablet,
    hint: 'Saved for screens ≤991px only',
  },
  mobile: {
    label: 'Mobile',
    icon: Smartphone,
    hint: 'Saved for screens ≤767px only',
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
    <div className="space-y-1">
      <Label className="text-[9px] text-zinc-500 uppercase">{label}</Label>
      <div className="flex gap-1">
        <input
          type="color"
          value={safe.startsWith('#') ? safe : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border border-zinc-700 bg-zinc-950 p-0.5 shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="transparent"
          className="h-7 font-mono text-[10px] bg-zinc-950 border-zinc-800 px-1.5"
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

  return (
    <div className="absolute top-4 left-4 z-20 w-64 rounded-xl border border-violet-500/30 bg-[#0c0c0e]/95 backdrop-blur-md shadow-2xl max-h-[calc(100%-2rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Paintbrush className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 truncate">
            Style
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none shrink-0">
          &times;
        </button>
      </div>

      <div className="px-3 py-2 border-b border-zinc-800/80 bg-violet-950/20">
        <div className="flex items-center gap-2">
          <VpIcon className="h-3.5 w-3.5 text-violet-400" />
          <div>
            <p className="text-[10px] font-bold text-violet-300">Editing {vp.label}</p>
            <p className="text-[9px] text-zinc-500">{vp.hint}</p>
          </div>
        </div>
        <p className="text-[9px] text-zinc-600 mt-1.5 truncate">
          &lt;{target.tag}&gt; · {target.label}
        </p>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
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
          <ColorField
            label="Border"
            value={styles.borderColor ?? ''}
            onChange={(v) => commit({ ...styles, borderColor: v })}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <Label className="text-[9px] text-zinc-500 uppercase">Corner radius</Label>
            <span className="text-[9px] text-violet-400 font-mono">{radius}px</span>
          </div>
          <Slider
            min={0}
            max={48}
            step={2}
            value={[radius]}
            onValueChange={([v]) => {
              setRadius(v)
              commit({ ...styles, borderRadius: v ? `${v}px` : '' })
            }}
          />
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Quick colors</p>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                className="h-6 w-6 rounded-md border border-zinc-700 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                onClick={() => commit({ ...styles, backgroundColor: c })}
              />
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 text-[9px] border-zinc-700"
          onClick={() =>
            commit({
              backgroundColor: '',
              color: '',
              borderColor: '',
              borderRadius: '',
            })
          }
        >
          Clear styles ({vp.label})
        </Button>
      </div>
    </div>
  )
}
