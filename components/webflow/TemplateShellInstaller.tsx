'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buildCollectionTemplateBodySnippet } from '@/lib/webflow/collection-template-shell'
import { WEBFLOW_DESIGNER_OPEN_STEPS } from '@/lib/webflow/designer-open-guide'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { Check, Copy, Hammer, Loader2, RefreshCw } from 'lucide-react'

type EmbedSyncStatus = {
  needsInstall: boolean
  installed: boolean
  message?: string
}

type TemplateShellInstallerProps = {
  integrationId?: string | null
  collectionId?: string | null
  /** Auto-install render embed when panel opens inside Webflow Designer. */
  autoSync?: boolean
}

function formatInstallError(error?: string): string {
  if (error === 'no append target') {
    return 'Select the Body element in the Navigator, then click Install render embed again.'
  }
  if (error === 'not a cms template page') {
    return 'Open your CMS collection template first (Pages → Collection pages → your template).'
  }
  if (error === 'webflow API unavailable') {
    return 'Webflow Designer API not ready — close Automaio, reopen it from the Apps panel, then retry.'
  }
  if (error === 'Designer bridge timeout') {
    return 'Designer bridge did not respond. Make sure Automaio is open inside Webflow Designer (Apps panel), not in a browser tab.'
  }
  return `Install failed: ${error ?? 'unknown'}`
}

