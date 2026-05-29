'use client'

import { useCallback, useEffect, useState } from 'react'
import { buildCollectionTemplateBodySnippet } from '@/lib/webflow/collection-template-shell'
import { WEBFLOW_DESIGNER_OPEN_STEPS } from '@/lib/webflow/designer-open-guide'
import { parseJsonResponse } from '@/lib/api/parse-json-response'
import { Check, Copy, Hammer, Loader2, RefreshCw, Zap, ChevronDown, ChevronUp } from 'lucide-react'

type EmbedSyncStatus = {
  needsInstall: boolean
  installed: boolean
  message?: string
}

type TemplateShellInstallerProps = {
  integrationId?: string | null
  collectionId?: string | null
  autoSync?: boolean
}

function formatInstallError(error?: string): string {
  if (error === 'no append target')
    return 'Select the Body element in the Navigator, then click Install render embed again.'
  if (error === 'not a cms template page')
    return 'Open your CMS collection template first (Pages → Collection pages → your template).'
  if (error === 'insecure dev shell')
    return 'Dev extension runs over HTTP. Upload bundle.zip and click Launch App, or run webflow extension serve locally.'
  if (error === 'not in designer')
    return 'Open Automaio from Webflow Designer (Apps panel → Launch App), not in a browser tab.'
  if (error === 'webflow API unavailable')
    return 'Webflow Designer API not ready. Use Launch App, reopen from the Apps panel, and ensure the latest bundle.zip is uploaded.'
  if (error === 'Designer bridge timeout')
    return 'Designer bridge did not respond. Make sure Automaio is open inside Webflow Designer, not a browser tab.'
  return `Install failed: ${error ?? 'unknown'}`
}

