'use client'

import { useCallback, useEffect, useState } from 'react'
import { BRAND } from '@/lib/brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  Loader2,
  LogOut,
  FolderKanban,
  Mail,
  FileInput,
  CalendarDays,
  Plus,
  LayoutDashboard,
  Rocket,
  LayoutTemplate,
  CheckCircle2,
  Circle,
  ChevronRight,
} from 'lucide-react'
import { WebflowSetupNotice } from '@/components/webflow/WebflowSetupNotice'
import { DesignerAuthOnboarding } from '@/components/webflow/DesignerAuthOnboarding'
import { DesignerScreensPanel } from '@/components/webflow/DesignerScreensPanel'
import { TemplateShellInstaller } from '@/components/webflow/TemplateShellInstaller'
import type { OrgSetupStatus } from '@/lib/organizations/setup-status'

/* ─── Inline styles ───────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .am-panel {
    --bg0:      #09090d;
    --bg1:      #0f0f16;
    --bg2:      #15151f;
    --bg3:      #1c1c2a;
    --bg-hover: #202030;
    --line:     rgba(255,255,255,0.07);
    --line-mid: rgba(255,255,255,0.12);
    --accent:   #7c6fff;
    --accent2:  #a68eff;
    --ok:       #3dd68c;
    --warn:     #f59e0b;
    --danger:   #f87171;
    --t1:       #ededf4;
    --t2:       #9494aa;
    --t3:       #5a5a72;
    --font:     'DM Sans', system-ui, sans-serif;
    --mono:     'DM Mono', monospace;
    --r:        10px;
    --r-lg:     14px;
    min-height: 0;
    background: var(--bg0);
    font-family: var(--font);
    color: var(--t1);
    -webkit-font-smoothing: antialiased;
    padding: 0;
  }

  /* Header */
  .am-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 14px 12px;
    border-bottom: 1px solid var(--line);
    background: var(--bg1);
  }
  .am-avatar {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .am-avatar svg { width: 15px; height: 15px; fill: #fff; }
  .am-header-text { flex: 1; min-width: 0; }
  .am-brand {
    font-size: 13px;
    font-weight: 600;
    color: var(--t1);
    letter-spacing: -0.2px;
    line-height: 1.2;
  }
  .am-sub {
    font-size: 11px;
    color: var(--t3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    margin-top: 1px;
  }
  .am-sub .em { color: var(--t2); }

  /* Site badge */
  .am-site-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--t3);
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 3px 9px;
    margin: 10px 14px 0;
    width: fit-content;
  }
  .am-site-pill::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--ok);
    opacity: 0.7;
  }

  /* Body wrapper */
  .am-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 12px; }

  /* Banner */
  .am-banner {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: var(--r);
    padding: 10px 12px;
    font-size: 11.5px;
    color: rgba(245,158,11,0.9);
    line-height: 1.5;
  }
  .am-banner strong { color: #fbbf24; font-weight: 500; }

  /* Setup progress */
  .am-setup {
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    padding: 12px 14px;
  }
  .am-setup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .am-setup-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--t2);
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .am-setup-pct {
    font-size: 11px;
    font-family: var(--mono);
    color: var(--accent2);
    background: rgba(124,111,255,0.12);
    padding: 2px 8px;
    border-radius: 20px;
  }
  .am-progress-bar {
    height: 2px;
    background: var(--line);
    border-radius: 2px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .am-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 2px;
    transition: width 0.6s ease;
  }
  .am-step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11.5px;
    padding: 3px 0;
  }
  .am-step span { color: var(--t2); }
  .am-step.done span { color: var(--t3); text-decoration: line-through; }

  /* Quick links grid */
  .am-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .am-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 11px;
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: var(--r);
    font-size: 12px;
    font-weight: 500;
    color: var(--t2);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    white-space: nowrap;
    overflow: hidden;
  }
  .am-link:hover {
    background: var(--bg-hover);
    border-color: var(--line-mid);
    color: var(--t1);
  }
  .am-link.primary {
    background: rgba(124,111,255,0.15);
    border-color: rgba(124,111,255,0.3);
    color: var(--accent2);
    grid-column: 1 / -1;
  }
  .am-link.primary:hover {
    background: rgba(124,111,255,0.22);
    border-color: rgba(124,111,255,0.45);
    color: #c4b5fd;
  }
  .am-link-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px; height: 22px;
    border-radius: 6px;
    background: var(--bg3);
    flex-shrink: 0;
    color: var(--t3);
  }
  .am-link.primary .am-link-icon { background: rgba(124,111,255,0.2); color: var(--accent2); }
  .am-link-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  /* CTA button */
  .am-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--accent);
    border: none;
    border-radius: var(--r);
    font-size: 12.5px;
    font-weight: 500;
    font-family: var(--font);
    color: #fff;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s, transform 0.1s;
    width: 100%;
  }
  .am-cta:hover { background: #8b82ff; }
  .am-cta:active { transform: scale(0.98); }

  /* Sign out */
  .am-signout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    background: none;
    border: none;
    border-radius: var(--r);
    font-size: 11.5px;
    font-family: var(--font);
    color: var(--t3);
    cursor: pointer;
    width: 100%;
    transition: background 0.15s, color 0.15s;
  }
  .am-signout:hover { background: var(--bg2); color: var(--danger); }

  /* Divider */
  .am-divider { height: 1px; background: var(--line); margin: 0 -14px; }

  @keyframes am-spin { to { transform: rotate(360deg); } }
  .am-spin { animation: am-spin 0.8s linear infinite; }
