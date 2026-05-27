'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ExternalLink, CalendarClock, Upload, X } from 'lucide-react'

interface CampaignWebflowPanelProps {
  campaignId: string
  orgId: string
  webflowCmsItemId?: string | null
  templateName?: string | null
  campaignStatus?: string
}

type WebflowSchedule = {
  id: string
  scheduledFor: string
  channel: string
  status: string
  optimizationStrategy?: {
    publishSite?: boolean
    integrationId?: string
  } | null
}

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultScheduleValue() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return toDatetimeLocalValue(d)
}

export function CampaignWebflowPanel({
  campaignId,
  orgId,
  webflowCmsItemId,
  templateName,
  campaignStatus,
}: CampaignWebflowPanelProps) {
  const [html, setHtml] = useState('')
  const [integrationId, setIntegrationId] = useState('')
  const [integrations, setIntegrations] = useState<
    Array<{ id: string; siteName: string | null; campaignsCollectionId: string | null }>
  >([])
  const [publishing, setPublishing] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [publishMode, setPublishMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue)
  const [publishSite, setPublishSite] = useState(false)
  const [schedules, setSchedules] = useState<WebflowSchedule[]>([])

  const loadSchedules = useCallback(() => {
    fetch(`/api/campaigns/${campaignId}/schedule?channel=webflow`)
      .then((r) => r.json())
      .then((d) => setSchedules(d.schedules ?? []))
      .catch(() => setSchedules([]))
  }, [campaignId])

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/preview`)
      .then((r) => r.json())
      .then((d) => {
        if (d.html) setHtml(d.html)
        if (d.error) setError(d.error)
      })

    fetch(`/api/integrations/webflow?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.integrations ?? []
        setIntegrations(list)
        if (list[0]) setIntegrationId(list[0].id)
      })

    loadSchedules()
  }, [campaignId, orgId, loadSchedules])

  const canPublish =
    integrationId && integrations.find((i) => i.id === integrationId)?.campaignsCollectionId

  const pendingSchedules = useMemo(
    () => schedules.filter((s) => s.status === 'scheduled'),
    [schedules],
  )

  const minScheduleInput = useMemo(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 2)
    return toDatetimeLocalValue(d)
  }, [])

  const handlePublishNow = async () => {
    setPublishing(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/publish-webflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, publishSite }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(
        publishSite
          ? 'Published to Webflow CMS and site publish triggered.'
          : 'Saved to Webflow CMS. Live site publish was not triggered.',
      )
      if (data.previewHtml) setHtml(data.previewHtml)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const handleSchedule = async () => {
    setScheduling(true)
    setError(null)
    setMessage(null)
    try {
      const scheduledFor = new Date(scheduledAt)
      if (Number.isNaN(scheduledFor.getTime())) {
        throw new Error('Pick a valid date and time')
      }

      const res = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'webflow',
          scheduledFor: scheduledFor.toISOString(),
          integrationId,
          publishSite,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessage(
        `Scheduled for ${scheduledFor.toLocaleString()}${publishSite ? ' (includes live site publish)' : ''}.`,
      )
      loadSchedules()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Schedule failed')
    } finally {
      setScheduling(false)
    }
  }

  const handleCancelSchedule = async (scheduleId: string) => {
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/schedule?scheduleId=${scheduleId}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Scheduled publish cancelled.')
      loadSchedules()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed')
    }
  }

  const busy = publishing || scheduling

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Webflow CMS
            {webflowCmsItemId ? (
              <Badge variant="default">Synced</Badge>
            ) : (
              <Badge variant="secondary">Not published</Badge>
            )}
            {campaignStatus === 'scheduled' ? (
              <Badge variant="outline">Scheduled</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Publish now or schedule a later push to your Webflow CMS collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {templateName ? (
            <p className="text-sm">
              Template: <span className="font-medium">{templateName}</span>
            </p>
          ) : null}

          {integrations.length > 1 ? (
            <div className="space-y-2">
              <Label>Webflow site</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={integrationId}
                onChange={(e) => setIntegrationId(e.target.value)}
              >
                {integrations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.siteName ?? i.id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {!canPublish ? (
            <p className="text-sm text-amber-600">
              Connect Webflow and select a CMS collection in{' '}
              <a href={`/dashboard/${orgId}/settings?tab=integrations`} className="underline font-medium">
                Organization → Integrations
              </a>
              .
            </p>
          ) : null}

          <div className="space-y-3">
            <Label>When to publish</Label>
            <RadioGroup
              value={publishMode}
              onValueChange={(v) => setPublishMode(v as 'now' | 'later')}
              className="flex flex-col gap-2 sm:flex-row sm:gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="now" id="publish-now" />
                <Label htmlFor="publish-now" className="font-normal cursor-pointer">
                  Publish now
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="later" id="publish-later" />
                <Label htmlFor="publish-later" className="font-normal cursor-pointer">
                  Schedule for later
                </Label>
              </div>
            </RadioGroup>
          </div>

          {publishMode === 'later' ? (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <Label htmlFor="schedule-at">Date & time</Label>
              <input
                id="schedule-at"
                type="datetime-local"
                min={minScheduleInput}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Uses your browser timezone. Requires the background worker (
                <code className="text-xs">pnpm run worker</code>) and Redis.
              </p>
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={publishSite}
              onChange={(e) => setPublishSite(e.target.checked)}
              className="rounded border"
            />
            Also trigger Webflow site publish (make changes live)
          </label>

          <div className="flex flex-wrap gap-2">
            {publishMode === 'now' ? (
              <Button onClick={handlePublishNow} disabled={busy || !canPublish}>
                <Upload className="size-4 mr-2" />
                {publishing ? 'Publishing…' : 'Publish now'}
              </Button>
            ) : (
              <Button onClick={handleSchedule} disabled={busy || !canPublish}>
                <CalendarClock className="size-4 mr-2" />
                {scheduling ? 'Scheduling…' : 'Schedule publish'}
              </Button>
            )}
          </div>

          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {webflowCmsItemId ? (
            <p className="text-xs text-muted-foreground font-mono">CMS item: {webflowCmsItemId}</p>
          ) : null}

          {pendingSchedules.length > 0 ? (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Upcoming scheduled publishes</p>
              <ul className="space-y-2">
                {pendingSchedules.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {new Date(s.scheduledFor).toLocaleString()}
                      {s.optimizationStrategy?.publishSite ? ' · live site' : ' · CMS only'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelSchedule(s.id)}
                      aria-label="Cancel schedule"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview (as shown in Webflow)</CardTitle>
          <CardDescription>
            Merged HTML stored in the <strong>template-html</strong> CMS field.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {html ? (
            <iframe
              title="Webflow preview"
              className="h-[480px] w-full border-t bg-white"
              srcDoc={html}
              sandbox="allow-same-origin"
            />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              Select a template when creating the campaign to generate preview HTML.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="py-4 flex items-start gap-3">
          <ExternalLink className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Webflow App Marketplace</p>
            <p className="text-muted-foreground mt-1">
              Bind your Collection Template to Automaio fields or use{' '}
              <code className="text-xs">/webflow/embed.js</code> for full HTML rendering.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
