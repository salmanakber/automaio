'use client'

import { useEffect, useState } from 'react'
import { Paintbrush, Smartphone, Tablet, Monitor, RotateCcw, Hash, Box, Move3d, Sparkles, Type } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  STYLE_PRESETS,
  SHADOW_PRESETS,
  ANIMATION_PRESETS,
  FONT_FAMILY_PRESETS,
  FONT_WEIGHT_OPTIONS,
  buildBoxShadow,
  buildTransform,
  buildLinearGradient,
  parseLinearGradient,
  normalizeColorInput,
  GRADIENT_PRESETS,
  parseBoxShadow,
  parseTransform,
  parseFontSize,
  parseFontFamily,
  type EditViewport,
  type ElementStyles,
  type StyleTarget,
  type ShadowValues,
  type TransformValues,
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
          {!value && (
            <div className="w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZEADJEYGhj9MDIyMDEwMDAxMDCCAgQECAM8HAwXm1sqfAAAAAElFTkSuQmCC')] opacity-50" />
          )}
        </div>
        <div className="absolute left-7 text-zinc-600 group-hover:text-zinc-400 transition-colors">
          <Hash className="h-3 w-3" />
        </div>
        <Input
          value={value?.replace('#', '')}
          onChange={(e) => {
            const v = e.target.value
            onChange(v === '' ? '' : normalizeColorInput(v))
          }}
          placeholder="None"
          className="h-8 pl-10 pr-2 font-mono text-[10px] bg-zinc-950 border-zinc-800 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
        />
      </div>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</Label>
        <div className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-violet-400">
          {value}
          {unit}
        </div>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} className="py-1" onValueChange={([v]) => onChange(v)} />
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
  const [fontSize, setFontSize] = useState(16)
  const [shadow, setShadow] = useState<ShadowValues>({ x: 0, y: 4, blur: 12, spread: 0, color: 'rgba(0,0,0,0.12)' })
  const [transform, setTransform] = useState<TransformValues>({
    rotate: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
  })
  const [fillMode, setFillMode] = useState<'solid' | 'gradient'>('solid')
  const [gradAngle, setGradAngle] = useState(135)
  const [gradFrom, setGradFrom] = useState('#6366f1')
  const [gradTo, setGradTo] = useState('#a855f7')

  useEffect(() => {
    if (!target) return
    setStyles(target.styles)
    const parsedGrad = parseLinearGradient(target.styles.backgroundImage)
    if (parsedGrad) {
      setFillMode('gradient')
      setGradAngle(parsedGrad.angle)
      setGradFrom(parsedGrad.from)
      setGradTo(parsedGrad.to)
    } else {
      setFillMode('solid')
    }
    const r = parseInt(String(target.styles.borderRadius ?? '0').replace('px', ''), 10)
    setRadius(Number.isFinite(r) ? r : 0)
    setFontSize(parseFontSize(target.styles.fontSize))
    setShadow(parseBoxShadow(target.styles.boxShadow))
    setTransform(parseTransform(target.styles.transform))
  }, [target?.id, target?.styles, editViewport])

  if (!target) return null

  const vp = VIEWPORT_META[editViewport]
  const VpIcon = vp.icon

  const commit = (next: ElementStyles) => {
    setStyles(next)
    onApplyStyles(target.id, next)
  }

  const commitShadow = (next: ShadowValues) => {
    setShadow(next)
    commit({ ...styles, boxShadow: buildBoxShadow(next) })
  }

  const commitTransform = (next: TransformValues) => {
    setTransform(next)
    commit({ ...styles, transform: buildTransform(next) })
  }

  const shellClass = cn(
    'flex flex-col bg-[#09090b] select-none',
    embedded
      ? 'w-full'
      : 'fixed top-4 left-4 z-[100] w-72 rounded-2xl border border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-hidden',
  )

  return (
    <div className={shellClass}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Paintbrush className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200 leading-none">
              Appearance
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">{target.label}</span>
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

      <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1 rounded-md bg-zinc-950 border border-zinc-800 shadow-sm', vp.color)}>
            <VpIcon className="h-3 w-3" />
          </div>
          <span className="text-[10px] font-bold text-zinc-300">{vp.label}</span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
          {vp.hint}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Fill type</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['solid', 'gradient'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    'px-2 py-1.5 rounded-md text-[10px] font-bold border capitalize transition-all',
                    fillMode === mode
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                  )}
                  onClick={() => {
                    setFillMode(mode)
                    if (mode === 'solid') {
                      commit({ ...styles, backgroundImage: '', backgroundColor: styles.backgroundColor || '#6366f1' })
                    } else {
                      const gradient = buildLinearGradient(gradAngle, gradFrom, gradTo)
                      commit({ ...styles, backgroundImage: gradient, backgroundColor: '' })
                    }
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {fillMode === 'solid' ? (
            <div className="flex gap-3">
              <ColorField
                label="Background"
                value={styles.backgroundColor ?? ''}
                onChange={(v) => commit({ ...styles, backgroundImage: '', backgroundColor: v })}
              />
              <ColorField
                label="Text"
                value={styles.color ?? ''}
                onChange={(v) => commit({ ...styles, color: v })}
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              <SliderField
                label="Gradient angle"
                value={gradAngle}
                min={0}
                max={360}
                step={1}
                unit="°"
                onChange={(v) => {
                  setGradAngle(v)
                  commit({
                    ...styles,
                    backgroundColor: '',
                    backgroundImage: buildLinearGradient(v, gradFrom, gradTo),
                  })
                }}
              />
              <div className="flex gap-3">
                <ColorField
                  label="From"
                  value={gradFrom}
                  onChange={(v) => {
                    setGradFrom(v)
                    commit({
                      ...styles,
                      backgroundColor: '',
                      backgroundImage: buildLinearGradient(gradAngle, v, gradTo),
                    })
                  }}
                />
                <ColorField
                  label="To"
                  value={gradTo}
                  onChange={(v) => {
                    setGradTo(v)
                    commit({
                      ...styles,
                      backgroundColor: '',
                      backgroundImage: buildLinearGradient(gradAngle, gradFrom, v),
                    })
                  }}
                />
              </div>
              <div
                className="h-10 rounded-lg border border-zinc-800"
                style={{ backgroundImage: buildLinearGradient(gradAngle, gradFrom, gradTo) }}
              />
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-zinc-500 uppercase">Presets</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      title={preset.label}
                      className="h-7 rounded-md border border-zinc-800 hover:border-violet-500/50 transition-colors"
                      style={{
                        backgroundImage: buildLinearGradient(preset.angle, preset.from, preset.to),
                      }}
                      onClick={() => {
                        setGradAngle(preset.angle)
                        setGradFrom(preset.from)
                        setGradTo(preset.to)
                        commit({
                          ...styles,
                          backgroundColor: '',
                          backgroundImage: buildLinearGradient(preset.angle, preset.from, preset.to),
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
              <ColorField
                label="Text"
                value={styles.color ?? ''}
                onChange={(v) => commit({ ...styles, color: v })}
              />
            </div>
          )}
          <ColorField
            label="Border Stroke"
            value={styles.borderColor ?? ''}
            onChange={(v) => commit({ ...styles, borderColor: v })}
          />
        </div>

        <SliderField
          label="Corner Radius"
          value={radius}
          min={0}
          max={48}
          step={1}
          unit="px"
          onChange={(v) => {
            setRadius(v)
            commit({ ...styles, borderRadius: v ? `${v}px` : '' })
          }}
        />

        {/* Typography */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
            <Type className="h-3 w-3" /> Typography
          </p>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Font family</Label>
            <Select
              value={parseFontFamily(styles.fontFamily) || 'inherit'}
              onValueChange={(v) =>
                commit({ ...styles, fontFamily: v === 'inherit' ? '' : v })
              }
            >
              <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Default (inherit)</SelectItem>
                {FONT_FAMILY_PRESETS.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SliderField
            label="Font size"
            value={fontSize}
            min={10}
            max={72}
            step={1}
            unit="px"
            onChange={(v) => {
              setFontSize(v)
              commit({ ...styles, fontSize: v ? `${v}px` : '' })
            }}
          />
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Font weight</Label>
            <Select
              value={styles.fontWeight || '400'}
              onValueChange={(v) => commit({ ...styles, fontWeight: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
            <Box className="h-3 w-3" /> Shadow
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SHADOW_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  'px-2 py-1 rounded-md text-[9px] font-bold border transition-all',
                  (styles.boxShadow ?? '') === preset.value
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                )}
                onClick={() => {
                  setShadow(parseBoxShadow(preset.value))
                  commit({ ...styles, boxShadow: preset.value })
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <SliderField label="Offset X" value={shadow.x} min={-40} max={40} step={1} unit="px" onChange={(v) => commitShadow({ ...shadow, x: v })} />
          <SliderField label="Offset Y" value={shadow.y} min={-40} max={40} step={1} unit="px" onChange={(v) => commitShadow({ ...shadow, y: v })} />
          <SliderField label="Blur" value={shadow.blur} min={0} max={64} step={1} unit="px" onChange={(v) => commitShadow({ ...shadow, blur: v })} />
          <SliderField label="Spread" value={shadow.spread} min={-20} max={40} step={1} unit="px" onChange={(v) => commitShadow({ ...shadow, spread: v })} />
          <ColorField label="Shadow Color" value={shadow.color.startsWith('rgba') ? '#000000' : shadow.color} onChange={(v) => commitShadow({ ...shadow, color: v ? `${v}99` : 'rgba(0,0,0,0.15)' })} />
        </div>

        {/* Transform */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
            <Move3d className="h-3 w-3" /> Transform
          </p>
          <SliderField label="Rotate" value={transform.rotate} min={-180} max={180} step={1} unit="°" onChange={(v) => commitTransform({ ...transform, rotate: v })} />
          <SliderField label="Scale" value={Math.round(transform.scale * 100)} min={50} max={200} step={1} unit="%" onChange={(v) => commitTransform({ ...transform, scale: v / 100 })} />
          <SliderField label="Move X" value={transform.translateX} min={-120} max={120} step={1} unit="px" onChange={(v) => commitTransform({ ...transform, translateX: v })} />
          <SliderField label="Move Y" value={transform.translateY} min={-120} max={120} step={1} unit="px" onChange={(v) => commitTransform({ ...transform, translateY: v })} />
        </div>

        {/* Animation */}
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
            <Sparkles className="h-3 w-3" /> Animation
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {ANIMATION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  'px-2 py-2 rounded-lg text-[9px] font-bold border transition-all text-left',
                  (styles.animation ?? '') === preset.value
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                )}
                onClick={() => commit({ ...styles, animation: preset.value })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

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

      <div className="p-4 mt-auto border-t border-zinc-800/50 bg-zinc-950/30">
        <Button
          type="button"
          variant="ghost"
          className="w-full h-9 text-[10px] font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-400/5 transition-all gap-2"
          onClick={() => {
            setRadius(0)
            setShadow(parseBoxShadow(''))
            setTransform(parseTransform(''))
            commit({
              backgroundColor: '',
              backgroundImage: '',
              color: '',
              borderColor: '',
              borderRadius: '',
              boxShadow: '',
              transform: '',
              animation: '',
              fontFamily: '',
              fontSize: '',
              fontWeight: '',
            })
          }}
        >
          <RotateCcw className="h-3 w-3" />
          Reset {vp.label} Styles
        </Button>
      </div>
    </div>
  )
}
