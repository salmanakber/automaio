'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/** Unified onboarding — redirects to the main landing page wizard. */
export default function GetStartedPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  useEffect(() => {
    router.replace(`/dashboard/${orgId}/projects/new`)
  }, [orgId, router])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening landing page builder…</p>
    </div>
  )
}
