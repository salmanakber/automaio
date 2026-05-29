'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Monitor, Copy, Check } from 'lucide-react'
import type { DesignerScreenSummary } from '@/lib/webflow/designer-screens'
import { parseJsonResponse } from '@/lib/api/parse-json-response'

type DesignerScreensPanelProps = {
  siteId: string | null
}

export function DesignerScreensPanel({ siteId }: DesignerScreensPanelProps) {
  const [screens, setScreens] = useState<DesignerScreenSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [integrationFound, setIntegrationFound] = useState(true)

  const selected = screens.find((s) => s.id === selectedId) ?? screens[0] ?? null

  const loadScreens = useCallback(async () => {
    if (!siteId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/webflow/designer/screens?siteId=${encodeURIComponent(siteId)}`, {
        credentials: 'include',
      })
      const data = await parseJsonResponse<{
        screens?: DesignerScreenSummary[]
        integrationFound?: boolean
        error?: string
      }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Failed to load screens')
      setScreens(data.screens ?? [])
      setIntegrationFound(data.integrationFound !== false)
      if ((data.screens ?? []).length && !selectedId) {
        setSelectedId(data.screens[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screens')
      setScreens([])
    } finally {
      setLoading(false)
    }
  }, [siteId, selectedId])

  useEffect(() => {
    void loadScreens()
  }, [loadScreens])

  const copySnippet = async () => {
    if (!selected?.cmsBindingSnippet) return
    await navigator.clipboard.writeText(selected.cmsBindingSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!siteId) {
    return (
      <div className="rounded-md border border-dashed p-3 text-[11px] text-muted-foreground">
        Connect Webflow to load published screens for this site.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Monitor className="size-3.5 text-primary" />
          <p className="text-xs font-medium">Published screens</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => void loadScreens()}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-4 justify-center">
          <Loader2 className="size-3.5 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : !integrationFound ? (
        <p className="text-[11px] text-muted-foreground">
          No Automaio integration for site <code className="text-[10px]">{siteId}</code>. Connect in Settings.
        </p>
      ) : screens.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No published screens yet. Publish a landing page from Automaio.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {screens.map((screen) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => setSelectedId(screen.id)}
                className={`rounded-md border px-2 py-1 text-left text-[10px] transition-colors ${
                  selected?.id === screen.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <span className="font-medium block truncate max-w-[140px]">{screen.name}</span>
                <span className="opacity-70">{screen.slug || 'no-slug'}</span>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="space-y-2 rounded-md border bg-muted/20 p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[9px]">
                  {selected.configType}
                </Badge>
                {selected.webflowCmsItemId ? (
                  <Badge variant="outline" className="text-[9px]">
                    CMS synced
                  </Badge>
                ) : null}
              </div>

              <iframe
                title={selected.name}
                src={selected.previewUrl}
                className="w-full h-[220px] rounded border bg-white"
                sandbox="allow-scripts allow-same-origin"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-muted-foreground">CMS binding (split_method)</p>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => void copySnippet()}>
                    {copied ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                    Copy
                  </Button>
                </div>
                <pre className="text-[9px] leading-relaxed overflow-x-auto rounded bg-background border p-2 whitespace-pre-wrap font-mono">
                  {`<div class="ai-wrapper">
  <style>
    {{wf {"path":"cssContent","type":"PlainText"} }}
  </style>

    {{wf {"path":"htmlContent","type":"PlainText"} }}
</div>`}
                </pre>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
