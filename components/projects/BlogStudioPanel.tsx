'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type BlogStudioPanelProps = {
  project: Record<string, unknown> & { parameters?: Record<string, string> }
  projectId: string
  onUpdate: (p: Record<string, unknown>) => void
}

export function BlogStudioPanel({ project, projectId, onUpdate }: BlogStudioPanelProps) {
  const params = project.parameters ?? {}
  const [body, setBody] = useState(params.body ?? '')
  const [aiPrompt, setAiPrompt] = useState('')
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState('')

  const persistBody = (html: string) => {
    setBody(html)
    onUpdate({
      ...project,
      parameters: { ...params, body: html },
    })
  }

  const handleAiEnhance = async () => {
    setEnhancing(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/enhance-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, prompt: aiPrompt || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI enhancement failed')
      persistBody(data.body)
      setAiPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed')
    } finally {
      setEnhancing(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Blog article</p>
            <p className="text-xs text-zinc-500">Rich text editor — AI can rewrite and improve your draft.</p>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-500"
            onClick={handleAiEnhance}
            disabled={enhancing || !body.trim()}
          >
            {enhancing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI enhance article
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            Optional AI direction
          </Label>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Make it more conversational, add a stronger intro, optimize for SEO…"
            className="min-h-[60px] bg-zinc-950 border-zinc-800 text-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <RichTextEditor
        value={body}
        onChange={persistBody}
        placeholder="Write your blog post…"
        minHeight={480}
        className="border-zinc-800 bg-zinc-950"
      />
    </div>
  )
}
