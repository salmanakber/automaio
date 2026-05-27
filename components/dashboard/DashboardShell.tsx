'use client'

import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

type DashboardShellProps = {
  orgId: string
  campaignId?: string
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function DashboardShell({
  orgId,
  campaignId,
  children,
  title,
  description,
  actions,
}: DashboardShellProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar orgId={orgId} campaignId={campaignId} />
      <div className="ml-64">
        {(title || actions) && (
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-8 py-6 flex items-start justify-between gap-4">
              <div>
                {title ? <h1 className="text-2xl font-bold tracking-tight">{title}</h1> : null}
                {description ? (
                  <p className="text-muted-foreground text-sm mt-1">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
            </div>
          </header>
        )}
        <main className="max-w-7xl mx-auto px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
