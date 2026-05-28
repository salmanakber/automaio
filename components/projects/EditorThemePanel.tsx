'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Palette } from 'lucide-react'
import {
  DEFAULT_TEMPLATE_THEME,
  type TemplateTheme,
} from '@/lib/templates/theme'

const THEME_FIELDS: { key: keyof TemplateTheme; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'primaryText', label: 'Primary text' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentText', label: 'Accent text' },
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Body text' },
  { key: 'muted', label: 'Muted' },
  { key: 'border', label: 'Border' },
  { key: 'badgeBackground', label: 'Badge bg' },
  { key: 'badgeText', label: 'Badge text' },
]

type EditorThemePanelProps = {
  theme: TemplateTheme
  onChange: (theme: TemplateTheme) => void
  onApply: () => void
}

export function EditorThemePanel({ theme, onChange, onApply }: EditorThemePanelProps) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-violet-400" />
          Brand colors
        </p>
        <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={onApply}>
          Apply to page
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {THEME_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-[9px] text-zinc-500 uppercase">{label}</Label>
            <div className="flex gap-1">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-zinc-700 bg-zinc-950 p-0.5 shrink-0"
              />
              <Input
                value={theme[key]}
                onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
                className="h-7 font-mono text-[10px] bg-zinc-950 border-zinc-800 px-1.5"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_TEMPLATE_THEME })}
        className="text-[10px] text-zinc-500 underline hover:text-zinc-300"
      >
        Reset to default
      </button>
    </div>
  )
}
