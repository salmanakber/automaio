'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles, Save, Loader2, CheckCircle2, MousePointerClick, Wand2, AlertTriangle } from 'lucide-react'
import { VISUAL_EDITOR_SCRIPT } from '@/lib/editor/visual-editor-script'
import { buildWidgetHtml, type EditorWidgetType } from '@/lib/editor/editor-widgets'
import type { EditViewport, ElementStyles, StyleTarget } from '@/lib/editor/responsive-styles'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { playEditorSound, type EditorSound } from '@/lib/editor/editor-sounds'

/* ─── Selection chrome — outline only so applied colors stay visible ─── */
const EDITOR_CSS = `
[data-am-id] { transition: outline 0.12s ease, box-shadow 0.12s ease; cursor: pointer !important; }
[data-am-id]:hover { outline: 2px dashed #a78bfa !important; outline-offset: 2px; }
[data-am-id].am-active { outline: 2px solid #7c3aed !important; outline-offset: 2px; box-shadow: 0 0 0 3px rgba(124,58,237,0.2) !important; }
[data-am-block] { position: relative; }
[data-am-block]:hover, [data-am-block].am-block-hover {
  outline: 2px dashed #d946ef !important; outline-offset: -1px;
}
[data-am-block].am-block-active {
  outline: 2px solid #c026d3 !important; outline-offset: -1px;
  box-shadow: 0 0 0 3px rgba(192,38,211,0.18) !important;
}
[data-am-block].am-dragging { opacity: 0.5 !important; outline: 2px dashed #7c3aed !important; }
[data-am-drop-zone].am-drop-active {
  outline: 2px dashed #22c55e !important; outline-offset: 4px;
  min-height: 48px;
}
[data-am-kind="container"]:not([data-am-block]):hover { outline: 1px dashed #8b5cf6 !important; }
#am-tb { position: fixed; z-index: 999999; display: none; pointer-events: auto; }
#am-tb-inner { background: #1e1e2e; border: 1px solid #52525b; border-radius: 10px; padding: 4px; display: flex; align-items: center; gap: 3px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); white-space: nowrap; }
#am-tb button { color: #fafafa; border: none; padding: 8px 12px; border-radius: 7px; cursor: pointer; font: 600 11px/1 system-ui,sans-serif; display: flex; align-items: center; gap: 4px; background: #27272a; }
#am-tb button:hover { background: #3f3f46; color: #fff; }
#am-tb .am-drag { cursor: grab; background: #312e81; color: #c4b5fd; }
#am-tb .am-drag:hover { background: #3730a3; }
#am-tb .am-ai { background: linear-gradient(135deg,#6d28d9,#7c3aed); color: #fff; }
#am-tb .am-ai:hover { background: linear-gradient(135deg,#5b21b6,#6d28d9); }
#am-tb .am-done { background: #047857; color: #fff; }
#am-tb .am-done:hover { background: #065f46; }
#am-tb .am-del { background: #b91c1c; color: #fff; }
#am-tb .am-del:hover { background: #991b1b; }
html[data-am-edit-viewport="mobile"] body { box-shadow: inset 0 0 0 3px rgba(236,72,153,0.2); }
html[data-am-edit-viewport="tablet"] body { box-shadow: inset 0 0 0 3px rgba(59,130,246,0.15); }
`

/* Editor script lives in lib/editor/visual-editor-script.ts */
const EDITOR_JS = VISUAL_EDITOR_SCRIPT

type SelectedElement = {
  id: string
  text: string
  tag: string
  kind?: 'text' | 'image' | 'code' | 'link' | 'container'
  src?: string
  alt?: string
  href?: string
  innerHtml?: string
  inlineTags?: string
}

export type SectionSelection = {
  id: string
  tag: string
  widget?: string
  layout?: string
  isDropZone?: boolean
  padding?: { top: number; right: number; bottom: number; left: number }
  columnWidths?: number[]
  gap?: number
}

