'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Link2, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content…',
  className,
  minHeight = 280,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValue = useRef(value)

  useEffect(() => {
    if (editorRef.current && value !== lastValue.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || ''
      lastValue.current = value
    }
  }, [value])

  const exec = useCallback(
    (command: string, val?: string) => {
      document.execCommand(command, false, val)
      editorRef.current?.focus()
      if (editorRef.current) {
        const html = editorRef.current.innerHTML
        lastValue.current = html
        onChange(html)
      }
    },
    [onChange],
  )

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      lastValue.current = html
      onChange(html)
    }
  }

  const addLink = () => {
    const url = window.prompt('Link URL')
    if (url) exec('createLink', url)
  }

  return (
    <div className={cn('rounded-lg border bg-background overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => exec('bold')} title="Bold">
          <Bold className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => exec('italic')} title="Italic">
          <Italic className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => exec('formatBlock', 'h2')} title="Heading">
          <Heading2 className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => exec('insertUnorderedList')} title="Bullet list">
          <List className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => exec('insertOrderedList')} title="Numbered list">
          <ListOrdered className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={addLink} title="Link">
          <Link2 className="size-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="px-4 py-3 text-sm leading-relaxed outline-none prose prose-sm max-w-none dark:prose-invert empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    </div>
  )
}
