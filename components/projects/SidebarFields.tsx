'use client'

import { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Info, Megaphone, Globe, Search, FileUp, Loader2, Sparkles } from 'lucide-react'

type SidebarFieldsProps = {
  project: Record<string, unknown> & {
    parameters?: Record<string, string>
    contentType?: string
    renderedHtml?: string
  }
  onUpdate: (p: Record<string, unknown>) => void
  onImportHtml: (html: string) => void
  onGenerateSeo: () => Promise<void>
  seoGenerating?: boolean
  compact?: boolean
}

export function SidebarFields({
  project,
  onUpdate,
  onImportHtml,
  onGenerateSeo,
  seoGenerating,
  compact = false,
}: SidebarFieldsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importText, setImportText] = useState('')

  if (!project) return null

  const params = project.parameters ?? {}
  const isBlog = project.contentType === 'blog_post'
  const showSeo = isBlog || project.contentType !== 'email'

  const updateParam = (key: string, value: string) => {
    onUpdate({
      ...project,
      parameters: { ...params, [key]: value },
    })
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const html = String(reader.result ?? '')
      onImportHtml(html)
      setImportText('')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={compact ? 'flex flex-col' : 'flex flex-col h-full bg-[#09090b]'}>
      <Accordion type="multiple" defaultValue={['messaging', 'brand', 'seo']} className="w-full">
        <AccordionItem value="messaging" className={compact ? 'border-zinc-800 border-x-0' : 'border-zinc-800 px-4'}>
          <AccordionTrigger className={compact ? 'hover:no-underline py-3 px-0' : 'hover:no-underline py-4'}>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Messaging</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase">Main Headline</Label>
              <Input
                value={params.headline || ''}
                onChange={(e) => updateParam('headline', e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-8 text-xs focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase">Call to Action</Label>
              <Input
                value={params.ctaText || ''}
                onChange={(e) => updateParam('ctaText', e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-8 text-xs focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase">Body Copy</Label>
              <Textarea
                value={params.body || ''}
                onChange={(e) => updateParam('body', e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-xs min-h-[100px] resize-none"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand" className={compact ? 'border-zinc-800 border-x-0' : 'border-zinc-800 px-4'}>
          <AccordionTrigger className={compact ? 'hover:no-underline py-3 px-0' : 'hover:no-underline py-4'}>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Context</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase">Company Name</Label>
              <Input
                value={params.companyName || ''}
                onChange={(e) => updateParam('companyName', e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-8 text-xs font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase">Target Audience</Label>
              <Input
                value={params.audience || ''}
                onChange={(e) => updateParam('audience', e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-8 text-xs"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {showSeo && (
          <AccordionItem value="seo" className={compact ? 'border-zinc-800 border-x-0' : 'border-zinc-800 px-4'}>
            <AccordionTrigger className={compact ? 'hover:no-underline py-3 px-0' : 'hover:no-underline py-4'}>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">SEO</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-6">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full h-8 text-[10px] border-zinc-700 bg-zinc-900 gap-2"
                onClick={onGenerateSeo}
                disabled={seoGenerating}
              >
                {seoGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 text-violet-400" />
                )}
                Auto-generate from summary
              </Button>
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase">Meta Title</Label>
                <Input
                  value={params.seoTitle || ''}
                  onChange={(e) => updateParam('seoTitle', e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-8 text-xs"
                  placeholder="Max 60 characters"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase">Meta Description</Label>
                <Textarea
                  value={params.seoDescription || ''}
                  onChange={(e) => updateParam('seoDescription', e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs min-h-[72px] resize-none"
                  placeholder="Max 155 characters"
                />
              </div>
              <Separator className="bg-zinc-800" />
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase">OG Title</Label>
                <Input
                  value={params.ogTitle || ''}
                  onChange={(e) => updateParam('ogTitle', e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase">OG Description</Label>
                <Textarea
                  value={params.ogDescription || ''}
                  onChange={(e) => updateParam('ogDescription', e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs min-h-[60px] resize-none"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {!isBlog && (
          <AccordionItem value="import" className={compact ? 'border-zinc-800 border-x-0' : 'border-zinc-800 px-4'}>
            <AccordionTrigger className={compact ? 'hover:no-underline py-3 px-0' : 'hover:no-underline py-4'}>
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Import Template</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-6">
              <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={handleFile} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-[10px] border-zinc-700 bg-zinc-900"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-3 w-3 mr-2" /> Upload HTML file
              </Button>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Or paste HTML here…"
                className="bg-zinc-950 border-zinc-800 text-[10px] font-mono min-h-[100px] resize-none"
              />
              <Button
                type="button"
                size="sm"
                className="w-full h-8 text-[10px] bg-amber-600 hover:bg-amber-500"
                disabled={!importText.trim()}
                onClick={() => {
                  onImportHtml(importText.trim())
                  setImportText('')
                }}
              >
                Apply pasted HTML
              </Button>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {!compact && (
      <div className="mt-auto p-4 bg-zinc-900/30 border-t border-zinc-800">
        <div className="flex items-start gap-2 text-[10px] text-zinc-500 leading-relaxed">
          <Info className="h-3 w-3 mt-0.5 shrink-0 text-blue-500" />
          <p>Click any element on the canvas to edit. SEO syncs to Webflow on publish.</p>
        </div>
      </div>
      )}
    </div>
  )
}
