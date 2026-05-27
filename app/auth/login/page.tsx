'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthPanel } from '@/components/auth/AuthPanel'
import { safeRedirectPath } from '@/lib/auth/redirect'

function LoginContent() {
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))
  const fromExtension = searchParams.get('from') === 'extension'
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('email') || url.searchParams.has('password')) {
      url.searchParams.delete('email')
      url.searchParams.delete('password')
      const qs = url.searchParams.toString()
      window.history.replaceState({}, '', qs ? `${url.pathname}?${qs}` : url.pathname)
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store', headers: { 'ngrok-skip-browser-warning': '1' } })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) window.location.replace(redirectTo)
      })
      .catch(() => {})
  }, [redirectTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4">
        {fromExtension ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-medium">Signing in from Webflow Designer</p>
            <p className="text-muted-foreground mt-1 text-xs">
              After login, return to the Designer panel and click <strong>Refresh</strong>.
            </p>
          </div>
        ) : null}
        <div className="bg-card rounded-lg shadow-lg p-8">
          <AuthPanel redirectTo={redirectTo} defaultTab={initialTab} />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
