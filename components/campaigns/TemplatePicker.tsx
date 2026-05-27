'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TemplateStructure } from '@/lib/templates/starter-templates'
import { renderStructurePreview } from '@/lib/templates/preview'

export type TemplateOption = {
  id: string
  name: string
  industry: string
  description: string | null
  templateStructure: TemplateStructure
}

interface TemplatePickerProps {
  selectedId?: string
  onSelect?: (template: TemplateOption) => void
  industryFilter?: string
  categoryFilter?: 'landing' | 'email' | 'promo'
  search?: string
  mode?: 'picker' | 'gallery'
  onUseTemplate?: (template: TemplateOption) => void
}

export function TemplatePicker({
  selectedId,
  onSelect,
  industryFilter,
  categoryFilter,
  search = '',
  mode = 'picker',
  onUseTemplate,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = templates
    if (categoryFilter) {
      list = list.filter((t) => t.templateStructure?.category === categoryFilter)
    }
    if (industryFilter) {
      list = list.filter(
        (t) =>
          t.industry.toLowerCase() === industryFilter.toLowerCase() ||
          t.industry === 'Local',
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.industry.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false),
      )
    }
    return list
  }, [templates, industryFilter, categoryFilter, search])

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading templates…</p>
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No templates found. Try a different search or run the database seed.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((template) => {
        const previewDoc = renderStructurePreview(template.templateStructure)
        const selected = selectedId === template.id

        if (mode === 'gallery') {
          return (
            <Card key={template.id} className="overflow-hidden h-full flex flex-col">
              <div className="h-40 border-b bg-white overflow-hidden">
                <iframe
                  title={`Preview ${template.name}`}
                  className="pointer-events-none w-[200%] h-[200%] origin-top-left scale-50"
                  srcDoc={previewDoc}
                  sandbox="allow-same-origin"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.industry}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 mt-auto">
                <Button className="w-full" size="sm" onClick={() => onUseTemplate?.(template)}>
                  Use this template
                </Button>
              </CardContent>
            </Card>
          )
        }

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect?.(template)}
            className="text-left"
          >
            <Card
              className={cn(
                'overflow-hidden transition-colors h-full',
                selected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40',
              )}
            >
              <div className="h-36 border-b bg-white overflow-hidden">
                <iframe
                  title={`Preview ${template.name}`}
                  className="pointer-events-none w-[200%] h-[200%] origin-top-left scale-50"
                  srcDoc={previewDoc}
                  sandbox="allow-same-origin"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.industry}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Theme layout + brand colors · AI writes your copy at launch
                </p>
              </CardContent>
            </Card>
          </button>
        )
      })}
    </div>
  )
}
