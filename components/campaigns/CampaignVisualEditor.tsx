'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

type ImageRef = { index: number; src: string; alt: string }

function parseImages(html: string): ImageRef[] {
  const images: ImageRef[] = []
  const re = /<img([^>]*)>/gi
  let match: RegExpExecArray | null
  let index = 0
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1]
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? ''
    const alt = attrs.match(/\balt=["']([^"']*)["']/i)?.[1] ?? ''
    images.push({ index: index++, src, alt })
  }
  return images
}

function replaceImageSrc(html: string, imageIndex: number, newSrc: string): string {
  let current = -1
  return html.replace(/<img([^>]*)>/gi, (full, attrs) => {
    current += 1
    if (current !== imageIndex) return full
    if (/\bsrc=/i.test(attrs)) {
      return `<img${attrs.replace(/\bsrc=["'][^"']*["']/i, `src="${newSrc}"`)}>`
    }
    return `<img src="${newSrc}"${attrs}>`
  })
}

const EDITOR_STYLE = `<style>
  img.automaio-img-selected { outline: 3px solid #2563eb; outline-offset: 2px; }
  img[data-automaio-editable] { cursor: pointer; }
  img[data-automaio-editable]:hover { outline: 2px dashed #93c5fd; outline-offset: 2px; }
</style>`

function injectVisualEdit(html: string): string {
  const script = `<script>
document.addEventListener('DOMContentLoaded', function() {
  document.body.setAttribute('contenteditable', 'true');
  document.body.style.outline = 'none';
  document.querySelectorAll('img').forEach(function(img) {
    img.setAttribute('data-automaio-editable', 'true');
    img.setAttribute('draggable', 'false');
  });
});
</script>`
  const withStyle = html.includes('</head>')
    ? html.replace(/<\/head>/i, `${EDITOR_STYLE}</head>`)
    : `${EDITOR_STYLE}${html}`
  if (/<\/body>/i.test(withStyle)) {
    return withStyle.replace(/<\/body>/i, `${script}</body>`)
  }
  return `${withStyle}${script}`
}

function stripEditorArtifacts(html: string): string {
  return html
    .replace(/\scontenteditable="true"/gi, '')
    .replace(/\sdata-automaio-editable="true"/gi, '')
    .replace(/\sdraggable="false"/gi, '')
    .replace(/\sclass="[^"]*automaio-img-selected[^"]*"/gi, (m) => {
      const cleaned = m
        .replace(/automaio-img-selected/g, '')
        .replace(/\s+/g, ' ')
        .replace(/class="\s*"/, '')
      return cleaned === 'class=""' ? '' : cleaned
    })
    .replace(/<style>[\s\S]*?img\.automaio-img-selected[\s\S]*?<\/style>/i, '')
    .replace(/<script>[\s\S]*?data-automaio-editable[\s\S]*?<\/script>/i, '')
}

type CampaignVisualEditorProps = {
  html: string
  launchBrief?: string
  onSave: (html: string) => Promise<void>
  onGenerate: (launchBrief?: string) => Promise<string>
  saving?: boolean
  /** Parent-driven generation (e.g. auto-generate on first open). */
  pageGenerating?: boolean
}

