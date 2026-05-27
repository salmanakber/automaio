'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_TEMPLATE_THEME,
  type TemplateTheme,
} from '@/lib/templates/theme'
import { resolvePreviewSample } from '@/lib/templates/preview'

type PreviewCopyFieldsProps = {
  html: string
  previewSample: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

export function PreviewCopyFields({ html, previewSample, onChange }: PreviewCopyFieldsProps) {
  const tokens = [...new Set([...html.matchAll(/\{\{[^}]+\}\}/g)].map((m) => m[0]))]
  if (tokens.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Add placeholders like <code>{'{{headline}}'}</code> in your HTML to edit preview copy.
      </p>
    )
  }

  const defaults = resolvePreviewSample({ html })

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Preview copy</p>
        <p className="text-xs text-muted-foreground mt-1">
          Shown in the template library and picker only. Stored HTML keeps{' '}
          <code>{'{{placeholders}}'}</code> for campaigns and Webflow.
        </p>
      </div>
      {tokens.map((token) => (
        <div key={token} className="space-y-1">
          <Label className="font-mono text-xs">{token}</Label>
          <Input
            value={previewSample[token] ?? ''}
            onChange={(e) => onChange({ ...previewSample, [token]: e.target.value })}
            placeholder={defaults[token]}
          />
        </div>
      ))}
    </div>
  )
}

const THEME_FIELDS: { key: keyof TemplateTheme; label: string }[] = [
  { key: 'primary', label: 'Primary (buttons)' },
  { key: 'primaryText', label: 'Primary text' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentText', label: 'Accent text' },
  { key: 'background', label: 'Page background' },
  { key: 'text', label: 'Body text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'border', label: 'Borders' },
  { key: 'badgeBackground', label: 'Badge background' },
  { key: 'badgeText', label: 'Badge text' },
]

type WebflowThemeFieldsProps = {
  theme: TemplateTheme
  onChange: (next: TemplateTheme) => void
}

export function WebflowThemeFields({ theme, onChange }: WebflowThemeFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Webflow brand colors</p>
        <p className="text-xs text-muted-foreground mt-1">
          Applied when publishing to Webflow CMS. Uses CSS variables (
          <code className="text-[10px]">--automaio-primary</code>, etc.). Starter templates use
          classes <code className="text-[10px]">.cta</code>, <code className="text-[10px]">.badge</code>
          ; in custom HTML use{' '}
          <code className="text-[10px]">var(--automaio-primary)</code> in your styles.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border bg-background p-0.5"
              />
              <Input
                value={theme[key]}
                onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
                className="font-mono text-xs h-9"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_TEMPLATE_THEME })}
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Reset colors to default
      </button>
    </div>
  )
}
