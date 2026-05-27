'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScheduleCalendar } from '@/components/dashboard/ScheduleCalendar'
import { CalendarDays, Globe, Mail, FolderKanban, Megaphone } from 'lucide-react'

type TimelineItem = {
  id: string
  type: 'project' | 'email' | 'campaign'
  title: string
  category: string
  scheduledFor: string
  frequency: string
  status: string
  resourceId: string
}

type Project = {
  id: string
  name: string
  category: string
  status: string
  showOnWebsite: boolean
  webflowCmsItemId: string | null
  scheduledFor: string | null
}

const TYPE_ICONS = {
  project: FolderKanban,
  email: Mail,
  campaign: Megaphone,
}

export default function SchedulePage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<{ published: number; onWebsite: number; scheduled: number } | null>(null)

  useEffect(() => {
    fetch(`/api/schedule/overview?orgId=${orgId}`, {  })
      .then((r) => r.json())
      .then((d) => {
        setTimeline(d.timeline ?? [])
        setProjects(d.projects ?? [])
        setStats(d.stats ?? null)
      })
  }, [orgId])

  const publishedOnSite = projects.filter((p) => p.showOnWebsite && p.webflowCmsItemId)

  return (
    <DashboardShell
      orgId={orgId}
      title="Schedule Hub"
      description="Manage everything scheduled or live on your Webflow website."
    >
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.scheduled}</p><p className="text-xs text-muted-foreground">Upcoming</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.published}</p><p className="text-xs text-muted-foreground">Published</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{stats.onWebsite}</p><p className="text-xs text-muted-foreground">Live on website</p></CardContent></Card>
        </div>
      )}

      <ScheduleCalendar items={timeline} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="size-5" /> Upcoming
            </CardTitle>
            <CardDescription>Scheduled publishes and email sends</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nothing scheduled.</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((item) => {
                  const Icon = TYPE_ICONS[item.type] ?? FolderKanban
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Icon className="size-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.type} · {item.frequency.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {new Date(item.scheduledFor).toLocaleString()}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="size-5" /> Live on website
            </CardTitle>
            <CardDescription>Content currently visible on your Webflow site</CardDescription>
          </CardHeader>
          <CardContent>
            {publishedOnSite.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No live content yet.</p>
            ) : (
              <div className="space-y-2">
                {publishedOnSite.map((p) => (
                  <Link key={p.id} href={`/dashboard/${orgId}/projects/${p.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-0">Live</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">All projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Website</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 capitalize text-muted-foreground">{p.category}</td>
                    <td className="py-3"><Badge variant="outline" className="capitalize">{p.status}</Badge></td>
                    <td className="py-3">{p.showOnWebsite ? (p.webflowCmsItemId ? '✓ Live' : 'Pending') : 'Hidden'}</td>
                    <td className="py-3">
                      <Link href={`/dashboard/${orgId}/projects/${p.id}`}>
                        <Button size="sm" variant="ghost">Manage</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
