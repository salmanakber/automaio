'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Wand2, Type, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react'

export function SidebarProperties({ element, projectId, onClose }: any) {
  if (!element) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
        <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center mb-4">
          <Type className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase font-bold tracking-widest text-zinc-500">Select an element</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {element.kind === 'image' ? <ImageIcon className="h-4 w-4 text-blue-500" /> : <Type className="h-4 w-4 text-blue-500" />}
          <span className="text-[10px] font-black uppercase tracking-widest">Inspector</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg">&times;</button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* AI Action Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border border-blue-500/20 space-y-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-[11px] font-bold text-white uppercase italic">AI Refinement</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Automatically rewrite or enhance this {element.tag} tag.
          </p>
          <div className="space-y-2 pt-1">
            <Input 
              placeholder="e.g. Make it more exciting..." 
              className="h-7 text-[10px] bg-black/40 border-zinc-700 text-white placeholder:text-zinc-600" 
            />
            <Button size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-wider">
              Apply AI Edit
            </Button>
          </div>
        </div>

        {/* Content Properties */}
        <div className="space-y-4 pt-2">
          {element.kind === 'text' && (
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold">Element Text</Label>
              <Textarea 
                value={element.text} 
                className="bg-zinc-950 border-zinc-800 text-xs min-h-[150px] focus:ring-blue-500 leading-relaxed" 
              />
            </div>
          )}

          {element.kind === 'image' && (
            <>
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold">Source URL</Label>
                <div className="flex gap-2">
                  <Input value={element.src} className="bg-zinc-950 border-zinc-800 h-8 text-[10px]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold">Alt Text</Label>
                <Input value={element.alt} className="bg-zinc-950 border-zinc-800 h-8 text-[10px]" />
              </div>
            </>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
             <span className="text-[10px] text-zinc-500 uppercase font-bold">HTML Tag</span>
             <code className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-blue-400 font-mono">
               &lt;{element.tag}&gt;
             </code>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-800 bg-zinc-950/50 flex gap-2">
        <Button variant="outline" className="flex-1 h-8 text-[10px] uppercase font-bold border-zinc-800 bg-transparent text-zinc-400 hover:text-white">
          Reset
        </Button>
        <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}