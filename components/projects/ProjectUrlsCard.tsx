'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, Link2 } from 'lucide-react'
import { buildProjectIframeUrl } from '@/lib/webflow/embed-page'

type ProjectUrlsCardProps = {
  projectId: string
  liveUrl?: string | null
  embedSnippet?: string | null
  appBaseUrl?: string
  compact?: boolean
}

export function ProjectUrlsCard({
  projectId,
  liveUrl,
  embedSnippet,
  appBaseUrl,
  compact,
}: ProjectUrlsCardProps) {
  const [copied, setCopied] = useState<'preview' | 'live' | 'embed' | null>(null)

  const previewUrl =
    appBaseUrl?.replace(/\/$/, '')
      ? buildProjectIframeUrl(appBaseUrl, projectId)
      : buildProjectIframeUrl(
          typeof window !== 'undefined' ? window.location.origin : '',
          projectId,
        )

  const copy = async (text: string, key: 'preview' | 'live' | 'embed') => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={`space-y-3 ${compact ? '' : 'rounded-lg border border-zinc-800 bg-zinc-900/50 p-4'}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5" />
        Page URLs
      </p>

      <UrlRow
        label="Preview (Automaio embed)"
        url={previewUrl}
        onCopy={() => copy(previewUrl, 'preview')}
        copied={copied === 'preview'}
      />

      {liveUrl && (
        <UrlRow
          label="Live Webflow page"
          url={liveUrl}
          onCopy={() => copy(liveUrl, 'live')}
          copied={copied === 'live'}
        />
      )}

      {embedSnippet && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Embed snippet</p>
          <pre className="text-[10px] font-mono text-zinc-400 bg-black/40 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-h-24">
            {embedSnippet}
          </pre>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[10px] border-zinc-700 gap-1.5 w-full"
            onClick={() => copy(embedSnippet, 'embed')}
          >
            <Copy className="h-3 w-3" />
            {copied === 'embed' ? 'Copied!' : 'Copy embed code'}
          </Button>
        </div>
      )}
    </div>
  )
}

function UrlRow({
  label,
  url,
  onCopy,
  copied,
}: {
  label: string
  url: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
      <div className="flex gap-1">
        <code className="flex-1 text-[10px] text-zinc-300 bg-black/40 px-2 py-1.5 rounded truncate">
          {url}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0 border-zinc-700"
          onClick={onCopy}
          title="Copy URL"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0 border-zinc-700"
          asChild
        >
          <a href={url} target="_blank" rel="noreferrer" title="Open">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
      {copied && <p className="text-[10px] text-emerald-400">Copied!</p>}
    </div>
  )
}
