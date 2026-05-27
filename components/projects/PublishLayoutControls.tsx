'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Layout } from 'lucide-react'
import { parseLayoutControls, DEFAULT_LAYOUT_CONTROLS } from '@/lib/webflow/layout-controls'
import type { LayoutControls } from '@/lib/ai/business-context-types'

type PublishLayoutControlsProps = {
  parameters: Record<string, unknown>
  onChange: (controls: LayoutControls) => void
  compact?: boolean
}

export function PublishLayoutControls({
  parameters,
  onChange,
  compact,
}: PublishLayoutControlsProps) {
  const controls = parseLayoutControls(parameters)

  const update = (key: keyof LayoutControls, value: boolean) => {
    onChange({ ...DEFAULT_LAYOUT_CONTROLS, ...controls, [key]: value })
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4'}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-2">
        <Layout className="h-3.5 w-3.5" />
        Layout on publish
      </p>
      <div className="space-y-3">
        <LayoutRow
          label="Show header"
          description="Include navigation / header from template"
          checked={Boolean(controls.showHeader)}
          onCheckedChange={(v) => update('showHeader', v)}
        />
        <LayoutRow
          label="Show footer"
          description="Include footer from template"
          checked={Boolean(controls.showFooter)}
          onCheckedChange={(v) => update('showFooter', v)}
        />
        <LayoutRow
          label="Full width"
          description="Remove container max-width constraints"
          checked={Boolean(controls.fullWidth)}
          onCheckedChange={(v) => update('fullWidth', v)}
        />
        <LayoutRow
          label="Remove container padding"
          description="Edge-to-edge layout on Webflow page"
          checked={Boolean(controls.removeContainerConstraints)}
          onCheckedChange={(v) => update('removeContainerConstraints', v)}
        />
      </div>
    </div>
  )
}

function LayoutRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5 min-w-0">
        <Label className="text-xs text-zinc-300">{label}</Label>
        <p className="text-[10px] text-zinc-500 leading-snug">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
