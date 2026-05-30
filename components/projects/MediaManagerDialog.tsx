'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, ImageIcon, Check, X, AlertCircle } from 'lucide-react'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { normalizeMediaUrl, type MediaLibraryItem } from '@/lib/integrations/cloudinary'
import { cn } from '@/lib/utils'

type MediaManagerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSelect: (url: string) => void
}

type UploadJob = {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  previewUrl?: string
}

function uploadFileWithProgress(
  projectId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ item?: MediaLibraryItem; items?: MediaLibraryItem[]; error?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          item?: MediaLibraryItem
          items?: MediaLibraryItem[]
          error?: string
          errors?: { name: string; error: string }[]
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          reject(new Error(data.error ?? data.errors?.[0]?.error ?? 'Upload failed'))
        }
      } catch {
        reject(new Error('Invalid server response'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', `/api/projects/${projectId}/media`)
    xhr.withCredentials = true
    xhr.send(form)
  })
}

function MediaThumb({
  item,
  selected,
  onClick,
}: {
  item: MediaLibraryItem
  selected: boolean
  onClick: () => void
}) {
  const [broken, setBroken] = useState(false)
  const url = normalizeMediaUrl(item.url)

  return (
    <button
      type="button"
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-zinc-800 hover:border-zinc-600'
      }`}
      onClick={onClick}
    >
      {!broken && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={item.name ?? 'Media'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 gap-1 p-2">
          <ImageIcon className="h-5 w-5 opacity-50" />
          <span className="text-[9px] text-center line-clamp-2">{item.name ?? 'Image'}</span>
        </div>
      )}
      {selected && (
        <span className="absolute top-1 right-1 bg-violet-600 rounded-full p-0.5">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
    </button>
  )
}

export function MediaManagerDialog({
  open,
  onOpenChange,
  projectId,
  onSelect,
}: MediaManagerDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadsEnabled, setUploadsEnabled] = useState(true)
  const [selectedUrl, setSelectedUrl] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [jobs, setJobs] = useState<UploadJob[]>([])

  const anyUploading = jobs.some((j) => j.status === 'uploading' || j.status === 'pending')

  const loadMedia = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/media`, { credentials: 'same-origin' })
      const data = await parseJsonResponse<{
        items?: MediaLibraryItem[]
        cloudinaryConfigured?: boolean
        error?: string
      }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Failed to load media')
      setItems(
        (data.items ?? []).map((item) => ({
          ...item,
          url: normalizeMediaUrl(item.url),
        })),
      )
      setUploadsEnabled(data.cloudinaryConfigured !== false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) {
      setSelectedUrl('')
      setManualUrl('')
      setJobs([])
      void loadMedia()
    }
  }, [open, loadMedia])

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) {
      setError('Please choose image files only')
      return
    }

    setError('')
    const newJobs: UploadJob[] = list.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
      status: 'pending' as const,
      previewUrl: URL.createObjectURL(file),
    }))
    setJobs((prev) => [...newJobs, ...prev])

    for (const job of newJobs) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'uploading' as const, progress: 0 } : j)),
      )
      try {
        const data = await uploadFileWithProgress(projectId, job.file, (pct) => {
          setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, progress: pct } : j)))
        })
        if (data.items) {
          setItems(
            data.items.map((item) => ({
              ...item,
              url: normalizeMediaUrl(item.url),
            })),
          )
        } else {
          await loadMedia()
        }
        if (data.item?.url) setSelectedUrl(normalizeMediaUrl(data.item.url))
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: 'done' as const, progress: 100 } : j,
          ),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: 'error' as const, error: message } : j,
          ),
        )
        setError(message)
      }
    }
  }

  const handleUse = () => {
    const url = normalizeMediaUrl(selectedUrl || manualUrl.trim())
    if (!url) return
    onSelect(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c0e] border-zinc-800 text-white sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-violet-400" />
            Media library
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Upload images or pick from assets already saved to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (files?.length) void uploadFiles(files)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-500"
            disabled={anyUploading || !uploadsEnabled}
            onClick={() => fileRef.current?.click()}
          >
            {anyUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload images
          </Button>
          {!uploadsEnabled && (
            <span className="text-[10px] text-amber-400">
              Image uploads are not configured on this server.
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        {jobs.length > 0 && (
          <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar rounded-lg border border-zinc-800 p-2 bg-zinc-950/50">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-2 text-xs">
                {job.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.previewUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-zinc-300">{job.file.name}</p>
                  <div className="h-1.5 mt-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-200',
                        job.status === 'error' ? 'bg-red-500' : 'bg-violet-500',
                      )}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  {job.status === 'error' && job.error && (
                    <p className="text-[10px] text-red-400 mt-0.5 truncate">{job.error}</p>
                  )}
                </div>
                {job.status === 'uploading' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400 shrink-0" />
                )}
                {job.status === 'done' && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                {job.status === 'error' && <X className="h-3.5 w-3.5 text-red-400 shrink-0" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-zinc-800 rounded-lg p-2 bg-zinc-950/50">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 text-sm gap-2">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p>No images yet — upload your first asset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((item, index) => (
                <MediaThumb
                  key={`${item.id}-${index}`}
                  item={item}
                  selected={selectedUrl === item.url}
                  onClick={() => setSelectedUrl(item.url)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <label className="text-[10px] font-bold uppercase text-zinc-500">Or paste image URL</label>
          <Input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://…"
            className="bg-zinc-950 border-zinc-800 h-8 text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="border-zinc-700" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-500"
            disabled={!selectedUrl && !manualUrl.trim()}
            onClick={handleUse}
          >
            Use image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