export type ProjectVisualEditorHandle = {
  save: () => Promise<void>
  flushSave: () => Promise<string | null>
  runBulkAi: (prompt: string) => Promise<void>
  postMessage: (msg: Record<string, unknown>) => void
  hasChanges: boolean
  insertWidget: (type: EditorWidgetType, options?: { targetId?: string; position?: 'before' | 'after' | 'inside' }) => void
  setSectionLayout: (targetId: string, layout: '1col' | '2col' | '3col') => void
  setSectionPadding: (targetId: string, padding: SectionSelection['padding']) => void
  setColumnWidths: (targetId: string, widths: number[]) => void
  setColumnGap: (targetId: string, gap: number) => void
  setElementStyles: (targetId: string, styles: ElementStyles) => void
  stackColumnsOnMobile: (targetId: string) => void
  undo: () => void
  redo: () => void
  duplicate: () => void
  applyThemeCss: (css: string) => void
  canUndo: boolean
  canRedo: boolean
}

interface ProjectVisualEditorProps {
  html: string
  projectId: string
  autoSaveEnabled?: boolean
  onSave?: (html: string) => void
  onAutoSaveStateChange?: (state: {
    hasChanges: boolean
    autoSaving: boolean
    saved: boolean
  }) => void
  onSelectElement?: (el: SelectedElement | null) => void
  onFocusRect?: (rect: { top: number; left: number; width: number; height: number } | null) => void
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void
  onSectionSelect?: (section: SectionSelection | null) => void
  onStyleTargetChange?: (target: StyleTarget | null) => void
  editViewport?: EditViewport
  variant?: 'default' | 'studio'
  zoom?: number
}

/**
 * Normalize the template HTML into a valid document and inject editor assets.
 * Handles: theme styles before DOCTYPE, truncated AI output, fragments.
 */
function buildEditorHtml(raw: string): string {
  if (!raw?.trim()) return ''

  let html = raw.trim()

  // Pull any content (theme styles) that appears before <!DOCTYPE html>
  let prefix = ''
  const doctypeIdx = html.search(/<!DOCTYPE\s+html/i)
  if (doctypeIdx > 0) {
    prefix = html.slice(0, doctypeIdx).trim()
    html = html.slice(doctypeIdx)
  }

  // Detect truncated HTML (missing closing tags)
  const hasHead = /<\/head>/i.test(html)
  const hasBody = /<\/body>/i.test(html)
  const hasHtmlTag = /<\/html>/i.test(html)

  // If the document structure is missing entirely, wrap the content
  if (!/<html[\s>]/i.test(html) && !html.startsWith('<!DOCTYPE')) {
    const styleBlocks = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)]
      .map((m) => m[0])
      .join('\n')
    const bodyContent = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim()

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${prefix}
  ${styleBlocks}
  <style data-am-editor="true">${EDITOR_CSS}</style>
</head>
<body>
  ${bodyContent}
  <script data-am-editor="true">${EDITOR_JS}<\/script>
