'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildWebflowRuntimeCollectionEmbed } from '@/lib/webflow/runtime-embed'
import { Copy, Check, Loader2, Plus, Layers } from 'lucide-react'

import type { DeliveryMode } from '@/lib/webflow/cms-collection-schema'

type CreateLandingCollectionCardProps = {
  orgId: string
  integrationId: string
  defaultName?: string
  /** CMS fields created for this delivery mode (default: remote_runtime). */
  deliveryMode?: DeliveryMode
  onCreated?: (collection: { id: string; displayName?: string; slug?: string }) => void
  compact?: boolean
}

export function CreateLandingCollectionCard({
  orgId,
  integrationId,
  defaultName = 'Landing Pages',
  deliveryMode = 'remote_runtime',
  onCreated,
  compact = false,
}: CreateLandingCollectionCardProps) {
  const [name, setName] = useState(defaultName)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const templateSnippet = buildWebflowRuntimeCollectionEmbed()

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/integrations/webflow/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          integrationId,
          displayName: name.trim(),
          includeSectionFields: false,
          setAsPagesCollection: true,
          deliveryMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.alreadyExists && data.existingCollection) {
          onCreated?.(data.existingCollection)
          setSuccess(
            `Collection "${data.existingCollection.displayName ?? name}" already exists — selected it for you.`,
          )
          return
        }
        throw new Error(data.error ?? 'Failed to create collection')
      }

      setSuccess(
        data.templateAutoConfigured || data.runtimeAutoConfigured
          ? `Created "${name}" with ${data.fieldCount ?? 20} fields. Delivery scripts (runtime, split, iframe) auto-installed on your collection template custom code — no manual Designer paste.`
          : `Created "${name}" with ${data.fieldCount ?? 20} fields. Template scripts will auto-configure on first publish (or reconnect Webflow for immediate setup).`,
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
            Marketplace-ready schema: Title, Slug, Page ID, SEO, status. Content stays as JSON on Automaio; Webflow stores metadata only.
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
        <div className="space-y-2">
          <p className="text-[11px] text-emerald-400">{success}</p>
          <details className="rounded-lg border border-zinc-800 bg-zinc-950 p-2">
            <summary className="text-[10px] text-zinc-500 uppercase font-bold cursor-pointer">
              Optional manual fallback embed (only if auto-setup failed)
            </summary>
            <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap max-h-32 overflow-y-auto mt-2">{templateSnippet}</pre>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 mt-1 text-[10px] gap-1"
              onClick={async () => {
                await navigator.clipboard.writeText(templateSnippet)
                setCopiedSnippet(true)
                setTimeout(() => setCopiedSnippet(false), 2000)
              }}
            >
              {copiedSnippet ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copy fallback embed
            </Button>
          </details>
        </div>
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
        Create collection
      </Button>
    </div>
  )
}
