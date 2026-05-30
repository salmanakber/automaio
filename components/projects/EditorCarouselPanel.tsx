'use client'

import { useEffect, useState } from 'react'
import { GalleryHorizontal, Shapes, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import type { SectionSelection } from '@/components/projects/EditorSectionPanel'
import { IconPickerDialog, IconPreviewBadge } from '@/components/projects/IconPickerDialog'
import {
  DEFAULT_CAROUSEL_NEXT,
  DEFAULT_CAROUSEL_PREV,
} from '@/lib/editor/icon-catalog'

export type CarouselSettings = {
  prevIcon: string
  nextIcon: string
  iconSize: number
  iconColor: string
  navBg: string
  navSize: number
  autoplay: boolean
  hideArrows: boolean
  hideDots: boolean
}

type EditorCarouselPanelProps = {
  section: SectionSelection
  embedded?: boolean
  onUpdate: (settings: Partial<CarouselSettings>) => void
}

export function EditorCarouselPanel({ section, onUpdate }: EditorCarouselPanelProps) {
  const [prevIcon, setPrevIcon] = useState(DEFAULT_CAROUSEL_PREV)
  const [nextIcon, setNextIcon] = useState(DEFAULT_CAROUSEL_NEXT)
  const [iconSize, setIconSize] = useState(20)
  const [iconColor, setIconColor] = useState('#0f172a')
  const [navBg, setNavBg] = useState('rgba(255,255,255,0.95)')
  const [navSize, setNavSize] = useState(42)
  const [autoplay, setAutoplay] = useState(true)
  const [hideArrows, setHideArrows] = useState(false)
  const [hideDots, setHideDots] = useState(false)
  const [picker, setPicker] = useState<'prev' | 'next' | null>(null)

  useEffect(() => {
    setPrevIcon(section.carouselPrevIcon ?? DEFAULT_CAROUSEL_PREV)
    setNextIcon(section.carouselNextIcon ?? DEFAULT_CAROUSEL_NEXT)
    setIconSize(section.carouselIconSize ?? 20)
    setIconColor(section.carouselIconColor ?? '#0f172a')
    setNavBg(section.carouselNavBg ?? 'rgba(255,255,255,0.95)')
    setNavSize(section.carouselNavSize ?? 42)
    setAutoplay(section.carouselAutoplay !== false)
    setHideArrows(Boolean(section.carouselHideArrows))
    setHideDots(Boolean(section.carouselHideDots))
  }, [
    section.id,
    section.carouselPrevIcon,
    section.carouselNextIcon,
    section.carouselIconSize,
    section.carouselIconColor,
    section.carouselNavBg,
    section.carouselNavSize,
    section.carouselAutoplay,
    section.carouselHideArrows,
    section.carouselHideDots,
  ])

  const push = (patch: Partial<CarouselSettings>) => onUpdate(patch)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <GalleryHorizontal className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
          Slider controls
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Previous icon sits on the left, next icon on the right — auto-aligned in the slider nav bar.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <Label className="text-[9px] text-zinc-500 uppercase">Previous (left)</Label>
          <div className="flex items-center gap-2">
            <IconPreviewBadge iconRef={prevIcon} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-[10px] gap-1 border-zinc-700"
              onClick={() => setPicker('prev')}
            >
              <Shapes className="h-3 w-3" /> Choose
            </Button>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <Label className="text-[9px] text-zinc-500 uppercase">Next (right)</Label>
          <div className="flex items-center gap-2">
            <IconPreviewBadge iconRef={nextIcon} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-[10px] gap-1 border-zinc-700"
              onClick={() => setPicker('next')}
            >
              <Shapes className="h-3 w-3" /> Choose
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-[9px] text-zinc-500 uppercase">Icon size</Label>
          <span className="text-[9px] text-violet-400 font-mono">{iconSize}px</span>
        </div>
        <Slider
          min={12}
          max={36}
          step={1}
          value={[iconSize]}
          onValueChange={([v]) => {
            setIconSize(v)
            push({ iconSize: v })
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-[9px] text-zinc-500 uppercase">Button size</Label>
          <span className="text-[9px] text-violet-400 font-mono">{navSize}px</span>
        </div>
        <Slider
          min={32}
          max={64}
          step={2}
          value={[navSize]}
          onValueChange={([v]) => {
            setNavSize(v)
            push({ navSize: v })
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[9px] text-zinc-500 uppercase">Icon color</Label>
          <Input
            type="color"
            value={iconColor}
            onChange={(e) => {
              setIconColor(e.target.value)
              push({ iconColor: e.target.value })
            }}
            className="h-9 p-1 bg-zinc-950 border-zinc-800"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] text-zinc-500 uppercase">Button background</Label>
          <Input
            value={navBg}
            onChange={(e) => {
              setNavBg(e.target.value)
              push({ navBg: e.target.value })
            }}
            className="h-9 text-[10px] bg-zinc-950 border-zinc-800 font-mono"
            placeholder="rgba(255,255,255,0.95)"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-zinc-400">Autoplay</Label>
          <Switch
            checked={autoplay}
            onCheckedChange={(v) => {
              setAutoplay(v)
              push({ autoplay: v })
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-zinc-400 flex items-center gap-1">
            {hideArrows ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            Show arrows
          </Label>
          <Switch
            checked={!hideArrows}
            onCheckedChange={(v) => {
              setHideArrows(!v)
              push({ hideArrows: !v })
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-zinc-400">Show dots</Label>
          <Switch
            checked={!hideDots}
            onCheckedChange={(v) => {
              setHideDots(!v)
              push({ hideDots: !v })
            }}
          />
        </div>
      </div>

      <IconPickerDialog
        open={picker !== null}
        onOpenChange={(open) => !open && setPicker(null)}
        value={picker === 'prev' ? prevIcon : nextIcon}
        title={picker === 'prev' ? 'Previous slide icon' : 'Next slide icon'}
        onSelect={(ref) => {
          if (picker === 'prev') {
            setPrevIcon(ref)
            push({ prevIcon: ref })
          } else {
            setNextIcon(ref)
            push({ nextIcon: ref })
          }
          setPicker(null)
        }}
      />
    </div>
  )
}