</body>
</html>`
  }

  // Close truncated documents — AI sometimes runs out of tokens mid-CSS/HTML
  if (!hasHead) {
    // Close any open <style> tag, then close <head>
    const openStyle = (html.match(/<style/gi) || []).length
    const closeStyle = (html.match(/<\/style>/gi) || []).length
    if (openStyle > closeStyle) {
      html += '\n</style>'
    }
    html += '\n</head>'
  }
  if (!hasBody) {
    html += '\n<body></body>'
  }
  if (!hasHtmlTag) {
    html += '\n</html>'
  }

  // Inject prefix (theme styles) and editor CSS into <head>
  const editorStyle = `${prefix ? prefix + '\n' : ''}<style data-am-editor="true">${EDITOR_CSS}</style>`
  html = html.replace(/<\/head>/i, `${editorStyle}\n</head>`)

  // Inject editor JS before </body>
  const editorScript = `<script data-am-editor="true">${EDITOR_JS}<\/script>`
  html = html.replace(/<\/body>/i, `${editorScript}\n</body>`)

  return html
}

export const ProjectVisualEditor = forwardRef<ProjectVisualEditorHandle, ProjectVisualEditorProps>(
  function ProjectVisualEditor(
    {
      html,
      projectId,
      autoSaveEnabled = true,
      onSave,
      onAutoSaveStateChange,
      onSelectElement,
      onFocusRect,
      onHistoryChange,
      onSectionSelect,
      onStyleTargetChange,
      editViewport = 'desktop',
      variant = 'default',
      zoom = 1,
    },
    ref,
  ) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pendingTextRef = useRef<((els: Record<string, { text: string; tag: string }>) => void) | null>(null)
  const pendingHtmlRef = useRef<((h: string) => void) | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveChainRef = useRef<Promise<string | null>>(Promise.resolve(null))
  const skipIframeReloadRef = useRef(false)
  const iframeInitializedRef = useRef(false)

  const [selected, setSelected] = useState<SelectedElement | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [elementCount, setElementCount] = useState(0)
  const [iframeReady, setIframeReady] = useState(false)
  const [truncated, setTruncated] = useState(false)

  // Per-element AI
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Bulk AI
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkPrompt, setBulkPrompt] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState('')

  // Image / code edit dialogs
  const [imageOpen, setImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeText, setCodeText] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const [linkText, setLinkText] = useState('')

  const isStudio = variant === 'studio'

  useEffect(() => {
    onAutoSaveStateChange?.({ hasChanges, autoSaving, saved })
  }, [hasChanges, autoSaving, saved, onAutoSaveStateChange])

  // Write HTML into iframe — skip reload when we just saved (prevents wiping in-progress edits)
  const writeToIframe = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !html?.trim()) return

    const isTruncated = !/<\/html>/i.test(html) || !/<\/body>/i.test(html)
    setTruncated(isTruncated)

    const editorHtml = buildEditorHtml(html)

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) return
      doc.open()
      doc.write(editorHtml)
      doc.close()
      setIframeReady(true)
    } catch {
      // Last-resort fallback: srcdoc
      iframe.srcdoc = editorHtml
      setIframeReady(true)
    }
  }, [html])

  useEffect(() => {
    if (skipIframeReloadRef.current) {
      skipIframeReloadRef.current = false
      return
    }
    const timer = setTimeout(writeToIframe, 100)
    iframeInitializedRef.current = true
    return () => clearTimeout(timer)
  }, [writeToIframe])

  const postToIframe = useCallback(
    (msg: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(msg, '*')
    },
    [],
  )

  useEffect(() => {
    if (!iframeReady) return
    postToIframe({ type: 'am-set-viewport', viewport: editViewport })
  }, [editViewport, iframeReady, postToIframe])

  const buildStyleTarget = useCallback(
    (payload: {
      id: string
      tag: string
      widget?: string
      text?: string
      styles?: ElementStyles
    }): StyleTarget => ({
      id: payload.id,
      tag: payload.tag,
      label:
        payload.widget ||
        (payload.text && payload.text.length > 24
          ? payload.text.slice(0, 24) + '…'
          : payload.text) ||
        payload.tag,
      styles: payload.styles ?? {},
    }),
    [],
  )

  const requestCleanHtml = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!iframeReady) {
        reject(new Error('Editor not ready'))
        return
      }
      pendingHtmlRef.current = resolve
      postToIframe({ type: 'am-get-html' })
      setTimeout(() => {
        if (pendingHtmlRef.current) {
          pendingHtmlRef.current = null
          reject(new Error('Timed out waiting for editor HTML'))
        }
      }, 8000)
    })
  }, [iframeReady, postToIframe])

  const persistHtml = useCallback(
    async (options?: { silent?: boolean }): Promise<string | null> => {
      const silent = options?.silent ?? false

      const runSave = async (): Promise<string> => {
        if (silent) setAutoSaving(true)
        else setSaving(true)

        try {
          const cleanHtml = await requestCleanHtml()

          const res = await fetch(`/api/projects/${projectId}/html`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ renderedHtml: cleanHtml }),
            credentials: 'same-origin',
          })
          const data = await parseJsonResponse<{ error?: string }>(res)
          if (!res.ok) throw new Error(data.error ?? 'Save failed')

          setHasChanges(false)
          setSaved(true)
          skipIframeReloadRef.current = true
          onSave?.(cleanHtml)
          setTimeout(() => setSaved(false), silent ? 1500 : 3000)
          return cleanHtml
        } finally {
          if (silent) setAutoSaving(false)
          else setSaving(false)
        }
      }

      const task = (): Promise<string | null> =>
        runSave().catch((err) => {
          if (!silent) throw err
          console.error('[ProjectVisualEditor] auto-save failed:', err)
          return null
        })

      saveChainRef.current = saveChainRef.current.then(task, task)
      return saveChainRef.current
    },
    [onSave, projectId, requestCleanHtml],
  )

  const scheduleAutoSave = useCallback(() => {
    if (!autoSaveEnabled) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      void persistHtml({ silent: true })
    }, 1200)
  }, [autoSaveEnabled, persistHtml])

  const flushSave = useCallback(async (): Promise<string | null> => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    return persistHtml({ silent: false })
  }, [persistHtml])

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const d = e.data
      if (!d?.type?.startsWith('am-')) return

      switch (d.type) {
        case 'am-ready':
          setElementCount(d.count ?? 0)
          break
        case 'am-history':
          setCanUndo(Boolean(d.canUndo))
          setCanRedo(Boolean(d.canRedo))
          onHistoryChange?.({ canUndo: Boolean(d.canUndo), canRedo: Boolean(d.canRedo) })
          break
        case 'am-selected':
          {
            const el: SelectedElement = {
              id: d.id,
              text: d.text,
              tag: d.tag,
              kind: d.kind,
              src: d.src,
              alt: d.alt,
              href: d.href,
            }
            setSelected(el)
            onSelectElement?.(el)
            if (d.rect) {
              onFocusRect?.(d.rect)
            }
            if (d.styles) {
              onStyleTargetChange?.(
                buildStyleTarget({
                  id: d.id,
                  tag: d.tag,
                  widget: d.widget,
                  text: d.text,
                  styles: d.styles,
                }),
              )
            }
          }
          break
        case 'am-deleted':
          setHasChanges(true)
          setSelected(null)
          onSelectElement?.(null)
          playEditorSound('delete')
          scheduleAutoSave()
          break
        case 'am-updated':
        case 'am-changed':
          setHasChanges(true)
          scheduleAutoSave()
          if (selected && d.id === selected.id) {
            const next: SelectedElement = {
              id: d.id,
              text: d.text ?? selected.text,
              tag: d.tag ?? selected.tag,
              kind: d.kind ?? selected.kind,
              src: d.src ?? selected.src,
              alt: d.alt ?? selected.alt,
              href: d.href ?? selected.href,
            }
            setSelected(next)
            onSelectElement?.(next)
          }
          break
        case 'am-ai-req':
          setSelected({
            id: d.id,
            text: d.text,
            tag: d.tag,
            kind: d.kind ?? 'text',
            innerHtml: d.innerHtml,
            inlineTags: d.inlineTags,
          })
          if (!isStudio) setAiOpen(true)
          break
        case 'am-image-req':
          setSelected({
            id: d.id,
            text: d.alt ?? '',
            tag: 'img',
            kind: 'image',
            src: d.src,
            alt: d.alt,
          })
          setImageSrc(d.src ?? '')
          setImageAlt(d.alt ?? '')
          setImageOpen(true)
          break
        case 'am-code-req':
          setSelected({ id: d.id, text: d.text, tag: d.tag, kind: 'code' })
          setCodeText(d.text ?? '')
          if (!isStudio) setCodeOpen(true)
          break
        case 'am-link-req':
          setSelected({
            id: d.id,
            text: d.text,
            tag: d.tag,
            kind: 'link',
            href: d.href,
          })
          setLinkHref(d.href ?? '')
          setLinkText(d.text ?? '')
          if (!isStudio) setLinkOpen(true)
          break
        case 'am-all-text':
          pendingTextRef.current?.(d.elements)
          pendingTextRef.current = null
          break
        case 'am-clean-html':
          pendingHtmlRef.current?.(d.html)
          pendingHtmlRef.current = null
          break
        case 'am-bulk-done':
          setHasChanges(true)
          scheduleAutoSave()
          break
        case 'am-section-selected':
          if (d.id) {
            onSectionSelect?.({
              id: d.id,
              tag: d.tag,
              widget: d.widget,
              layout: d.layout,
              isDropZone: d.isDropZone,
              padding: d.padding,
              columnWidths: d.columnWidths,
              gap: d.gap,
            })
            if (d.styles) {
              onStyleTargetChange?.(
                buildStyleTarget({
                  id: d.id,
                  tag: d.tag,
                  widget: d.widget,
                  styles: d.styles,
                }),
              )
            }
          } else {
            onSectionSelect?.(null)
          }
          break
        case 'am-styles-updated':
          if (d.id && d.styles) {
            onStyleTargetChange?.(
              buildStyleTarget({
                id: d.id,
                tag: d.tag ?? 'div',
                widget: d.widget,
                styles: d.styles,
              }),
            )
          }
          setHasChanges(true)
          scheduleAutoSave()
          break
        case 'am-sound':
          if (d.sound && ['select', 'insert', 'delete', 'change'].includes(d.sound)) {
            playEditorSound(d.sound as EditorSound)
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [selected?.id, onSelectElement, onFocusRect, isStudio, scheduleAutoSave, onHistoryChange, onSectionSelect, onStyleTargetChange, buildStyleTarget])

  const insertWidget = useCallback(
    (type: EditorWidgetType, options?: { targetId?: string; position?: 'before' | 'after' | 'inside' }) => {
      const html = buildWidgetHtml(type)
      if (options?.targetId && options.position === 'inside') {
        postToIframe({ type: 'am-insert-inside', html, targetId: options.targetId })
      } else {
        postToIframe({
          type: 'am-insert-widget',
          html,
          targetId: options?.targetId,
          position: options?.position ?? 'after',
        })
      }
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const setSectionLayout = useCallback(
    (targetId: string, layout: '1col' | '2col' | '3col') => {
      postToIframe({ type: 'am-set-layout', targetId, layout })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const setSectionPadding = useCallback(
    (targetId: string, padding: SectionSelection['padding']) => {
      if (!padding) return
      postToIframe({ type: 'am-set-padding', targetId, padding })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const setColumnWidths = useCallback(
    (targetId: string, widths: number[]) => {
      postToIframe({ type: 'am-set-column-widths', targetId, widths })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const setColumnGap = useCallback(
    (targetId: string, gap: number) => {
      postToIframe({ type: 'am-set-gap', targetId, gap })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const setElementStyles = useCallback(
    (targetId: string, styles: ElementStyles) => {
      postToIframe({ type: 'am-set-styles', targetId, styles })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const stackColumnsOnMobile = useCallback(
    (targetId: string) => {
      postToIframe({ type: 'am-stack-columns', targetId })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const handleUndo = useCallback(() => postToIframe({ type: 'am-undo' }), [postToIframe])
  const handleRedo = useCallback(() => postToIframe({ type: 'am-redo' }), [postToIframe])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo, handleRedo])
  const handleDuplicate = useCallback(() => postToIframe({ type: 'am-duplicate' }), [postToIframe])
  const applyThemeCss = useCallback(
    (css: string) => {
      postToIframe({ type: 'am-apply-theme', css })
      setHasChanges(true)
      scheduleAutoSave()
    },
    [postToIframe, scheduleAutoSave],
  )

  const handleElementAi = async () => {
    if (!selected || !aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/ai-element`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selected.text,
          tag: selected.tag,
          prompt: aiPrompt,
          innerHtml: (selected as SelectedElement & { innerHtml?: string }).innerHtml,
          inlineTags: (selected as SelectedElement & { inlineTags?: string }).inlineTags,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      postToIframe({ type: 'am-ai-result', id: selected.id, text: data.text })
      setSelected((prev) => (prev ? { ...prev, text: data.text } : null))
      setAiOpen(false)
      setAiPrompt('')
      setHasChanges(true)
      scheduleAutoSave()
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleBulkAi = async (promptOverride?: string) => {
    const prompt = promptOverride ?? bulkPrompt
    if (!prompt.trim()) return
    setBulkLoading(true)
    setBulkError('')
    try {
      const elements = await new Promise<Record<string, { text: string; tag: string }>>((resolve) => {
        pendingTextRef.current = resolve
        postToIframe({ type: 'am-get-text' })
        setTimeout(() => {
          if (pendingTextRef.current) {
            pendingTextRef.current = null
            resolve({})
          }
        }, 3000)
      })

      if (Object.keys(elements).length === 0) {
        throw new Error('Could not read text elements from the page')
      }

      const res = await fetch(`/api/projects/${projectId}/ai-enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: 'text-only', elements }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      postToIframe({ type: 'am-bulk-update', updates: data.elements })
      setBulkOpen(false)
      setBulkPrompt('')
      setHasChanges(true)
      scheduleAutoSave()
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'AI generation failed')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleSaveImage = () => {
    if (!selected) return
    postToIframe({ type: 'am-image-update', id: selected.id, src: imageSrc, alt: imageAlt })
    setImageOpen(false)
    setHasChanges(true)
  }

  const handleSaveCode = () => {
    if (!selected) return
    postToIframe({ type: 'am-code-update', id: selected.id, text: codeText })
    setCodeOpen(false)
    setHasChanges(true)
  }

  const handleSaveLink = () => {
    if (!selected) return
    postToIframe({ type: 'am-link-update', id: selected.id, href: linkHref, text: linkText })
    setLinkOpen(false)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await persistHtml()
    } catch {
      // saving state handled in persistHtml
    }
  }

  useImperativeHandle(ref, () => ({
    save: handleSave,
    flushSave,
    runBulkAi: async (prompt: string) => handleBulkAi(prompt),
    postMessage: postToIframe,
    hasChanges,
    insertWidget,
    setSectionLayout,
    setSectionPadding,
    setColumnWidths,
    setColumnGap,
    setElementStyles,
    stackColumnsOnMobile,
    undo: handleUndo,
    redo: handleRedo,
    duplicate: handleDuplicate,
    applyThemeCss,
    canUndo,
    canRedo,
  }))

  if (!html?.trim()) {
    return (
      <div
        className={
          isStudio
            ? 'h-full flex flex-col items-center justify-center text-center text-zinc-500'
            : 'rounded-xl border-2 border-dashed bg-muted/20 flex flex-col items-center justify-center py-20 text-center'
        }
      >
        <MousePointerClick className={isStudio ? 'size-10 opacity-30 mb-3' : 'size-12 text-muted-foreground/30 mb-4'} />
        <p className="font-medium mb-1">No HTML content yet</p>
        <p className="text-sm opacity-70 mb-4">Import a template or generate content to get started.</p>
      </div>
    )
  }

  const iframeBlock = (
    <div
      className={
        isStudio
          ? 'h-full w-full bg-white overflow-hidden'
          : 'rounded-b-xl border bg-white overflow-hidden'
      }
      style={isStudio ? undefined : { minHeight: 520 }}
    >
      <iframe
        ref={iframeRef}
        title="Visual editor"
        className="w-full border-0"
        style={isStudio ? { height: '100%', minHeight: '100%' } : { minHeight: 520, height: '70vh' }}
      />
      {!iframeReady && (
        <div
          className={
            isStudio
              ? 'flex items-center justify-center h-full text-zinc-400 text-sm absolute inset-0 bg-white'
              : 'flex items-center justify-center h-[520px] text-muted-foreground text-sm -mt-[520px]'
          }
        >
          <Loader2 className="size-4 animate-spin mr-2" /> Loading editor...
        </div>
      )}
    </div>
  )

  return (
    <div className={isStudio ? 'h-full w-full relative' : 'space-y-0'}>
      {truncated && !isStudio && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 mb-3">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Page HTML appears incomplete</p>
            <p className="text-xs mt-0.5">
              The AI may have hit its token limit during generation. Try regenerating with a shorter
              template, or use &ldquo;AI update all&rdquo; to update just the text content (much cheaper).
            </p>
          </div>
        </div>
      )}

      {!isStudio && (
      <>
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MousePointerClick className="size-4" />
          <span>Click any text to edit &middot; {elementCount} editable elements</span>
          {hasChanges && (
            <Badge variant="outline" className="ml-2 text-amber-600 border-amber-500/30 text-xs">
              Unsaved changes
            </Badge>
          )}
          {autoSaving && (
            <span className="ml-2 text-zinc-500 flex items-center gap-1 text-xs">
              <Loader2 className="size-3 animate-spin" /> Saving…
            </span>
          )}
          {saved && !autoSaving && (
            <span className="ml-2 text-emerald-600 flex items-center gap-1 text-xs font-medium">
              <CheckCircle2 className="size-3.5" /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5 text-xs">
            <Wand2 className="size-3.5" />
            AI update all
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges} className="gap-1.5 text-xs">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {iframeBlock}
      </>
      )}

      {isStudio && iframeBlock}

      {/* Selected element info bar */}
      {!isStudio && selected && (
        <div className="mt-3 rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-mono text-xs">
              &lt;{selected.tag}&gt;
            </Badge>
            {selected.kind && (
              <Badge variant="outline" className="text-xs capitalize">{selected.kind}</Badge>
            )}
            <span className="text-sm text-muted-foreground truncate max-w-md">
              {selected.kind === 'image'
                ? selected.src
                : selected.text.length > 80
                  ? selected.text.slice(0, 80) + '...'
                  : selected.text}
            </span>
            {selected.kind === 'text' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiOpen(true)}
                className="ml-auto gap-1.5 text-xs"
              >
                <Sparkles className="size-3.5" />
                AI enhance
              </Button>
            )}
            {selected.kind === 'image' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageOpen(true)}
                className="ml-auto gap-1.5 text-xs"
              >
                Edit image
              </Button>
            )}
            {selected.kind === 'code' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCodeOpen(true)}
                className="ml-auto gap-1.5 text-xs"
              >
                Edit code
              </Button>
            )}
          </div>
        </div>
      )}

      {!isStudio && (
      <>
      {/* Per-element AI dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              AI enhance element
            </DialogTitle>
            <DialogDescription>
              Update just this{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;{selected?.tag}&gt;</code>{' '}
              element. Only the text is sent to AI — no full page rewrite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="text-xs font-medium text-foreground block mb-0.5">Current text:</span>
              {selected?.text}
            </div>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Make it about a fitness tracking app for busy professionals"
              disabled={aiLoading}
            />
            {aiError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{aiError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>
              Cancel
            </Button>
            <Button onClick={handleElementAi} disabled={aiLoading || !aiPrompt.trim()} className="gap-1.5">
              {aiLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Update element
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk AI dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="size-5 text-primary" />
              AI update all text
            </DialogTitle>
            <DialogDescription>
              Updates text-only blocks — HTML structure, styles, images, and code blocks are left unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <Textarea
              value={bulkPrompt}
              onChange={(e) => setBulkPrompt(e.target.value)}
              rows={5}
              placeholder={`Example:\nWe're launching "FitTrack Pro" — a fitness app for busy professionals. Uses AI to create 15-min workout plans. Key features: AI plans, calorie tracking, wearable sync. Tone: energetic but professional.`}
              disabled={bulkLoading}
            />
            {bulkError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{bulkError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {elementCount} text elements will be updated. Estimated cost: ~{Math.round(elementCount * 50)}{' '}
              tokens (vs {Math.round(elementCount * 400)}+ for full HTML rewrite).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button onClick={() => handleBulkAi()} disabled={bulkLoading || !bulkPrompt.trim()} className="gap-1.5">
              {bulkLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Updating all text...
                </>
              ) : (
                <>
                  <Wand2 className="size-4" /> Update all text
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit image</DialogTitle>
            <DialogDescription>Update the image URL and alt text.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input value={imageSrc} onChange={(e) => setImageSrc(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Alt text</Label>
              <Input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Describe the image" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveImage}>Save image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit code block</DialogTitle>
            <DialogDescription>Update the content inside this &lt;{selected?.tag}&gt; block.</DialogDescription>
          </DialogHeader>
          <Textarea value={codeText} onChange={(e) => setCodeText(e.target.value)} rows={10} className="font-mono text-xs" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCode}>Save code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit link</DialogTitle>
            <DialogDescription>Update link text and destination URL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Link text</Label>
              <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input value={linkHref} onChange={(e) => setLinkHref(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLink}>Save link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  )
})
