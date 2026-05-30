'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Monitor, Copy, Check, RefreshCw, Layers, AlertCircle, WifiOff } from 'lucide-react'
import type { DesignerScreenSummary } from '@/lib/webflow/designer-screens'
import { parseJsonResponse } from '@/lib/api/parse-json-response'

type DesignerScreensPanelProps = {
  siteId: string | null
}

const css = `
  .am-screens {
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
    --danger:  #f87171;
    --mono:    'DM Mono', 'Fira Code', monospace;
    --font:    'DM Sans', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
  }

  /* Section header */
  .am-screens-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .am-screens-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--t3);
  }
  .am-screens-title-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px; height: 22px;
    border-radius: 6px;
    background: rgba(124,111,255,0.12);
    color: var(--accent2);
  }
  .am-btn-refresh {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 9px;
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: 7px;
    font-size: 11px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--t3);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .am-btn-refresh:hover { background: var(--bg-h); border-color: var(--line-m); color: var(--t2); }
  @keyframes am-spin { to { transform: rotate(360deg); } }
  .am-spin { animation: am-spin 0.8s linear infinite; }

  /* Empty / error states */
  .am-screens-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 20px 16px;
    background: var(--bg2);
    border: 1px dashed var(--line-m);
    border-radius: 10px;
    text-align: center;
  }
  .am-screens-state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px; height: 30px;
    border-radius: 8px;
    background: var(--bg3);
  }
  .am-screens-state p {
    font-size: 11.5px;
    color: var(--t3);
    line-height: 1.5;
    margin: 0;
  }
  .am-screens-state.danger .am-screens-state-icon { background: rgba(248,113,113,0.1); }
  .am-screens-state.danger p { color: rgba(248,113,113,0.8); }
  .am-screens-state code {
    font-family: var(--mono);
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--bg3);
    color: var(--t2);
  }

  /* Screen pills */
  .am-screen-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    max-height: 96px;
    overflow-y: auto;
    padding-right: 2px;
  }
  .am-screen-pills::-webkit-scrollbar { width: 3px; }
  .am-screen-pills::-webkit-scrollbar-track { background: transparent; }
  .am-screen-pills::-webkit-scrollbar-thumb { background: var(--line-m); border-radius: 2px; }

  .am-screen-pill {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 6px 10px;
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
    max-width: 148px;
    min-width: 0;
    text-align: left;
  }
  .am-screen-pill:hover { background: var(--bg-h); border-color: var(--line-m); }
  .am-screen-pill.active {
    background: rgba(124,111,255,0.12);
    border-color: rgba(124,111,255,0.35);
  }
  .am-screen-pill-name {
    font-size: 11px;
    font-weight: 500;
    color: var(--t2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .am-screen-pill.active .am-screen-pill-name { color: #c4b5fd; }
  .am-screen-pill-slug {
    font-size: 10px;
    font-family: var(--mono);
    color: var(--t3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Detail card */
  .am-screen-detail {
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
  }

  /* Badges row */
  .am-screen-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--line);
  }
  .am-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 500;
    font-family: var(--mono);
  }
  .am-badge-type {
    background: rgba(124,111,255,0.12);
    color: var(--accent2);
    border: 1px solid rgba(124,111,255,0.25);
  }
  .am-badge-cms {
    background: rgba(61,214,140,0.1);
    color: var(--ok);
    border: 1px solid rgba(61,214,140,0.2);
  }

  /* Preview iframe wrapper */
  .am-screen-preview {
    position: relative;
    background: #fff;
    border-bottom: 1px solid var(--line);
  }
  .am-screen-preview iframe {
    width: 100%;
    height: 200px;
    display: block;
    border: none;
  }

  /* CMS snippet */
  .am-snippet {
    padding: 10px 12px;
  }
  .am-snippet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .am-snippet-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.2px;
    text-transform: uppercase;
    color: var(--t3);
  }
  .am-btn-copy {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    background: var(--bg3);
    border: 1px solid var(--line-m);
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--t2);
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .am-btn-copy:hover { background: var(--bg-h); color: var(--t1); }
  .am-btn-copy.copied { color: var(--ok); border-color: rgba(61,214,140,0.3); background: rgba(61,214,140,0.08); }

  .am-snippet-pre {
    background: var(--bg3);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 10px 12px;
    font-family: var(--mono);
    font-size: 10px;
    line-height: 1.7;
    color: var(--t2);
    overflow-x: auto;
    white-space: pre;
    margin: 0;
  }
  .am-snippet-pre .tok-tag    { color: #7dd3fc; }
  .am-snippet-pre .tok-attr   { color: var(--accent2); }
  .am-snippet-pre .tok-wf     { color: #86efac; }
  .am-seo-box {
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
    background: rgba(124,111,255,0.04);
  }
  .am-seo-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.25px;
    text-transform: uppercase;
    color: var(--t3);
    margin-bottom: 6px;
  }
  .am-seo-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--t1);
    margin: 0 0 4px;
    line-height: 1.4;
  }
  .am-seo-desc {
    font-size: 11px;
    color: var(--t2);
    margin: 0;
    line-height: 1.5;
  }
  .am-paste-steps {
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
    background: var(--bg3);
  }
  .am-paste-steps ol {
    margin: 6px 0 0;
    padding-left: 18px;
    font-size: 11px;
    color: var(--t2);
    line-height: 1.55;
  }
  .am-paste-steps strong { color: var(--t1); font-weight: 500; }
  .am-snippet-pre .tok-str    { color: #fcd34d; }
`

