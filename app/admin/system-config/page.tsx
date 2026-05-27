'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

type SystemInfo = {
  environment: string
  features: Record<string, boolean>
  integrations: Record<string, boolean>
  queueHealth: Record<string, { status?: string; waiting?: number; active?: number }>
}

export default function SystemConfiguration() {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/system')
      .then((r) => r.json())
      .then(setInfo)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="System Configuration"
        description="Live environment, feature flags, and integration status from your deployment."
      />

      <div className="mx-auto max-w-6xl px-6 pb-12 space-y-6">
        {loading || !info ? (
          <Loader2 className="size-8 animate-spin mx-auto" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {info.environment}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature flags</CardTitle>
                <CardDescription>Read from .env — update variables and restart the app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(info.features).map(([key, on]) => (
                  <div key={key} className="flex items-center justify-between rounded border px-3 py-2">
                    <span className="text-sm">{key}</span>
                    <Badge variant={on ? 'default' : 'secondary'}>{on ? 'On' : 'Off'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Whether required API keys are configured.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {Object.entries(info.integrations).map(([key, ok]) => (
                  <div key={key} className="flex items-center justify-between rounded border px-3 py-2">
                    <span className="text-sm capitalize">{key}</span>
                    <Badge variant={ok ? 'default' : 'destructive'}>{ok ? 'Configured' : 'Missing'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queue health (Redis / BullMQ)</CardTitle>
              </CardHeader>
              <CardContent>
                {'error' in info.queueHealth ? (
                  <p className="text-sm text-destructive">{String(info.queueHealth.error)}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(info.queueHealth).map(([name, q]) => (
                      <div key={name} className="rounded border px-3 py-2 text-sm">
                        <p className="font-medium">{name}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {q.status ?? 'unknown'}
                          {q.waiting != null ? ` · waiting: ${q.waiting}` : ''}
                          {q.active != null ? ` · active: ${q.active}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
