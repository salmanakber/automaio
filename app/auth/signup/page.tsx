'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthPanel } from '@/components/auth/AuthPanel'
import { safeRedirectPath } from '@/lib/auth/redirect'

function SignupContent() {
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))
  const fromExtension = searchParams.get('from') === 'extension'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4">
        {fromExtension ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-medium">Create account for Webflow Designer</p>
            <p className="text-muted-foreground mt-1 text-xs">
              After signup, return to the Designer panel and click <strong>Refresh</strong>.
            </p>
          </div>
        ) : null}
        <div className="bg-card rounded-lg shadow-lg p-8">
          <AuthPanel redirectTo={redirectTo} defaultTab="signup" key="signup" />
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
