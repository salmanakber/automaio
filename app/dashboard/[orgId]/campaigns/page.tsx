'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Rocket, BarChart3, CalendarClock, Mail, Megaphone } from 'lucide-react'

type TimelineItem = {
  id: string
  type: 'project' | 'email' | 'campaign'
  title: string
  scheduledFor: string
  status: string
  resourceId: string
}

type CampaignRow = {
  id: string
  name: string
  status: string
  webflowCmsItemId: string | null
  updatedAt: string
}

export default function CampaignsHubPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [stats, setStats] = useState({ scheduled: 0, published: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/schedule/overview?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        setTimeline(d.timeline ?? [])
        setCampaigns(d.campaigns ?? [])
        setStats({
          scheduled: d.stats?.scheduled ?? 0,
          published: d.stats?.published ?? 0,
        })
      })
      .finally(() => setLoading(false))
  }, [orgId])

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scheduled publishes, standalone launches, triggers, and reporting in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/${orgId}/campaigns/new`}>
              <Megaphone className="h-4 w-4 mr-2" /> Standalone campaign
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/${orgId}/email`}>
              <Mail className="h-4 w-4 mr-2" /> Email campaigns
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled</CardDescription>
            <CardTitle className="text-2xl">{stats.scheduled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published projects</CardDescription>
            <CardTitle className="text-2xl">{stats.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active campaigns</CardDescription>
            <CardTitle className="text-2xl">
              {campaigns.filter((c) => c.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5" /> Upcoming triggers
          </CardTitle>
          <CardDescription>
            Worker fires Webflow publish + optional subscriber emails at each scheduled time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled items. Schedule from a project publish dialog.</p>
          ) : (
            timeline.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.type} · {new Date(item.scheduledFor).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {item.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5" /> Standalone campaigns
          </CardTitle>
          <CardDescription>Launch AI campaigns for any purpose — not tied to a studio project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {campaigns.length === 0 ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/${orgId}/campaigns/new`}>
                <Plus className="h-4 w-4 mr-2" /> Create first campaign
              </Link>
            </Button>
          ) : (
            campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/${orgId}/campaigns/${c.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
