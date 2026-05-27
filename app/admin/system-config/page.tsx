'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

type SystemInfo = {
  environment: string
  features: Record<string, boolean>
  integrations: Record<string, boolean>
  queueHealth: Record<string, { status?: string; waiting?: number; active?: number }>
}

function RenderingSettingsCard() {
  const [threshold, setThreshold] = useState('4000')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/rendering-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.htmlLineThreshold) {
          setThreshold(String(d.settings.htmlLineThreshold))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/rendering-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlLineThreshold: Number(threshold) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setMessage('Saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <CardContent>
        <Loader2 className="size-5 animate-spin" />
      </CardContent>
    )
  }

  return (
    <CardContent className="space-y-4">
      <div className="space-y-2 max-w-xs">
        <Label htmlFor="html-threshold">HTML line threshold</Label>
        <Input
          id="html-threshold"
          type="number"
          min={100}
          max={50000}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Below this → custom code field. At or above → iframe embed in Rich Text.
        </p>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save threshold'}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </CardContent>
  )
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
                <CardTitle>Rendering limits</CardTitle>
                <CardDescription>
                  HTML line threshold for automatic custom code vs iframe embed (landing pages).
                </CardDescription>
              </CardHeader>
              <RenderingSettingsCard />
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
