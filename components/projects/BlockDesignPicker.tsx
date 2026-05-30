'use client'

import { Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  getBlockVariants,
  supportsBlockVariants,
  type BlockVariantOption,
} from '@/lib/editor/block-variants'

type BlockDesignPickerProps = {
  widgetType: string
  value: string
  onChange: (variant: string) => void
  title?: string
}

function VariantCard({
  option,
  active,
  onSelect,
}: {
  option: BlockVariantOption
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'text-left rounded-lg border p-2.5 transition-all',
        active
          ? 'border-violet-500/60 bg-violet-500/10 ring-1 ring-violet-500/30'
          : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700',
      )}
    >
      <span
        className={cn(
          'text-[10px] font-bold block mb-0.5',
          active ? 'text-violet-300' : 'text-zinc-300',
        )}
      >
        {option.label}
      </span>
      <span className="text-[9px] text-zinc-500 leading-snug block">{option.description}</span>
    </button>
  )
}

export function BlockDesignPicker({
  widgetType,
  value,
  onChange,
  title = 'Design style',
}: BlockDesignPickerProps) {
  if (!supportsBlockVariants(widgetType)) return null
  const variants = getBlockVariants(widgetType)
  if (variants.length < 2) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
          {title}
        </Label>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {variants.map((opt) => (
          <VariantCard
            key={opt.id}
            option={opt}
            active={value === opt.id}
            onSelect={() => onChange(opt.id)}
          />
        ))}
      </div>
    </div>
  )
}
