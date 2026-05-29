'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Info, Link2, Terminal } from 'lucide-react'

type WebflowSetupNoticeProps = {
  context: 'install' | 'designer'
}

const css = `
  .am-notice {
    --bg:      #0f0f16;
    --line:    rgba(255,255,255,0.07);
    --t1:      #ededf4;
    --t2:      #9494aa;
    --t3:      #5a5a72;
    --accent:  #7c6fff;
    --ok:      #3dd68c;
    --warn:    #f59e0b;
    --danger:  #f87171;
    --mono:    'DM Mono', 'Fira Code', monospace;
    --font:    'DM Sans', system-ui, sans-serif;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 13px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
    margin-bottom: 0;
    animation: am-slide-in 0.2s ease;
  }
  @keyframes am-slide-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .am-notice.info    { border-color: rgba(124,111,255,0.25); background: rgba(124,111,255,0.07); }
  .am-notice.warn    { border-color: rgba(245,158,11,0.25);  background: rgba(245,158,11,0.07); }
  .am-notice.danger  { border-color: rgba(248,113,113,0.25); background: rgba(248,113,113,0.07); }
  .am-notice.neutral { border-color: rgba(61,214,140,0.2);   background: rgba(61,214,140,0.06); }

  .am-notice-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    border-radius: 7px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .am-notice.info    .am-notice-icon { background: rgba(124,111,255,0.18); color: #a68eff; }
  .am-notice.warn    .am-notice-icon { background: rgba(245,158,11,0.18);  color: #fbbf24; }
  .am-notice.danger  .am-notice-icon { background: rgba(248,113,113,0.18); color: #f87171; }
  .am-notice.neutral .am-notice-icon { background: rgba(61,214,140,0.18);  color: #3dd68c; }

  .am-notice-body { flex: 1; min-width: 0; }

  .am-notice-title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.1px;
    line-height: 1.3;
    margin-bottom: 5px;
  }
  .am-notice.info    .am-notice-title { color: #c4b5fd; }
  .am-notice.warn    .am-notice-title { color: #fcd34d; }
  .am-notice.danger  .am-notice-title { color: #fca5a5; }
  .am-notice.neutral .am-notice-title { color: #6ee7b7; }

  .am-notice-desc {
    font-size: 11.5px;
    color: var(--t2);
    line-height: 1.6;
  }
  .am-notice-desc p { margin: 0 0 5px; }
  .am-notice-desc p:last-child { margin: 0; }
  .am-notice-desc strong { color: var(--t1); font-weight: 500; }

  .am-notice-desc code {
    font-family: var(--mono);
    font-size: 10.5px;
    padding: 1px 5px;
    border-radius: 4px;
    letter-spacing: 0;
  }
  .am-notice.info    .am-notice-desc code { color: #c4b5fd; background: rgba(124,111,255,0.15); }
  .am-notice.warn    .am-notice-desc code { color: #fcd34d; background: rgba(245,158,11,0.15); }
  .am-notice.danger  .am-notice-desc code { color: #fca5a5; background: rgba(248,113,113,0.15); }
  .am-notice.neutral .am-notice-desc code { color: #6ee7b7; background: rgba(61,214,140,0.12); }

  .am-notice-url {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 7px;
    padding: 6px 9px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 7px;
    font-family: var(--mono);
    font-size: 10.5px;
    color: #6ee7b7;
    word-break: break-all;
    line-height: 1.4;
  }
`

export function WebflowSetupNotice({ context }: WebflowSetupNoticeProps) {
  const [origin, setOrigin] = useState('')
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const isWebflowExt = origin.includes('webflow-ext.com')
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
  const envMismatch =
    publicAppUrl && origin && publicAppUrl !== origin && !isLocalhost && !isWebflowExt

  if (!origin) return null

  if (context === 'designer' && isWebflowExt) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="am-notice info">
          <div className="am-notice-icon"><Info size={13} /></div>
          <div className="am-notice-body">
            <div className="am-notice-title">Designer panel · webflow-ext.com</div>
            <div className="am-notice-desc">
              <p>
                The fixed URI <code>*.webflow-ext.com</code> is correct — Webflow hosts the
                extension shell. Your app loads inside it from{' '}
                <code>https://automaio.kilo1app.com</code> (or your{' '}
                <code>NEXT_PUBLIC_APP_URL</code>).
              </p>
              <p>
                Blank panel? Run <code>npm run dev</code> and{' '}
                <code>npm run webflow:extension</code>, then choose{' '}
                <strong>Launch Development App</strong> in Webflow.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (context === 'designer' && isLocalhost) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="am-notice danger">
          <div className="am-notice-icon"><AlertTriangle size={13} /></div>
          <div className="am-notice-body">
            <div className="am-notice-title">Wrong host for Designer</div>
            <div className="am-notice-desc">
              <p>
                You opened <code>localhost</code> directly. In Webflow Designer, use Apps → your
                app — it loads via <code>webflow-ext.com</code>, not localhost.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (envMismatch) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="am-notice warn">
          <div className="am-notice-icon"><AlertTriangle size={13} /></div>
          <div className="am-notice-body">
            <div className="am-notice-title">App URL mismatch</div>
            <div className="am-notice-desc">
              <p>
                Browser is on <code>{origin}</code> but <code>NEXT_PUBLIC_APP_URL</code> is{' '}
                <code>{publicAppUrl}</code>. Update both to the same live URL and restart the dev
                server.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (context === 'install' && !isLocalhost) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="am-notice neutral">
          <div className="am-notice-icon"><Link2 size={13} /></div>
          <div className="am-notice-body">
            <div className="am-notice-title">Webflow install URL</div>
            <div className="am-notice-desc">
              <div className="am-notice-url">
                <Terminal size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
                {publicAppUrl || origin}/webflow/install
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
}