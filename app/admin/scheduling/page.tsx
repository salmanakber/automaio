'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

type ScheduleRow = {
  id: string
  scheduledFor: string
  channel: string
  status: string
  campaign: {
    id: string
    name: string
    industry: string
    organization: { id: string; name: string; slug: string }
  }
}

export default function SchedulingEngine() {
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [stats, setStats] = useState({ scheduled: 0, sent: 0, failed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/schedules')
      .then((r) => r.json())
      .then((d) => {
        setSchedules(d.schedules ?? [])
        setStats(d.stats ?? { scheduled: 0, sent: 0, failed: 0, cancelled: 0 })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="Scheduling & Automation"
        description="Webflow and campaign publish schedules from the database."
      />

      <div className="mx-auto max-w-6xl px-6 pb-12 space-y-6">
        {loading ? (
          <Loader2 className="size-8 animate-spin mx-auto" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.scheduled}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-destructive">{stats.failed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.cancelled}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No schedules yet. Users can schedule Webflow publishes from a campaign&apos;s
                    Webflow CMS tab.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {schedules.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{s.campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {s.campaign.organization.name} · {s.channel} ·{' '}
                            {new Date(s.scheduledFor).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              s.status === 'sent'
                                ? 'default'
                                : s.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {s.status}
                          </Badge>
                          <Link
                            href={`/dashboard/${s.campaign.organization.id}/campaigns/${s.campaign.id}`}
                            className="text-sm text-primary underline"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