`

export default function WebflowDesignerPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [webflowSiteId, setWebflowSiteId] = useState<string | null>(null)
  const [webflowIntegrationId, setWebflowIntegrationId] = useState<string | null>(null)
  const [templatesCollectionId, setTemplatesCollectionId] = useState<string | null>(null)
  const [setupStatus, setSetupStatus] = useState<OrgSetupStatus | null>(null)
  const [justInstalled, setJustInstalled] = useState(false)
  const [signedInBanner, setSignedInBanner] = useState(false)

  const checkAuth = useCallback(() => {
    setChecking(true)
    return fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const ok = Boolean(d.user)
        setAuthenticated(ok)
        setUserEmail(d.user?.email ?? null)
        if (ok) setSignedInBanner(false)
        return ok
      })
      .catch(() => { setAuthenticated(false); setUserEmail(null); return false })
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    let siteFromQuery = ''
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setJustInstalled(params.get('installed') === '1')
      siteFromQuery = params.get('siteId')?.trim() ?? ''
      if (siteFromQuery) setWebflowSiteId(siteFromQuery)
      if (params.get('signedIn') === '1') {
        setSignedInBanner(true)
        const next = new URLSearchParams(params)
        next.delete('signedIn')
        const qs = next.toString()
        window.history.replaceState({}, '', `/webflow/designer${qs ? `?${qs}` : ''}`)
      }
    }
    const querySiteId = siteFromQuery
    checkAuth().then((ok) => {
      if (ok) {
        fetch('/api/organizations', { credentials: 'include' })
          .then((r) => r.json())
          .then((d) => {
            const id = d.organizations?.[0]?.id
            if (id) {
              setOrgId(id)
              fetch(`/api/organizations/${id}/setup-status`, { credentials: 'include' })
                .then((r) => r.json()).then(setSetupStatus).catch(() => {})
              fetch(`/api/integrations/webflow?orgId=${encodeURIComponent(id)}`, { credentials: 'include' })
                .then((r) => r.json())
                .then((data) => {
                  const list = data.integrations ?? []
                  const first = Array.isArray(list) ? list[0] : null
                  if (first?.id) setWebflowIntegrationId(first.id)
                  if (first?.templatesCollectionId) setTemplatesCollectionId(first.templatesCollectionId)
                  if (first?.webflowSiteId && !querySiteId) setWebflowSiteId(first.webflowSiteId)
                }).catch(() => {})
            }
          }).catch(() => {})
      }
    })
  }, [checkAuth])

  const dash = (path: string) => (orgId ? `/dashboard/${orgId}${path}` : '/dashboard')

  const quickLinks: Array<{ label: string; href: string; icon: typeof Rocket; primary?: boolean }> = orgId
    ? [
        { label: 'Quick start', href: dash('/get-started'), icon: Rocket, primary: true },
        { label: 'New project', href: dash('/projects/new'), icon: Plus },
        { label: 'Templates', href: dash('/templates'), icon: LayoutTemplate },
        { label: 'Projects', href: dash('/projects'), icon: FolderKanban },
        { label: 'Schedule', href: dash('/schedule'), icon: CalendarDays },
        { label: 'Forms', href: dash('/forms'), icon: FileInput },
        { label: 'Email', href: dash('/email'), icon: Mail },
      ]
    : [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]

  return (
    <div className="am-panel">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <WebflowSetupNotice context="designer" />

      {/* ── Header ── */}
      <div className="am-header">
        <div className="am-avatar">
          <svg viewBox="0 0 16 16">
            <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" opacity=".9"/>
            <circle cx="8" cy="8" r="2.5" fill="rgba(255,255,255,0.3)"/>
          </svg>
        </div>
        <div className="am-header-text">
          <div className="am-brand">{BRAND.name}</div>
          <div className="am-sub">
            {authenticated
              ? <>Signed in{userEmail ? <> · <span className="em">{userEmail}</span></> : ''}</>
              : 'Sign in to manage campaigns'}
          </div>
        </div>
        {checking && <Loader2 size={13} className="am-spin" style={{ color: 'var(--t3)', flexShrink: 0 }} />}
      </div>

      {/* Site pill */}
      {webflowSiteId && (
        <div className="am-site-pill">
          site:{webflowSiteId.slice(0, 12)}…
        </div>
      )}

      {/* ── Body ── */}
      <div className="am-body">

        {/* Refresh banner */}
        {signedInBanner && !authenticated && (
          <div className="am-banner">
            Login completed in your browser. Click <strong>&nbsp;Refresh&nbsp;</strong> below to connect this panel.
          </div>
        )}

        {authenticated ? (
          <>
            <TemplateShellInstaller
              integrationId={webflowIntegrationId}
              collectionId={templatesCollectionId}
              autoSync
            />
            <DesignerScreensPanel siteId={webflowSiteId} />

            {/* Setup progress */}
            {setupStatus && !setupStatus.isFullySetup && (
              <div className="am-setup">
                <div className="am-setup-head">
                  <span className="am-setup-label">Setup progress</span>
                  <span className="am-setup-pct">{setupStatus.percentComplete}%</span>
                </div>
                <div className="am-progress-bar">
                  <div
                    className="am-progress-fill"
                    style={{ width: `${setupStatus.percentComplete}%` }}
                  />
                </div>
                {setupStatus.steps.slice(0, 3).map((step) => (
                  <div key={step.id} className={`am-step${step.done ? ' done' : ''}`}>
                    {step.done
                      ? <CheckCircle2 size={12} style={{ color: 'var(--ok)', flexShrink: 0 }} />
                      : <Circle size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick links */}
            <div className="am-links">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`am-link${link.primary ? ' primary' : ''}`}
                >
                  <span className="am-link-icon">
                    <link.icon size={12} />
                  </span>
                  <span className="am-link-text">{link.label}</span>
                  {link.primary && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5, flexShrink: 0 }} />}
                </a>
              ))}
            </div>

            <div className="am-divider" />

            {/* Dashboard CTA */}
            <a href={dash('')} target="_blank" rel="noreferrer" className="am-cta">
              Open full dashboard
              <ExternalLink size={13} />
            </a>

            {/* Sign out */}
            <button
              className="am-signout"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                setAuthenticated(false)
                setUserEmail(null)
                setOrgId(null)
                setSetupStatus(null)
              }}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </>
        ) : (
          <DesignerAuthOnboarding
            onRefresh={() => void checkAuth()}
            checking={checking}
            justInstalled={justInstalled}
          />
        )}
      </div>
    </div>
  )
}