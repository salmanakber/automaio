'use client'

import { useEffect, useState } from 'react'
import { FileInput, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { SectionSelection } from '@/components/projects/EditorSectionPanel'

type LeadFormOption = { id: string; name: string; embedToken: string }

type EditorLeadFormPanelProps = {
  section: SectionSelection
  orgId: string
  embedded?: boolean
  onUpdate: (config: {
    formToken?: string
    formInputWidth?: number
    formInputPadding?: number
    formRadius?: number
    formPrimary?: string
  }) => void
}

export function EditorLeadFormPanel({ section, orgId, onUpdate }: EditorLeadFormPanelProps) {
  const [forms, setForms] = useState<LeadFormOption[]>([])
  const [loading, setLoading] = useState(true)
  const [formToken, setFormToken] = useState(section.formToken ?? '')
  const [inputWidth, setInputWidth] = useState(parseInt(section.formInputWidth ?? '100', 10) || 100)
  const [inputPadding, setInputPadding] = useState(parseInt(section.formInputPadding ?? '12', 10) || 12)
  const [radius, setRadius] = useState(parseInt(section.formRadius ?? '10', 10) || 10)
  const [primary, setPrimary] = useState(section.formPrimary ?? '#6366f1')

  useEffect(() => {
    setFormToken(section.formToken ?? '')
    setInputWidth(parseInt(section.formInputWidth ?? '100', 10) || 100)
    setInputPadding(parseInt(section.formInputPadding ?? '12', 10) || 12)
    setRadius(parseInt(section.formRadius ?? '10', 10) || 10)
    setPrimary(section.formPrimary ?? '#6366f1')
  }, [
    section.id,
    section.formToken,
    section.formInputWidth,
    section.formInputPadding,
    section.formRadius,
    section.formPrimary,
  ])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/forms?orgId=${orgId}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setForms((d.forms ?? []).map((f: LeadFormOption) => ({ id: f.id, name: f.name, embedToken: f.embedToken }))))
      .finally(() => setLoading(false))
  }, [orgId])

  const push = (patch: Partial<{
    formToken: string
    formInputWidth: number
    formInputPadding: number
    formRadius: number
    formPrimary: string
  }>) => {
    onUpdate({
      formToken: patch.formToken ?? formToken,
      formInputWidth: patch.formInputWidth ?? inputWidth,
      formInputPadding: patch.formInputPadding ?? inputPadding,
      formRadius: patch.formRadius ?? radius,
      formPrimary: patch.formPrimary ?? primary,
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileInput className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Lead form</span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Choose a form to embed. The preview updates live on the canvas.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading forms…
        </div>
      ) : forms.length === 0 ? (
        <p className="text-xs text-amber-400/90">
          No lead forms yet. Create one under Lead Forms in the dashboard.
        </p>
      ) : (
        <div className="space-y-2">
          <Label className="text-[9px] text-zinc-500 uppercase">Form</Label>
          <Select
            value={formToken || undefined}
            onValueChange={(token) => {
              setFormToken(token)
              push({ formToken: token })
            }}
          >
            <SelectTrigger className="h-8 bg-zinc-950 border-zinc-800 text-xs">
              <SelectValue placeholder="Select form…" />
            </SelectTrigger>
            <SelectContent>
              {forms.map((f) => (
                <SelectItem key={f.id} value={f.embedToken}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-[9px] text-zinc-500 uppercase">Input width</Label>
          <span className="text-[9px] text-violet-400 font-mono">{inputWidth}%</span>
        </div>
        <Slider
          min={40}
          max={100}
          step={5}
          value={[inputWidth]}
          onValueChange={([v]) => {
            setInputWidth(v)
            push({ formInputWidth: v })
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-[9px] text-zinc-500 uppercase">Input padding</Label>
          <span className="text-[9px] text-violet-400 font-mono">{inputPadding}px</span>
        </div>
        <Slider
          min={6}
          max={24}
          step={2}
          value={[inputPadding]}
          onValueChange={([v]) => {
            setInputPadding(v)
            push({ formInputPadding: v })
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-[9px] text-zinc-500 uppercase">Corner radius</Label>
          <span className="text-[9px] text-violet-400 font-mono">{radius}px</span>
        </div>
        <Slider
          min={0}
          max={24}
          step={2}
          value={[radius]}
          onValueChange={([v]) => {
            setRadius(v)
            push({ formRadius: v })
          }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[9px] text-zinc-500 uppercase">Button color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={primary.startsWith('#') ? primary : '#6366f1'}
            onChange={(e) => {
              setPrimary(e.target.value)
              push({ formPrimary: e.target.value })
            }}
            className="h-8 w-12 p-1 bg-zinc-950 border-zinc-800 cursor-pointer"
          />
          <Input
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            onBlur={() => push({ formPrimary: primary })}
            className="h-8 flex-1 bg-zinc-950 border-zinc-800 text-xs font-mono"
          />
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full h-8 text-[10px] border-zinc-700"
        disabled={!formToken}
        onClick={() => push({})}
      >
        Refresh preview
      </Button>
    </div>
  )
}
