'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, LogIn, RefreshCw, UserPlus } from 'lucide-react'
import { appPathUrl, getClientAppOrigin, openExternalUrl } from '@/lib/open-external-url'

type DesignerAuthOnboardingProps = {
  onRefresh: () => void
  checking?: boolean
  justInstalled?: boolean
}

export function DesignerAuthOnboarding({
  onRefresh,
  checking = false,
  justInstalled = false,
}: DesignerAuthOnboardingProps) {
  const origin = getClientAppOrigin()

  const urls = useMemo(() => {
    if (!origin) return null
    const query = {
      redirect: '/webflow/designer?signedIn=1',
      from: 'extension',
    }
    return {
      login: appPathUrl('/auth/login', query),
      signup: appPathUrl('/auth/signup', { ...query, tab: 'signup' }),
    }
  }, [origin])

  if (!urls) {
    return (
      <p className="text-sm text-destructive">
        Set <code className="text-xs">NEXT_PUBLIC_APP_URL</code> in .env to your ngrok HTTPS URL,
        then restart <code className="text-xs">npm run dev</code>.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {justInstalled ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
          <p className="font-medium">Welcome — sign in to continue</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap a button below to open the full sign-in page in your browser, then return here and
            press Refresh.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign-in opens in a new browser tab (required inside Webflow Designer).
        </p>
      )}

      <Button asChild className="w-full h-11 text-base" size="lg">
        <a
          href={urls.login}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            openExternalUrl(urls.login)
          }}
        >
          <LogIn className="size-4 mr-2" />
          Log in in browser
          <ExternalLink className="size-4 ml-2 opacity-70" />
        </a>
      </Button>

      <Button asChild variant="outline" className="w-full h-11" size="lg">
        <a
          href={urls.signup}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            openExternalUrl(urls.signup)
          }}
        >
          <UserPlus className="size-4 mr-2" />
          Create account
          <ExternalLink className="size-4 ml-2 opacity-70" />
        </a>
      </Button>

      <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
        <p className="text-xs font-medium">After you sign in</p>
        <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
          <li>Complete login in the new browser tab</li>
          <li>Return to Webflow Designer</li>
          <li>Click Refresh below</li>
        </ol>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={onRefresh}
          disabled={checking}
        >
          <RefreshCw className={`size-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking…' : "I've signed in — Refresh"}
        </Button>
      </div>
    </div>
  )
}