const css = `
  .am-tsi {
    --bg:      #0f0f16;
    --bg2:     #15151f;
    --bg3:     #1c1c2a;
    --bg-h:    #202030;
    --line:    rgba(255,255,255,0.07);
    --line-m:  rgba(255,255,255,0.12);
    --accent:  #7c6fff;
    --accent2: #a68eff;
    --t1:      #ededf4;
    --t2:      #9494aa;
    --t3:      #5a5a72;
    --ok:      #3dd68c;
    --warn:    #f59e0b;
    --danger:  #f87171;
    --mono:    'DM Mono', 'Fira Code', monospace;
    --font:    'DM Sans', system-ui, sans-serif;
    background: var(--bg2);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 12px;
    overflow: hidden;
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
  }

  /* Header strip */
  .am-tsi-header {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 13px;
    border-bottom: 1px solid var(--line);
    background: rgba(245,158,11,0.05);
  }
  .am-tsi-header-icon {
    display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px;
    background: rgba(245,158,11,0.15);
    border-radius: 7px;
    color: #fbbf24;
    flex-shrink: 0;
  }
  .am-tsi-header-text { flex: 1; min-width: 0; }
  .am-tsi-title {
    font-size: 12px;
    font-weight: 600;
    color: #fcd34d;
    letter-spacing: -0.1px;
    line-height: 1.2;
  }
  .am-tsi-sub {
    font-size: 11px;
    color: var(--t3);
    margin-top: 2px;
    line-height: 1.5;
  }
  .am-tsi-sub code {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--t2);
    background: var(--bg3);
    padding: 1px 5px;
    border-radius: 4px;
  }

  /* Installed pill */
  .am-tsi-installed {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--ok);
    background: rgba(61,214,140,0.1);
    border: 1px solid rgba(61,214,140,0.2);
    border-radius: 20px;
    padding: 3px 10px;
    margin: 10px 13px 0;
  }

  /* Body */
  .am-tsi-body { padding: 11px 13px; display: flex; flex-direction: column; gap: 10px; }

  /* Action buttons row */
  .am-tsi-actions { display: flex; flex-wrap: wrap; gap: 6px; }

  .am-tsi-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 500;
    font-family: var(--font);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s, transform 0.1s;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .am-tsi-btn:active:not(:disabled) { transform: scale(0.97); }
  .am-tsi-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .am-tsi-btn-primary {
    background: var(--accent);
    color: #fff;
  }
  .am-tsi-btn-primary:hover:not(:disabled) { background: #8b82ff; }

  .am-tsi-btn-ghost {
    background: var(--bg3);
    border-color: var(--line-m);
    color: var(--t2);
  }
  .am-tsi-btn-ghost:hover:not(:disabled) { background: var(--bg-h); border-color: rgba(255,255,255,0.18); color: var(--t1); }

  .am-tsi-btn-copy {
    background: var(--bg3);
    border-color: var(--line-m);
    color: var(--t2);
    margin-left: auto;
  }
  .am-tsi-btn-copy:hover:not(:disabled) { background: var(--bg-h); color: var(--t1); }
  .am-tsi-btn-copy.copied { color: var(--ok); border-color: rgba(61,214,140,0.3); background: rgba(61,214,140,0.08); }

  @keyframes am-spin { to { transform: rotate(360deg); } }
  .am-spin { animation: am-spin 0.8s linear infinite; }

  /* Message alert */
  .am-tsi-msg {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 11.5px;
    line-height: 1.55;
    border: 1px solid;
  }
  .am-tsi-msg-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
  }
  .am-tsi-msg.info    { background: rgba(124,111,255,0.07); border-color: rgba(124,111,255,0.22); color: #c4b5fd; }
  .am-tsi-msg.info    .am-tsi-msg-dot { background: var(--accent2); }
  .am-tsi-msg.success { background: rgba(61,214,140,0.07);  border-color: rgba(61,214,140,0.2);  color: #6ee7b7; }
  .am-tsi-msg.success .am-tsi-msg-dot { background: var(--ok); }
  .am-tsi-msg.error   { background: rgba(248,113,113,0.07); border-color: rgba(248,113,113,0.22); color: #fca5a5; }
  .am-tsi-msg.error   .am-tsi-msg-dot { background: var(--danger); }

  /* Designer steps */
  .am-tsi-guide-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 0 0;
    background: none;
    border: none;
    font-size: 11px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--t3);
    cursor: pointer;
    transition: color 0.12s;
    width: 100%;
  }
  .am-tsi-guide-toggle:hover { color: var(--t2); }

  .am-tsi-guide {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-top: 6px;
  }
  .am-tsi-guide-step {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .am-tsi-step-num {
    width: 17px; height: 17px;
    border-radius: 5px;
    background: var(--bg3);
    border: 1px solid var(--line-m);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px;
    font-weight: 600;
    font-family: var(--mono);
    color: var(--t3);
    flex-shrink: 0;
    margin-top: 1px;
  }
  .am-tsi-step-text {
    font-size: 11px;
    color: var(--t3);
    line-height: 1.5;
  }

  .am-tsi-divider { height: 1px; background: var(--line); margin: 2px -13px 0; }
`

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
  const [guideOpen, setGuideOpen] = useState(false)

  const inDesignerShell =
    typeof window !== 'undefined' && window.location.search.includes('embedded=1')

  const queryBridgeStatus = useCallback(() => {
    return new Promise<{
      webflowAvailable?: boolean
      insecureDevShell?: boolean
      inDesignerContext?: boolean
      hint?: string
    }>((resolve) => {
      const timeout = window.setTimeout(() => resolve({}), 3000)
      const onMessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; status?: Record<string, unknown> }
        if (data?.type !== 'automaio-bridge-status-result') return
        window.clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        resolve((data.status ?? {}) as { webflowAvailable?: boolean; insecureDevShell?: boolean; inDesignerContext?: boolean; hint?: string })
      }
      window.addEventListener('message', onMessage)
      window.parent.postMessage({ type: 'automaio-bridge-status-request' }, '*')
    })
  }, [])

  const markInstalled = useCallback(async (id: string, cid: string) => {
    await fetch(`/api/integrations/webflow/${id}/render-embed`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId: cid, installed: true }),
    })
  }, [])

  const requestDesignerEmbed = useCallback(() => {
    return new Promise<{ ok?: boolean; alreadyInstalled?: boolean; created?: boolean; error?: string }>((resolve) => {
      const timeout = window.setTimeout(() => resolve({ ok: false, error: 'Designer bridge timeout' }), 12000)
      const onMessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; result?: { ok?: boolean; alreadyInstalled?: boolean; created?: boolean; error?: string } }
        if (data?.type !== 'automaio-sync-render-embed-result') return
        window.clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        resolve(data.result ?? { ok: false })
      }
      window.addEventListener('message', onMessage)
      window.parent.postMessage({ type: 'automaio-sync-render-embed' }, '*')
    })
  }, [])

  const runEmbedSync = useCallback(async (options?: { manual?: boolean }) => {
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
        setMessage('Open Webflow Designer with Automaio on your CMS template — embed installs automatically.')
        return
      }
      setMessageType('info')
      setMessage('Installing SEO render embed on this collection template…')
      const bridgeStatus = await queryBridgeStatus()
      if (bridgeStatus.insecureDevShell) { setMessageType('error'); setMessage(formatInstallError('insecure dev shell')); return }
      const result = await requestDesignerEmbed()
      if (result.ok) {
        await markInstalled(integrationId, collectionId)
        setStatus({ needsInstall: false, installed: true })
        setMessageType('success')
        setMessage(result.alreadyInstalled
          ? 'Render embed already on this template. Publish the site in Webflow if you haven\'t yet.'
          : 'Render embed installed. Turn ON Publish settings for this template, then publish the site.')
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
  }, [collectionId, inDesignerShell, integrationId, markInstalled, queryBridgeStatus, requestDesignerEmbed])

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
        if (!data.needsInstall) { setMessageType('success'); setMessage(data.message ?? 'SEO render embed is ready.'); return }
        if (!inDesignerShell) { setMessageType('info'); setMessage('Open Webflow Designer with Automaio on your CMS template — embed installs automatically.'); return }
        setMessageType('info')
        setMessage('Installing SEO render embed…')
        const bridgeStatus = await queryBridgeStatus()
        if (cancelled) return
        if (bridgeStatus.insecureDevShell) { setMessageType('error'); setMessage(formatInstallError('insecure dev shell')); return }
        const result = await requestDesignerEmbed()
        if (cancelled) return
        if (result.ok) {
          await markInstalled(integrationId, collectionId)
          setStatus({ needsInstall: false, installed: true })
          setMessageType('success')
          setMessage(result.alreadyInstalled ? 'Render embed already on this template.' : 'Render embed installed. Publish the site in Webflow.')
        } else {
          setMessageType('error')
          setMessage(formatInstallError(result.error))
        }
      } catch (err) {
        if (!cancelled) { setMessageType('error'); setMessage(err instanceof Error ? err.message : 'Embed sync failed') }
      } finally {
        if (!cancelled) setSyncing(false)
      }
    })()
    return () => { cancelled = true }
  }, [autoSync, collectionId, inDesignerShell, integrationId, markInstalled, queryBridgeStatus, requestDesignerEmbed])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; result?: { ok?: boolean; error?: string } }
      if (data?.type !== 'automaio-install-template-shell-result') return
      setSyncing(false)
      if (data.result?.ok && integrationId && collectionId) void markInstalled(integrationId, collectionId)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [collectionId, integrationId, markInstalled])

  const copySnippet = async () => {
    await navigator.clipboard.writeText(buildCollectionTemplateBodySnippet())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="am-tsi">

        {/* Header */}
        <div className="am-tsi-header">
          <div className="am-tsi-header-icon"><Zap size={13} /></div>
          <div className="am-tsi-header-text">
            <div className="am-tsi-title">Direct HTML render setup</div>
            <div className="am-tsi-sub">
              One-time embed on your CMS template using{' '}
              <code>generated-html</code> / <code>generated-css</code>.
              No JS injection — use Remote runtime for JS rendering.
            </div>
          </div>
        </div>

        {/* Installed indicator */}
        {status && !status.needsInstall && (
          <div className="am-tsi-installed">
            <Check size={11} />
            Render embed installed on this collection
          </div>
        )}

        <div className="am-tsi-body">

          {/* Action buttons */}
          <div className="am-tsi-actions">
            <button
              className="am-tsi-btn am-tsi-btn-primary"
              disabled={syncing}
              onClick={() => void runEmbedSync({ manual: true })}
            >
              {syncing
                ? <Loader2 size={12} className="am-spin" />
                : <RefreshCw size={12} />}
              {inDesignerShell ? 'Install render embed' : 'Check embed status'}
            </button>

            {inDesignerShell && (
              <button
                className="am-tsi-btn am-tsi-btn-ghost"
                disabled={syncing}
                onClick={() => void runEmbedSync({ manual: true })}
              >
                <Hammer size={12} />
                Retry install
              </button>
            )}

            <button
              className={`am-tsi-btn am-tsi-btn-copy${copied ? ' copied' : ''}`}
              onClick={() => void copySnippet()}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy snippet'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`am-tsi-msg ${messageType}`}>
              <div className="am-tsi-msg-dot" />
              <span>{message}</span>
            </div>
          )}

          <div className="am-tsi-divider" />

          {/* Collapsible guide */}
          <button className="am-tsi-guide-toggle" onClick={() => setGuideOpen(v => !v)}>
            {guideOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            How to open Webflow Designer
          </button>

          {guideOpen && (
            <div className="am-tsi-guide">
              {WEBFLOW_DESIGNER_OPEN_STEPS.map((step, i) => (
                <div key={step} className="am-tsi-guide-step">
                  <div className="am-tsi-step-num">{i + 1}</div>
                  <div className="am-tsi-step-text">{step}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}