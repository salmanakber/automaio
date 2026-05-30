'use client'

import { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Info, Megaphone, Globe, Search, FileUp, 
  Loader2, Sparkles, ChevronRight, Hash, 
  MousePointer2, AlignLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className={cn(
      "flex flex-col w-full",
      !compact && "h-full bg-[#09090b]"
    )}>
      <Accordion type="multiple" defaultValue={['messaging', 'brand', 'seo']} className="w-full">
        
        {/* MESSAGING SECTION */}
        <AccordionItem value="messaging" className="border-zinc-800/60 px-1">
          <CustomTrigger icon={Megaphone} iconColor="text-blue-400" label="Messaging" />
          <AccordionContent className="space-y-4 pt-1 pb-6 px-3">
            <FieldWrapper label="Main Headline" icon={TypeIcon}>
              <Input
                value={params.headline || ''}
                onChange={(e) => updateParam('headline', e.target.value)}
                placeholder="Enter headline..."
                className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-blue-500/50 text-xs h-9"
              />
            </FieldWrapper>
            
            <FieldWrapper label="Call to Action" icon={MousePointer2}>
              <Input
                value={params.ctaText || ''}
                onChange={(e) => updateParam('ctaText', e.target.value)}
                placeholder="Button text..."
                className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-blue-500/50 text-xs h-9"
              />
            </FieldWrapper>

            <FieldWrapper label="Body Copy" icon={AlignLeft}>
              <Textarea
                value={params.body || ''}
                onChange={(e) => updateParam('body', e.target.value)}
                className="bg-zinc-950/50 border-zinc-800 text-xs min-h-[120px] resize-none focus-visible:ring-blue-500/50"
              />
            </FieldWrapper>
          </AccordionContent>
        </AccordionItem>

        {/* BRAND CONTEXT SECTION */}
        <AccordionItem value="brand" className="border-zinc-800/60 px-1">
          <CustomTrigger icon={Globe} iconColor="text-emerald-400" label="Context" />
          <AccordionContent className="space-y-4 pt-1 pb-6 px-3">
            <FieldWrapper label="Company Name">
              <Input
                value={params.companyName || ''}
                onChange={(e) => updateParam('companyName', e.target.value)}
                className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
              />
            </FieldWrapper>
            <FieldWrapper label="Target Audience">
              <Input
                value={params.audience || ''}
                onChange={(e) => updateParam('audience', e.target.value)}
                className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
              />
            </FieldWrapper>
          </AccordionContent>
        </AccordionItem>

        {/* SEO SECTION */}
        {showSeo && (
          <AccordionItem value="seo" className="border-zinc-800/60 px-1">
            <CustomTrigger icon={Search} iconColor="text-violet-400" label="SEO & Meta" />
            <AccordionContent className="space-y-5 pt-1 pb-6 px-3">
              {/* Magic Generate Button */}
              <Button
                type="button"
                variant="outline"
                className="group relative w-full h-10 text-[11px] font-semibold border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                onClick={onGenerateSeo}
                disabled={seoGenerating}
              >
                {seoGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-violet-400 mr-2 group-hover:animate-pulse" />
                )}
                Auto-generate Metadata
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>

              <div className="space-y-4">
                <FieldWrapper label="Meta Title" hint={`${(params.seoTitle || '').length}/60`}>
                  <Input
                    value={params.seoTitle || ''}
                    onChange={(e) => updateParam('seoTitle', e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
                    placeholder="Max 60 characters"
                  />
                </FieldWrapper>

                <FieldWrapper label="URL slug" icon={Hash}>
                  <Input
                    value={params.slug || ''}
                    onChange={(e) => updateParam('slug', e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 text-xs h-9 font-mono"
                    placeholder="my-landing-page"
                  />
                </FieldWrapper>

                <FieldWrapper label="Meta Description" hint={`${(params.seoDescription || '').length}/155`}>
                  <Textarea
                    value={params.seoDescription || ''}
                    onChange={(e) => updateParam('seoDescription', e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 text-xs min-h-[80px] resize-none"
                    placeholder="Brief summary for search results..."
                  />
                </FieldWrapper>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Separator className="flex-1 bg-zinc-800" />
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Social (OG)</span>
                  <Separator className="flex-1 bg-zinc-800" />
                </div>

                <div className="space-y-4">
                   <FieldWrapper label="OG Title">
                    <Input
                      value={params.ogTitle || ''}
                      onChange={(e) => updateParam('ogTitle', e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="OG Description">
                    <Textarea
                      value={params.ogDescription || ''}
                      onChange={(e) => updateParam('ogDescription', e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 text-xs min-h-[60px] resize-none"
                    />
                  </FieldWrapper>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* IMPORT SECTION */}
        {!isBlog && (
          <AccordionItem value="import" className="border-none px-1">
            <CustomTrigger icon={FileUp} iconColor="text-amber-500" label="Import Layout" />
            <AccordionContent className="space-y-3 pt-1 pb-6 px-3">
              <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={handleFile} />
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 text-[11px] border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5 mr-2 text-amber-500" /> Upload HTML file
              </Button>
              
              <div className="relative">
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Or paste code here…"
                  className="bg-zinc-950 border-zinc-800 text-[10px] font-mono min-h-[120px] resize-none pt-8"
                />
                <div className="absolute top-2 left-2 text-[9px] text-zinc-600 font-bold uppercase tracking-tighter pointer-events-none">
                  Code Buffer
                </div>
              </div>

              <Button
                type="button"
                className="w-full h-9 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/20"
                disabled={!importText.trim()}
                onClick={() => {
                  onImportHtml(importText.trim())
                  setImportText('')
                }}
              >
                Apply Custom Code
              </Button>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {!compact && (
        <div className="mt-auto p-4 bg-zinc-900/40 border-t border-zinc-800/60">
          <div className="flex gap-3 items-start p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-zinc-200 font-medium">Pro tip:</span> Changes to these fields update the AI's understanding of your page content automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Internal UI Sub-components ---

function CustomTrigger({ icon: Icon, iconColor, label }: any) {
  return (
    <AccordionTrigger className="hover:no-underline py-4 px-3 group">
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md bg-zinc-900/80 group-data-[state=open]:bg-zinc-800 transition-colors", iconColor)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
      </div>
    </AccordionTrigger>
  )
}

function FieldWrapper({ label, children, hint, icon: Icon }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight flex items-center gap-1.5">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </Label>
        {hint && <span className="text-[9px] text-zinc-600 font-mono">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function TypeIcon({ className }: { className?: string }) {
  return <Hash className={className} />
}