export function CampaignVisualEditor({
  html,
  launchBrief: initialBrief = '',
  onSave,
  onGenerate,
  saving = false,
  pageGenerating = false,
}: CampaignVisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const imageClickCleanupRef = useRef<(() => void) | null>(null)
  const [draftHtml, setDraftHtml] = useState(html)
  const [brief, setBrief] = useState(initialBrief)
  const [generating, setGenerating] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const images = useMemo(() => parseImages(draftHtml), [draftHtml])
  const isGenerating = generating || pageGenerating

  useEffect(() => {
    setBrief(initialBrief)
  }, [initialBrief])

  useEffect(() => {
    setDraftHtml(html)
    setSelectedImageIndex(null)
  }, [html])

  const bindImageClicksInPreview = useCallback(() => {
    imageClickCleanupRef.current?.()
    imageClickCleanupRef.current = null

    const doc = iframeRef.current?.contentDocument
    if (!doc) return

    const cleanups: (() => void)[] = []

    doc.querySelectorAll('img').forEach((img, index) => {
      const onClick = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        doc.querySelectorAll('img').forEach((el) => el.classList.remove('automaio-img-selected'))
        img.classList.add('automaio-img-selected')
        setSelectedImageIndex(index)
        setImageUrlDraft(img.getAttribute('src') ?? '')
      }
      img.addEventListener('click', onClick)
      cleanups.push(() => img.removeEventListener('click', onClick))
    })

    imageClickCleanupRef.current = () => cleanups.forEach((fn) => fn())
  }, [])

  useEffect(() => {
    return () => imageClickCleanupRef.current?.()
  }, [])

  const readHtmlFromIframe = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc?.documentElement) return draftHtml
    const raw = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
    return stripEditorArtifacts(raw)
  }, [draftHtml])

  const handleSave = async () => {
    setError(null)
    setMessage(null)
    const next = readHtmlFromIframe()
    setDraftHtml(next)
    try {
      await onSave(next)
      setMessage('Page saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setMessage(null)
    try {
      const next = await onGenerate(brief.trim() || undefined)
      setDraftHtml(next)
      setMessage(
        'Automaio generated your page. Edit text in the preview, click images to swap URLs, then Save.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const updateImage = (index: number, src: string) => {
    setDraftHtml((prev) => replaceImageSrc(prev, index, src.trim()))
  }

  const applySelectedImageUrl = () => {
    if (selectedImageIndex === null || !imageUrlDraft.trim()) return
    updateImage(selectedImageIndex, imageUrlDraft)
    setSelectedImageIndex(null)
    setMessage('Image updated. Save the page to keep changes.')
  }

  const previewDoc = injectVisualEdit(draftHtml)

  const handleIframeLoad = () => {
    bindImageClicksInPreview()
    if (selectedImageIndex !== null) {
      const doc = iframeRef.current?.contentDocument
      const img = doc?.querySelectorAll('img')[selectedImageIndex]
      img?.classList.add('automaio-img-selected')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <Label htmlFor="launch-brief">Launch brief (for AI)</Label>
        <Textarea
          id="launch-brief"
          rows={4}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe the product, launch, offer, and key messages. AI will write the full page from this — no placeholders needed."
        />
        <Button onClick={handleGenerate} disabled={isGenerating || !brief.trim()}>
          {generating ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Generating page…
            </>
          ) : (
            'Generate page with Automaio'
          )}
        </Button>
      </div>

      {message ? <p className="text-sm text-green-600">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isGenerating ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-6 text-sm">
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
          <div>
            <p className="font-medium">Generating your page with Automaio…</p>
            <p className="text-muted-foreground">This usually takes 15–45 seconds.</p>
          </div>
        </div>
      ) : null}

      {!draftHtml.trim() && !isGenerating ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Generate a page with Automaio using your launch brief above.
        </div>
      ) : null}

      {!isGenerating && draftHtml.trim() ? (
        <Tabs defaultValue="visual">
          <TabsList>
            <TabsTrigger value="visual">Visual edit</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="source">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Click text to edit copy. Click any image to change its URL, then save — this HTML is
              what Webflow receives.
            </p>
            <div className="relative rounded-lg border overflow-hidden bg-white">
              <iframe
                ref={iframeRef}
                title="Campaign page editor"
                className="w-full h-[min(640px,70vh)] border-0"
                srcDoc={previewDoc}
                sandbox="allow-same-origin allow-scripts"
                onLoad={handleIframeLoad}
              />
            </div>
            {selectedImageIndex !== null ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium">
                  Image {selectedImageIndex + 1}
                  {images[selectedImageIndex]?.alt
                    ? ` · ${images[selectedImageIndex].alt}`
                    : ''}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="visual-image-url">Image URL</Label>
                    <Input
                      id="visual-image-url"
                      value={imageUrlDraft}
                      onChange={(e) => setImageUrlDraft(e.target.value)}
                      placeholder="https://…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applySelectedImageUrl()
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={applySelectedImageUrl} disabled={!imageUrlDraft.trim()}>
                      Apply
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedImageIndex(null)
                        iframeRef.current?.contentDocument
                          ?.querySelectorAll('img')
                          .forEach((el) => el.classList.remove('automaio-img-selected'))
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save page'}
            </Button>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images in this page yet.</p>
            ) : (
              images.map((img) => (
                <div key={img.index} className="space-y-2 rounded-lg border p-3">
                  <Label>Image {img.index + 1}</Label>
                  <Input
                    value={img.src}
                    onChange={(e) => updateImage(img.index, e.target.value)}
                    placeholder="https://…"
                  />
                  {img.alt ? (
                    <p className="text-xs text-muted-foreground">Alt: {img.alt}</p>
                  ) : null}
                </div>
              ))
            )}
            <Button onClick={handleSave} disabled={saving} variant="outline">
              Save after image changes
            </Button>
          </TabsContent>

          <TabsContent value="source">
            <Textarea
              className="font-mono text-xs min-h-[400px]"
              value={draftHtml}
              onChange={(e) => setDraftHtml(e.target.value)}
            />
            <Button className="mt-3" onClick={handleSave} disabled={saving}>
              Save HTML
            </Button>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}
