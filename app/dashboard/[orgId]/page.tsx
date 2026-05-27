'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { SetupHealthChecklist } from '@/components/dashboard/SetupHealthChecklist'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderKanban,
  Mail,
  FileInput,
  CalendarDays,
  Globe,
  ArrowRight,
  Plus,
  Rocket,
  LayoutTemplate,
  Zap,
} from 'lucide-react'

type OverviewStats = {
  totalProjects: number
  published: number
  scheduled: number
  onWebsite: number
}

const USE_CASES = [
  {
    title: 'Launch a landing page',
    desc: 'Pick a template and go live in one click',
    href: 'get-started',
    icon: Rocket,
    color: 'from-violet-500/20 to-violet-500/5',
  },
  {
    title: 'Schedule blog posts',
    desc: 'Weekly or daily CMS publishes on autopilot',
    href: 'projects/new',
    icon: CalendarDays,
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    title: 'Capture leads',
    desc: 'Build forms and embed on any Webflow page',
    href: 'forms',
    icon: FileInput,
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
]

export default function OrgOverviewPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [timeline, setTimeline] = useState<
    Array<{ id: string; type: string; title: string; scheduledFor: string; frequency: string }>
  >([])

  useEffect(() => {
    fetch(`/api/schedule/overview?orgId=${orgId}`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats ?? null)
        setTimeline((d.timeline ?? []).slice(0, 5))
      })
      .catch(() => {})
  }, [orgId])

  const cards = [
    {
      title: 'Projects & CMS',
      desc: 'Schedule blog posts, CMS entries, and custom content',
      href: `/dashboard/${orgId}/projects`,
      icon: FolderKanban,
      stat: stats ? `${stats.totalProjects} projects` : '—',
      color: 'from-violet-500/20 to-violet-500/5',
    },
    {
      title: 'Template gallery',
      desc: 'Browse prebuilt designs for your Webflow site',
      href: `/dashboard/${orgId}/templates`,
      icon: LayoutTemplate,
      stat: '5+ starters',
      color: 'from-pink-500/20 to-pink-500/5',
    },
    {
      title: 'Email Campaigns',
      desc: 'Send and schedule emails with daily or twice-daily frequency',
      href: `/dashboard/${orgId}/email`,
      icon: Mail,
      stat: 'Subscribers & sends',
      color: 'from-blue-500/20 to-blue-500/5',
    },
    {
      title: 'Schedule Hub',
      desc: 'View everything scheduled or published to your site',
      href: `/dashboard/${orgId}/schedule`,
      icon: CalendarDays,
      stat: stats ? `${stats.scheduled} upcoming` : '—',
      color: 'from-amber-500/20 to-amber-500/5',
    },
  ]

  return (
    <DashboardShell
      orgId={orgId}
      title="Webflow Dashboard"
      description="Create content, schedule publishes, send emails, and capture leads — all from one place."
      actions={
        <div className="flex gap-2">
          <Link href={`/dashboard/${orgId}/get-started`}>
            <Button variant="outline">
              <Zap className="size-4 mr-2" />
              Quick start
            </Button>
          </Link>
          <Link href={`/dashboard/${orgId}/projects/new`}>
            <Button>
              <Plus className="size-4 mr-2" />
              New project
            </Button>
          </Link>
        </div>
      }
    >
      <SetupHealthChecklist orgId={orgId} />

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          What do you want to do?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {USE_CASES.map((uc) => (
            <Link key={uc.title} href={`/dashboard/${orgId}/${uc.href}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden group">
                <div className={`h-1 bg-gradient-to-r ${uc.color}`} />
                <CardHeader className="pb-2">
                  <uc.icon className="size-5 text-primary mb-2" />
                  <CardTitle className="text-base">{uc.title}</CardTitle>
                  <CardDescription className="text-xs">{uc.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden group">
              <div className={`h-1 bg-gradient-to-r ${card.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <card.icon className="size-5 text-primary" />
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription className="text-xs">{card.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">{card.stat}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total projects', value: stats.totalProjects },
            { label: 'Published', value: stats.published },
            { label: 'On website', value: stats.onWebsite, icon: Globe },
            { label: 'Scheduled', value: stats.scheduled },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming schedule</CardTitle>
          <CardDescription>Content and emails queued for publishing</CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
              <Link href={`/dashboard/${orgId}/get-started`}>
                <Button size="sm">
                  <Rocket className="size-4 mr-2" />
                  Publish your first project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.type} · {item.frequency.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(item.scheduledFor).toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
