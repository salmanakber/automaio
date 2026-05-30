'use client'

import { useState } from 'react'
import { Plus, Minus, LayoutGrid, ImageIcon, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { SectionSelection } from '@/components/projects/EditorSectionPanel'
import { MediaManagerDialog } from '@/components/projects/MediaManagerDialog'

type EditorCollectionPanelProps = {
  section: SectionSelection
  projectId: string
  embedded?: boolean
  onAddItem: () => void
  onRemoveItem: () => void
  onSetColumns: (columns: number) => void
  onImageUpdate: (imageId: string, src: string) => void
}

const IMAGE_COLLECTIONS = new Set(['team', 'gallery', 'carousel', 'testimonials'])

export function EditorCollectionPanel({
  section,
  projectId,
  embedded: _embedded,
  onAddItem,
  onRemoveItem,
  onSetColumns,
  onImageUpdate,
}: EditorCollectionPanelProps) {
  const itemCount = section.collectionItemCount ?? 1
  const columns = section.collectionColumns ?? 1
  const isFaq = section.collection === 'faq' || section.collection === 'tabs'
  const showImagePicker = IMAGE_COLLECTIONS.has(section.collection ?? '')
  const collectionImages = section.collectionImages ?? []
  const [mediaOpen, setMediaOpen] = useState(false)
  const [activeImageId, setActiveImageId] = useState<string | null>(null)

  const openPicker = (imageId: string) => {
    setActiveImageId(imageId)
    setMediaOpen(true)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
          Repeatable items
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Add or remove rows in this {section.collection} block. Drag the block handle on canvas to
        reorder sections.
      </p>

      {showImagePicker && collectionImages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[9px] text-zinc-500 uppercase font-bold">Images</Label>
          <div className="space-y-2">
            {collectionImages.map((img) => (
              <div
                key={img.imageId}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2"
              >
                <div className="h-12 w-12 rounded-md overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                  {img.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.src}
                      alt={img.label}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-300 truncate">{img.label}</p>
                  <p className="text-[9px] text-zinc-600 truncate">Slide {img.index + 1}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1 border-zinc-700 shrink-0"
                  onClick={() => openPicker(img.imageId)}
                >
                  <FolderOpen className="h-3 w-3" /> Change
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showImagePicker && collectionImages.length === 0 && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 flex gap-2">
          <ImageIcon className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-violet-200/90 leading-relaxed">
            Add items first, then pick images from your media library below or on the canvas.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
        <span className="text-[10px] text-zinc-500 uppercase font-bold">Items</span>
        <span className="text-sm font-mono text-violet-300">{itemCount}</span>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-[10px] gap-1 border-zinc-700"
          onClick={onAddItem}
        >
          <Plus className="h-3 w-3" /> Add item
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[10px] gap-1 border-zinc-700"
          disabled={itemCount <= 1}
          onClick={onRemoveItem}
        >
          <Minus className="h-3 w-3" /> Remove
        </Button>
      </div>

      {!isFaq && section.collection !== 'carousel' && (
        <div className="space-y-2 pt-1">
          <div className="flex justify-between">
            <Label className="text-[9px] text-zinc-500 uppercase">Columns</Label>
            <span className="text-[9px] text-violet-400 font-mono">{columns}</span>
          </div>
          <Slider
            min={1}
            max={4}
            step={1}
            value={[columns]}
            onValueChange={([v]) => onSetColumns(v)}
          />
        </div>
      )}

      <MediaManagerDialog
        open={mediaOpen}
        onOpenChange={(open) => {
          setMediaOpen(open)
          if (!open) setActiveImageId(null)
        }}
        projectId={projectId}
        onSelect={(url) => {
          if (activeImageId) onImageUpdate(activeImageId, url)
        }}
      />
    </div>
  )
}