const SNIPPET = `<div class="ai-wrapper">
  <style>
    {{wf {"path":"cssContent","type":"PlainText"} }}
  </style>

    {{wf {"path":"htmlContent","type":"PlainText"} }}
</div>`

function SnippetHighlight() {
  return (
    <pre className="am-snippet-pre">
      <span className="tok-tag">&lt;div</span>{' '}
      <span className="tok-attr">class</span>=
      <span className="tok-str">"ai-wrapper"</span>
      <span className="tok-tag">&gt;</span>{'\n'}
      {'  '}
      <span className="tok-tag">&lt;style&gt;</span>{'\n'}
      {'    '}
      <span className="tok-wf">{'{{wf {"path":"cssContent","type":"PlainText"} }}'}</span>{'\n'}
      {'  '}
      <span className="tok-tag">&lt;/style&gt;</span>{'\n\n'}
      {'    '}
      <span className="tok-wf">{'{{wf {"path":"htmlContent","type":"PlainText"} }}'}</span>{'\n'}
      <span className="tok-tag">&lt;/div&gt;</span>
    </pre>
  )
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
        setSelectedId(data.screens![0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screens')
      setScreens([])
    } finally {
      setLoading(false)
    }
  }, [siteId, selectedId])

  useEffect(() => { void loadScreens() }, [loadScreens])

  const copySnippet = async () => {
    if (!selected?.cmsBindingSnippet) return
    await navigator.clipboard.writeText(selected.cmsBindingSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!siteId) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="am-screens-state">
          <div className="am-screens-state-icon">
            <WifiOff size={14} style={{ color: 'var(--t3)' }} />
          </div>
          <p>Connect Webflow to load published screens for this site.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="am-screens">

        {/* Header */}
        <div className="am-screens-head">
          <div className="am-screens-title">
            <div className="am-screens-title-icon">
              <Layers size={12} />
            </div>
            Published screens
          </div>
          <button className="am-btn-refresh" onClick={() => void loadScreens()} disabled={loading}>
            <RefreshCw size={10} className={loading ? 'am-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* States */}
        {loading ? (
          <div className="am-screens-state">
            <Loader2 size={16} style={{ color: 'var(--t3)' }} className="am-spin" />
            <p>Loading screens…</p>
          </div>
        ) : error ? (
          <div className="am-screens-state danger">
            <div className="am-screens-state-icon">
              <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
            </div>
            <p>{error}</p>
          </div>
        ) : !integrationFound ? (
          <div className="am-screens-state">
            <div className="am-screens-state-icon">
              <Monitor size={14} style={{ color: 'var(--t3)' }} />
            </div>
            <p>No Automaio integration for site <code>{siteId}</code>. Connect in Settings.</p>
          </div>
        ) : screens.length === 0 ? (
          <div className="am-screens-state">
            <div className="am-screens-state-icon">
              <Monitor size={14} style={{ color: 'var(--t3)' }} />
            </div>
            <p>No published screens yet.<br />Publish a landing page from Automaio.</p>
          </div>
        ) : (
          <>
            {/* Screen pill selector */}
            <div className="am-screen-pills">
              {screens.map((screen) => (
                <button
                  key={screen.id}
                  type="button"
                  className={`am-screen-pill${selected?.id === screen.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(screen.id)}
                >
                  <span className="am-screen-pill-name">{screen.name}</span>
                  <span className="am-screen-pill-slug">{screen.slug || 'no-slug'}</span>
                </button>
              ))}
            </div>

            {/* Detail card */}
            {selected && (
              <div className="am-screen-detail">
                <div className="am-paste-steps">
                  <span className="am-snippet-label">Where to paste in Webflow</span>
                  <ol>
                    <li>Open <strong>Pages → your CMS collection template</strong></li>
                    <li>Add a <strong>Code Embed</strong> inside the Body</li>
                    <li>Paste the snippet below → save → publish site</li>
                  </ol>
                </div>

                {(selected.seoTitle || selected.seoDescription) && (
                  <div className="am-seo-box">
                    <div className="am-seo-label">SEO (from Automaio page settings)</div>
                    {selected.seoTitle && (
                      <p className="am-seo-title">{selected.seoTitle}</p>
                    )}
                    {selected.seoDescription && (
                      <p className="am-seo-desc">{selected.seoDescription}</p>
                    )}
                    {selected.slug && (
                      <p className="am-seo-desc" style={{ marginTop: 6 }}>
                        Slug: <code style={{ fontFamily: 'var(--mono)' }}>{selected.slug}</code>
                      </p>
                    )}
                  </div>
                )}

                <div className="am-screen-badges">
                  <span className="am-badge am-badge-type">{selected.configType}</span>
                  {selected.webflowCmsItemId && (
                    <span className="am-badge am-badge-cms">CMS synced</span>
                  )}
                </div>

                <div className="am-screen-preview">
                  <iframe
                    title={selected.name}
                    src={selected.previewUrl}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>

                <div className="am-snippet">
                  <div className="am-snippet-head">
                    <span className="am-snippet-label">CMS binding · split_method</span>
                    <button
                      className={`am-btn-copy${copied ? ' copied' : ''}`}
                      onClick={() => void copySnippet()}
                    >
                      {copied
                        ? <><Check size={10} /> Copied</>
                        : <><Copy size={10} /> Copy</>}
                    </button>
                  </div>
                  <SnippetHighlight />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}