export function TemplateShellInstaller({
  integrationId,
  collectionId,
  autoSync = true,
}: TemplateShellInstallerProps) {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<EmbedSyncStatus | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [copied, setCopied] = useState(false)

  const inDesignerShell =
    typeof window !== 'undefined' &&
    (window.location.search.includes('embedded=1') || window.parent !== window)

  const markInstalled = useCallback(
    async (id: string, cid: string) => {
      await fetch(`/api/integrations/webflow/${id}/render-embed`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: cid, installed: true }),
      })
    },
    [],
  )

  const requestDesignerEmbed = useCallback(() => {
    return new Promise<{ ok?: boolean; alreadyInstalled?: boolean; created?: boolean; error?: string }>(
      (resolve) => {
        const timeout = window.setTimeout(() => resolve({ ok: false, error: 'Designer bridge timeout' }), 12000)

        const onMessage = (event: MessageEvent) => {
          const data = event.data as {
            type?: string
            result?: { ok?: boolean; alreadyInstalled?: boolean; created?: boolean; error?: string }
          }
          if (data?.type !== 'automaio-sync-render-embed-result') return
          window.clearTimeout(timeout)
          window.removeEventListener('message', onMessage)
          resolve(data.result ?? { ok: false })
        }

        window.addEventListener('message', onMessage)
        window.parent.postMessage({ type: 'automaio-sync-render-embed' }, '*')
      },
    )
  }, [])

  const runEmbedSync = useCallback(
    async (options?: { manual?: boolean }) => {
      if (!integrationId || !collectionId) {
        if (options?.manual) {
          setMessageType('error')
          setMessage('Connect Webflow and select a landing pages collection in Automaio settings first.')
        }
        return
      }

      setSyncing(true)
      setMessage('')
      try {
        const res = await fetch(
          `/api/integrations/webflow/${integrationId}/render-embed?collectionId=${encodeURIComponent(collectionId)}&configType=split_method`,
          { credentials: 'include' },
        )
        const data = await parseJsonResponse<EmbedSyncStatus>(res)
        setStatus(data)

        if (!data.needsInstall) {
          setMessageType('success')
          setMessage(data.message ?? 'SEO render embed is ready. Future publishes update CMS fields only.')
          return
        }

        if (!inDesignerShell) {
          setMessageType('info')
          setMessage(
            'Open Webflow Designer with Automaio (see steps below). The embed installs automatically when this panel loads on your CMS template.',
          )
          return
        }

        setMessageType('info')
        setMessage('Installing SEO render embed on this collection template…')

        const result = await requestDesignerEmbed()
        if (result.ok) {
          await markInstalled(integrationId, collectionId)
          setStatus({ needsInstall: false, installed: true })
          setMessageType('success')
          setMessage(
            result.alreadyInstalled
              ? 'Render embed already on this template. Publish the site in Webflow if you have not yet.'
              : 'Render embed installed. Turn ON Publish settings for this template, then publish the site in Webflow.',
          )
        } else {
          setMessageType('error')
          setMessage(formatInstallError(result.error))
        }
      } catch (err) {
        setMessageType('error')
        setMessage(err instanceof Error ? err.message : 'Embed sync failed')
      } finally {
        setSyncing(false)
      }
    },
    [collectionId, inDesignerShell, integrationId, markInstalled, requestDesignerEmbed],
  )

  useEffect(() => {
    if (!autoSync || !integrationId || !collectionId) return

    let cancelled = false
    ;(async () => {
      setSyncing(true)
      try {
        const res = await fetch(
          `/api/integrations/webflow/${integrationId}/render-embed?collectionId=${encodeURIComponent(collectionId)}&configType=split_method`,
          { credentials: 'include' },
        )
        const data = await parseJsonResponse<EmbedSyncStatus>(res)
        if (cancelled) return
        setStatus(data)

        if (!data.needsInstall) {
          setMessageType('success')
          setMessage(data.message ?? 'SEO render embed is ready.')
          return
        }

        if (!inDesignerShell) {
          setMessageType('info')
          setMessage('Open Webflow Designer with Automaio on your CMS template — embed installs automatically.')
          return
        }

        setMessageType('info')
        setMessage('Installing SEO render embed…')
        const result = await requestDesignerEmbed()
        if (cancelled) return
        if (result.ok) {
          await markInstalled(integrationId, collectionId)
          setStatus({ needsInstall: false, installed: true })
          setMessageType('success')
          setMessage(
            result.alreadyInstalled
              ? 'Render embed already on this template.'
              : 'Render embed installed. Publish the site in Webflow.',
          )
        } else {
          setMessageType('error')
          setMessage(formatInstallError(result.error))
        }
      } catch (err) {
        if (!cancelled) {
          setMessageType('error')
          setMessage(err instanceof Error ? err.message : 'Embed sync failed')
        }
      } finally {
        if (!cancelled) setSyncing(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [autoSync, collectionId, inDesignerShell, integrationId, markInstalled, requestDesignerEmbed])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; result?: { ok?: boolean; error?: string } }
      if (data?.type !== 'automaio-install-template-shell-result') return
      setSyncing(false)
      if (data.result?.ok && integrationId && collectionId) {
        void markInstalled(integrationId, collectionId)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [collectionId, integrationId, markInstalled])

  const installViaDesigner = () => {
    void runEmbedSync({ manual: true })
  }

  const copySnippet = async () => {
    await navigator.clipboard.writeText(buildCollectionTemplateBodySnippet())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-amber-200">Direct HTML render setup</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Server-side SEO rendering uses a one-time Embed on your CMS collection template (
          <code className="text-[10px]">generated-html</code> / <code className="text-[10px]">generated-css</code>
          ). No JavaScript injection — use Remote runtime mode if you need JS rendering.
        </p>
      </div>

      {status && !status.needsInstall && (
        <p className="text-[10px] text-emerald-400/90">Render embed: installed on this collection.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-8 text-[11px]"
          disabled={syncing}
          onClick={() => void runEmbedSync({ manual: true })}
        >
          {syncing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <RefreshCw className="size-3.5 mr-1" />}
          {inDesignerShell ? 'Install render embed' : 'Check embed status'}
        </Button>
        {inDesignerShell && (
          <Button size="sm" variant="outline" className="h-8 text-[11px]" disabled={syncing} onClick={installViaDesigner}>
            <Hammer className="size-3.5 mr-1" />
            Retry Designer install
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => void copySnippet()}>
          {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
          Copy fallback snippet
        </Button>
      </div>

      {message && (
        <Alert
          className={
            messageType === 'error'
              ? 'border-destructive/30 bg-destructive/5 py-2'
              : messageType === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/5 py-2'
                : 'border-primary/20 bg-primary/5 py-2'
          }
        >
          <AlertTitle className="text-xs">Render embed</AlertTitle>
          <AlertDescription className="text-[11px]">{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground">How to open Webflow Designer</p>
        <ol className="text-[10px] text-muted-foreground list-decimal list-inside space-y-0.5">
          {WEBFLOW_DESIGNER_OPEN_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
