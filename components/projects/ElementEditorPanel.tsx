'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Type, Image as ImageIcon, Link as LinkIcon, Trash2, Code, Loader2 } from 'lucide-react'

export type SelectedElement = {
  id: string
  text: string
  tag: string
  kind?: 'text' | 'image' | 'code' | 'link'
  src?: string
  alt?: string
  href?: string
}

type ElementEditorPanelProps = {
  element: SelectedElement | null
  projectId: string
  onClose: () => void
  onUpdate: (msg: Record<string, unknown>) => void
  onDelete: (id: string) => void
}

export function ElementEditorPanel({
  element,
  projectId,
  onClose,
  onUpdate,
  onDelete,
}: ElementEditorPanelProps) {
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [localText, setLocalText] = useState('')
  const [localHref, setLocalHref] = useState('')
  const [localSrc, setLocalSrc] = useState('')
  const [localAlt, setLocalAlt] = useState('')
  const [localCode, setLocalCode] = useState('')

  useEffect(() => {
    if (!element) return
    setLocalText(element.text ?? '')
    setLocalHref(element.href ?? '')
    setLocalSrc(element.src ?? '')
    setLocalAlt(element.alt ?? '')
    setLocalCode(element.text ?? '')
    setAiPrompt('')
  }, [element?.id, element?.text, element?.href, element?.src, element?.alt, element?.kind])

  if (!element) return null

  const applyText = () => {
    onUpdate({ type: 'am-ai-result', id: element.id, text: localText })
  }

  const applyLink = () => {
    onUpdate({ type: 'am-link-update', id: element.id, href: localHref, text: localText })
  }

  const applyImage = () => {
    onUpdate({ type: 'am-image-update', id: element.id, src: localSrc, alt: localAlt })
  }

  const applyCode = () => {
    onUpdate({ type: 'am-code-update', id: element.id, text: localCode })
  }

  const runAi = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/ai-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: element.text, tag: element.tag, prompt: aiPrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setLocalText(data.text)
      onUpdate({ type: 'am-ai-result', id: element.id, text: data.text })
      setAiPrompt('')
    } finally {
      setAiLoading(false)
    }
  }

  const Icon =
    element.kind === 'image' ? ImageIcon : element.kind === 'link' ? LinkIcon : element.kind === 'code' ? Code : Type

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(520px,calc(100%-2rem))] rounded-xl border border-zinc-700 bg-[#0c0c0e]/95 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
            Edit &lt;{element.tag}&gt;
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none">
          &times;
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
        {(element.kind === 'text' || element.kind === 'link' || !element.kind) && (
          <div className="space-y-2">
            <Label className="text-[10px] text-zinc-500 uppercase font-bold">Text</Label>
            <Textarea
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-xs min-h-[80px]"
            />
          </div>
        )}

        {element.kind === 'link' && (
          <div className="space-y-2">
            <Label className="text-[10px] text-zinc-500 uppercase font-bold">Link URL</Label>
            <Input
              value={localHref}
              onChange={(e) => setLocalHref(e.target.value)}
              className="bg-zinc-950 border-zinc-800 h-8 text-xs"
              placeholder="https://"
            />
          </div>
        )}

        {element.kind === 'image' && (
          <>
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold">Image URL</Label>
              <Input
                value={localSrc}
                onChange={(e) => setLocalSrc(e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold">Alt text</Label>
              <Input
                value={localAlt}
                onChange={(e) => setLocalAlt(e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-8 text-xs"
              />
            </div>
          </>
        )}

        {element.kind === 'code' && (
          <div className="space-y-2">
            <Label className="text-[10px] text-zinc-500 uppercase font-bold">Code</Label>
            <Textarea
              value={localCode}
              onChange={(e) => setLocalCode(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-xs font-mono min-h-[100px]"
            />
          </div>
        )}

        {(element.kind === 'text' || element.kind === 'link' || !element.kind) && (
          <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-bold uppercase text-blue-300">AI enhance</span>
            </div>
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Make it more compelling…"
              className="h-7 text-[10px] bg-black/40 border-zinc-700"
            />
            <Button
              size="sm"
              className="w-full h-7 text-[10px] bg-blue-600"
              onClick={runAi}
              disabled={aiLoading || !aiPrompt.trim()}
            >
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply AI'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-zinc-800 bg-zinc-950/50">
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onDelete(element.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="flex-1 h-8 text-[10px] uppercase border-zinc-700" onClick={onClose}>
          Close
        </Button>
        <Button
          className="flex-1 h-8 text-[10px] uppercase bg-blue-600"
          onClick={() => {
            if (element.kind === 'image') applyImage()
            else if (element.kind === 'link') applyLink()
            else if (element.kind === 'code') applyCode()
            else applyText()
          }}
        >
          Apply changes
        </Button>
      </div>
    </div>
  )
}
