'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react'

export type SectionCmsMappingRow = {
  logicalKey: string
  label: string
  webflowSlug: string | null
  value: string
  status: 'mapped' | 'missing_field' | 'empty'
}

type SectionCmsMappingPreviewProps = {
  rows: SectionCmsMappingRow[]
  mappedCount?: number
  compact?: boolean
}

export function SectionCmsMappingPreview({
  rows,
  mappedCount,
  compact = false,
}: SectionCmsMappingPreviewProps) {
  const mapped = mappedCount ?? rows.filter((r) => r.status === 'mapped').length
  const missing = rows.filter((r) => r.status === 'missing_field').length
  const withContent = rows.filter((r) => r.value).length

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Section CMS mapping</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            AI section content → Webflow collection fields
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            mapped > 0
              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
              : 'border-zinc-700 text-zinc-500'
          }
        >
          {mapped} mapped
        </Badge>
      </div>

      {!compact && missing > 0 && (
        <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 text-[11px] text-amber-400/90">
          {missing} section{missing !== 1 ? 's have' : ' has'} content but no matching CMS field.
          Create a landing page collection with section fields to sync them on publish.
        </div>
      )}

      <div className="divide-y divide-zinc-800/80 max-h-[240px] overflow-y-auto">
        {rows.map((row) => (
          <div key={row.logicalKey} className="px-4 py-2.5 flex items-start gap-3">
            <StatusIcon status={row.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-zinc-300">{row.label}</span>
                {row.webflowSlug ? (
                  <code className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                    {row.webflowSlug}
                  </code>
                ) : (
                  <span className="text-[10px] text-amber-500/80">No CMS field</span>
                )}
              </div>
              {row.value ? (
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{row.value}</p>
              ) : (
                <p className="text-[11px] text-zinc-600 mt-1 italic">No content yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
          {withContent} sections with content · {mapped} will sync on publish
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: SectionCmsMappingRow['status'] }) {
  if (status === 'mapped') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
  }
  if (status === 'missing_field') {
    return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
  }
  return <MinusCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
}
