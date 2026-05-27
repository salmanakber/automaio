'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Info } from 'lucide-react'

type WebflowSetupNoticeProps = {
  context: 'install' | 'designer'
}

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
      <Alert className="mb-4 border-primary/30 bg-primary/5">
        <Info className="size-4" />
        <AlertTitle>Designer panel (webflow-ext.com)</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>
            The fixed URI <code className="text-xs">*.webflow-ext.com</code> is correct — Webflow
            hosts the extension shell. Your app loads inside it via{' '}
            <code className="text-xs">npm run webflow:extension</code> + ngrok.
          </p>
          <p className="text-muted-foreground">
            If you see a blank panel or connection error, run{' '}
            <code className="text-xs">npm run dev</code> and{' '}
            <code className="text-xs">npm run webflow:extension</code> in another terminal, then in
            Webflow choose <strong>Launch Development App</strong>.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  if (context === 'designer' && isLocalhost) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="size-4" />
        <AlertTitle>Wrong host for Designer</AlertTitle>
        <AlertDescription className="text-sm">
          You opened <code className="text-xs">localhost</code> directly. In Webflow Designer, use
          Apps → your app (loads via <code className="text-xs">webflow-ext.com</code>), not
          localhost.
        </AlertDescription>
      </Alert>
    )
  }

  if (envMismatch) {
    return (
      <Alert className="mb-4 border-amber-500/40 bg-amber-500/10">
        <AlertTriangle className="size-4" />
        <AlertTitle>App URL mismatch</AlertTitle>
        <AlertDescription className="text-sm">
          Browser is on <code className="text-xs">{origin}</code> but{' '}
          <code className="text-xs">NEXT_PUBLIC_APP_URL</code> is{' '}
          <code className="text-xs">{publicAppUrl}</code>. Update both to the same ngrok URL and
          restart the dev server.
        </AlertDescription>
      </Alert>
    )
  }

  if (context === 'install' && !isLocalhost) {
    return (
      <Alert className="mb-4 border-primary/30 bg-primary/5">
        <AlertDescription className="text-sm">
          Install URL for Webflow:{' '}
          <code className="text-xs break-all">{publicAppUrl || origin}/webflow/install</code>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
