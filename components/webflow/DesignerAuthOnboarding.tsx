'use client'

import { useMemo } from 'react'
import { ExternalLink, LogIn, RefreshCw, UserPlus, Sparkles } from 'lucide-react'
import { appPathUrl, getClientAppOrigin, openExternalUrl } from '@/lib/open-external-url'

type DesignerAuthOnboardingProps = {
  onRefresh: () => void
  checking?: boolean
  justInstalled?: boolean
}

const css = `
  .am-auth {
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
    --font:    'DM Sans', system-ui, sans-serif;
    --mono:    'DM Mono', 'Fira Code', monospace;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
  }

  /* Welcome banner */
  .am-auth-welcome {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 11px 13px;
    background: rgba(124,111,255,0.08);
    border: 1px solid rgba(124,111,255,0.22);
    border-radius: 10px;
  }
  .am-auth-welcome-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    background: rgba(124,111,255,0.18);
    border-radius: 7px;
    flex-shrink: 0;
    color: #a68eff;
    margin-top: 1px;
  }
  .am-auth-welcome-title {
    font-size: 12px;
    font-weight: 600;
    color: #c4b5fd;
    margin-bottom: 3px;
  }
  .am-auth-welcome-sub {
    font-size: 11px;
    color: var(--t3);
    line-height: 1.5;
  }

  /* Plain hint */
  .am-auth-hint {
    font-size: 11.5px;
    color: var(--t3);
    line-height: 1.5;
    padding: 2px 1px;
  }

  /* Primary CTA — Login */
  .am-btn-login {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 500;
    font-family: var(--font);
    color: #fff;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s, transform 0.1s;
  }
  .am-btn-login:hover { background: #8b82ff; }
  .am-btn-login:active { transform: scale(0.98); }
  .am-btn-login .ext { opacity: 0.6; }

  /* Secondary CTA — Signup */
  .am-btn-signup {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    background: var(--bg2);
    border: 1px solid var(--line-m);
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--t2);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
  }
  .am-btn-signup:hover {
    background: var(--bg-h);
    border-color: rgba(255,255,255,0.18);
    color: var(--t1);
  }
  .am-btn-signup:active { transform: scale(0.98); }
  .am-btn-signup .ext { opacity: 0.45; }

  /* Steps card */
  .am-auth-steps {
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 13px;
    margin-top: 2px;
  }
  .am-auth-steps-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--t3);
    margin-bottom: 9px;
  }
  .am-steps-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 12px;
  }
  .am-step-row {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }
  .am-step-num {
    width: 18px; height: 18px;
    border-radius: 5px;
    background: var(--bg3);
    border: 1px solid var(--line-m);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9.5px;
    font-weight: 600;
    font-family: var(--mono);
    color: var(--t3);
    flex-shrink: 0;
  }
  .am-step-text {
    font-size: 11.5px;
    color: var(--t2);
    line-height: 1.5;
    padding-top: 1px;
  }

  /* Divider */
  .am-steps-divider {
    height: 1px;
    background: var(--line);
    margin: 0 -13px 12px;
  }

  /* Refresh button */
  .am-btn-refresh {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 9px 14px;
    background: var(--bg3);
    border: 1px solid var(--line-m);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--t2);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .am-btn-refresh:hover:not(:disabled) {
    background: var(--bg-h);
    border-color: rgba(61,214,140,0.3);
    color: var(--ok);
  }
  .am-btn-refresh:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  @keyframes am-spin { to { transform: rotate(360deg); } }
  .am-spin { animation: am-spin 0.8s linear infinite; }

  /* Env error */
  .am-auth-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 13px;
    background: rgba(248,113,113,0.07);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 10px;
    font-size: 11.5px;
    color: #fca5a5;
    line-height: 1.6;
  }
  .am-auth-error code {
    font-family: var(--mono);
    font-size: 10.5px;
    color: #fca5a5;
    background: rgba(248,113,113,0.15);
    padding: 1px 5px;
    border-radius: 4px;
  }
`

export function DesignerAuthOnboarding({
  onRefresh,
  checking = false,
  justInstalled = false,
}: DesignerAuthOnboardingProps) {
  const origin = getClientAppOrigin()

  const urls = useMemo(() => {
    if (!origin) return null
    const query = { redirect: '/webflow/designer?signedIn=1', from: 'extension' }
    return {
      login: appPathUrl('/auth/login', query),
      signup: appPathUrl('/auth/signup', { ...query, tab: 'signup' }),
    }
  }, [origin])

  if (!urls) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="am-auth-error">
          Set <code>NEXT_PUBLIC_APP_URL</code> in .env to your live HTTPS URL (e.g.{' '}
          <code>https://automaio.kilo1app.com</code>), then restart <code>npm run dev</code>.
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="am-auth">

        {/* Welcome / hint */}
        {justInstalled ? (
          <div className="am-auth-welcome">
            <div className="am-auth-welcome-icon"><Sparkles size={13} /></div>
            <div>
              <div className="am-auth-welcome-title">Welcome — sign in to continue</div>
              <div className="am-auth-welcome-sub">
                Open sign-in in your browser, then return here and press Refresh.
              </div>
            </div>
          </div>
        ) : (
          <p className="am-auth-hint">
            Sign-in opens in a new browser tab — required inside Webflow Designer.
          </p>
        )}

        {/* Login */}
        <a
          href={urls.login}
          target="_blank"
          rel="noopener noreferrer"
          className="am-btn-login"
          onClick={(e) => { e.preventDefault(); openExternalUrl(urls.login) }}
        >
          <LogIn size={13} />
          Log in
          <ExternalLink size={12} className="ext" />
        </a>

        {/* Signup */}
        <a
          href={urls.signup}
          target="_blank"
          rel="noopener noreferrer"
          className="am-btn-signup"
          onClick={(e) => { e.preventDefault(); openExternalUrl(urls.signup) }}
        >
          <UserPlus size={13} />
          Create account
          <ExternalLink size={12} className="ext" />
        </a>

        {/* After sign-in steps */}
        <div className="am-auth-steps">
          <div className="am-auth-steps-title">After signing in</div>
          <div className="am-steps-list">
            {['Complete login in the browser tab', 'Return to Webflow Designer', 'Click Refresh below'].map((text, i) => (
              <div key={i} className="am-step-row">
                <div className="am-step-num">{i + 1}</div>
                <div className="am-step-text">{text}</div>
              </div>
            ))}
          </div>
          <div className="am-steps-divider" />
          <button
            type="button"
            className="am-btn-refresh"
            onClick={onRefresh}
            disabled={checking}
          >
            <RefreshCw size={12} className={checking ? 'am-spin' : ''} />
            {checking ? 'Checking…' : "I've signed in — Refresh"}
          </button>
        </div>

      </div>
    </>
  )
}