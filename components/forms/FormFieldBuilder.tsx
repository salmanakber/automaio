'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { FormField } from '@/app/api/forms/route'

const FIELD_TYPES: FormField['type'][] = [
  'text',
  'email',
  'phone',
  'textarea',
  'select',
  'checkbox',
  'number',
  'date',
  'url',
]

type FormFieldBuilderProps = {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}

function newField(): FormField {
  const id = 'field_' + Math.random().toString(36).slice(2, 8)
  return { id, label: 'New field', type: 'text', required: false, placeholder: '' }
}

export function FormFieldBuilder({ fields, onChange }: FormFieldBuilderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const updateField = (index: number, patch: Partial<FormField>) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    onChange(next)
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return
    const next = [...fields]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return
    moveField(dragIndex, targetIndex)
    setDragIndex(null)
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(index)}
          className={`rounded-lg border bg-card p-4 space-y-3 transition-opacity ${
            dragIndex === index ? 'opacity-50 border-primary' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="size-4 text-muted-foreground cursor-grab shrink-0" />
            <Badge variant="outline" className="text-xs capitalize">{field.type}</Badge>
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveField(index, index - 1)} disabled={index === 0}>
              <ChevronUp className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => moveField(index, index + 1)} disabled={index === fields.length - 1}>
              <ChevronDown className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeField(index)}>
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Field type</Label>
              <Select
                value={field.type}
                onValueChange={(v) => updateField(index, { type: v as FormField['type'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder ?? ''}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Field ID (API key)</Label>
              <Input
                value={field.id}
                onChange={(e) =>
                  updateField(index, {
                    id: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
                  })
                }
                className="font-mono text-xs"
              />
            </div>
          </div>

          {field.type === 'select' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Options (comma-separated)</Label>
              <Input
                value={(field.options ?? []).join(', ')}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="Option A, Option B"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(field.required)}
              onCheckedChange={(checked) => updateField(index, { required: checked })}
              id={`req-${field.id}`}
            />
            <Label htmlFor={`req-${field.id}`} className="text-xs">Required field</Label>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={() => onChange([...fields, newField()])}>
        <Plus className="size-4 mr-2" />
        Add field
      </Button>
    </div>
  )
}
