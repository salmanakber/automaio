'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { safeRedirectPath } from '@/lib/auth/redirect'
import { cn } from '@/lib/utils'

export type AuthPanelProps = {
  redirectTo?: string
  title?: string
  description?: string
  compact?: boolean
  defaultTab?: 'login' | 'signup'
  onSuccess?: () => void
}

async function parseAuthResponse(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as { error?: string; user?: unknown }
  } catch {
    return { error: 'Unexpected server response. Please try again.' }
  }
}

/** Remove credentials accidentally submitted via native form GET. */
function stripCredentialsFromUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('email') && !url.searchParams.has('password')) return
  url.searchParams.delete('email')
  url.searchParams.delete('password')
  const qs = url.searchParams.toString()
  window.history.replaceState({}, '', qs ? `${url.pathname}?${qs}` : url.pathname)
}

export function AuthPanel({
  redirectTo = '/dashboard',
  title = 'Automaio',
  description,
  compact = false,
  defaultTab = 'login',
  onSuccess,
}: AuthPanelProps) {
  const safeRedirect = safeRedirectPath(redirectTo)
  const [tab, setTab] = useState(defaultTab)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  useEffect(() => {
    stripCredentialsFromUrl()
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'signup') setTab('signup')
    const err = params.get('error')
    if (err) setError(decodeURIComponent(err.replace(/\+/g, ' ')))
  }, [])

  useEffect(() => {
    fetch('/api/auth/providers', { credentials: 'include', headers: { 'ngrok-skip-browser-warning': '1' } })
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(Boolean(d.google)))
      .catch(() => setGoogleEnabled(false))
  }, [])

  const finishAuth = useCallback(async () => {
    const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store', headers: { 'ngrok-skip-browser-warning': '1' } })
    const me = await parseAuthResponse(meRes)
    if (!me.user) {
      setError(
        'Signed in, but the session cookie was not saved. Use the same host as NEXT_PUBLIC_APP_URL in .env (all localhost or all ngrok).',
      )
      return false
    }
    if (onSuccess) {
      onSuccess()
    } else {
      window.location.assign(safeRedirect)
    }
    return true
  }, [onSuccess, safeRedirect])

  const submitLogin = useCallback(async () => {
    setError('')
    setLoading(true)
    const email = loginEmail.trim()
    const password = loginPassword

    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await parseAuthResponse(res)
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      await finishAuth()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [loginEmail, loginPassword, finishAuth])

  const submitSignup = useCallback(async () => {
    setError('')
    setLoading(true)
    const email = signupEmail.trim()
    const password = signupPassword

    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      })
      const data = await parseAuthResponse(res)
      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        return
      }
      await finishAuth()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [signupEmail, signupPassword, firstName, lastName, finishAuth])

  const onEnterKey =
    (submit: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      }
    }

  const loginDesc =
    description ??
    (safeRedirect === '/webflow/install'
      ? 'Sign in to finish installing Automaio for Webflow'
      : safeRedirect === '/webflow/designer'
        ? 'Sign in to use Automaio in the Designer'
        : 'Sign in to your account')

  const signupDesc = 'Create account with email or Google'

  const divider = (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Or with email</span>
      </div>
    </div>
  )

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {title ? (
        <div>
          <h2 className={compact ? 'text-lg font-semibold' : 'text-2xl font-bold'}>{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'login' ? loginDesc : signupDesc}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {tab === 'login' ? loginDesc : signupDesc}
        </p>
      )}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="grid h-10 w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          className={cn(
            'rounded-md text-sm font-medium transition-colors',
            tab === 'login'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => {
            setTab('login')
            setError('')
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className={cn(
            'rounded-md text-sm font-medium transition-colors',
            tab === 'signup'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => {
            setTab('signup')
            setError('')
          }}
        >
          Create account
        </button>
      </div>

      {tab === 'login' ? (
        <div className="mt-4 space-y-4">
          <SocialAuthButtons redirectTo={safeRedirect} googleEnabled={googleEnabled} />
          {divider}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="auth-login-email">Email</Label>
              <Input
                id="auth-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={onEnterKey(submitLogin)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="auth-login-password">Password</Label>
              <Input
                id="auth-login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={onEnterKey(submitLogin)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="button" className="w-full" onClick={() => void submitLogin()}>
              {loading ? 'Signing in…' : 'Continue with email'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <SocialAuthButtons redirectTo={safeRedirect} googleEnabled={googleEnabled} />
          {divider}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="auth-fn">First name</Label>
                <Input
                  id="auth-fn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="auth-ln">Last name</Label>
                <Input
                  id="auth-ln"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="auth-signup-email">Email</Label>
              <Input
                id="auth-signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                onKeyDown={onEnterKey(submitSignup)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="auth-signup-password">Password</Label>
              <Input
                id="auth-signup-password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                onKeyDown={onEnterKey(submitSignup)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <Button type="button" className="w-full" disabled={loading} onClick={() => void submitSignup()}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
