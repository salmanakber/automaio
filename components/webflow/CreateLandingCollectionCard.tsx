'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Layers } from 'lucide-react'

type CreateLandingCollectionCardProps = {
  orgId: string
  integrationId: string
  defaultName?: string
  onCreated?: (collection: { id: string; displayName?: string; slug?: string }) => void
  compact?: boolean
}

export function CreateLandingCollectionCard({
  orgId,
  integrationId,
  defaultName = 'Landing Pages',
  onCreated,
  compact = false,
}: CreateLandingCollectionCardProps) {
  const [name, setName] = useState(defaultName)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/integrations/webflow/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({
          organizationId: orgId,
          integrationId,
          displayName: name.trim(),
          includeSectionFields: true,
          setAsPagesCollection: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(
        `Created "${name}" with ${data.fieldCount ?? 17} fields including hero, features, testimonials, and FAQ.`,
      )
      onCreated?.(data.collection)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className={`rounded-xl border border-blue-500/20 bg-blue-500/5 ${compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}
    >
      <div className="flex items-start gap-2">
        <Layers className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-zinc-200">Create landing page collection</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
            Auto-creates CMS fields for hero, features, testimonials, FAQ, pricing, and CTA sections
            so AI-personalized content syncs on publish.
          </p>
        </div>
      </div>

      {!compact && (
        <div className="space-y-2">
          <Label className="text-[10px] text-zinc-500 uppercase">Collection name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-950 border-zinc-800 h-8 text-xs"
            placeholder="Landing Pages"
          />
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-[11px] text-emerald-400">{success}</p>
      )}

      <Button
        type="button"
        size="sm"
        className={`bg-blue-600 hover:bg-blue-500 gap-2 ${compact ? 'w-full h-8 text-xs' : ''}`}
        onClick={create}
        disabled={creating || !name.trim()}
      >
        {creating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        Create with section fields
      </Button>
    </div>
  )
}
