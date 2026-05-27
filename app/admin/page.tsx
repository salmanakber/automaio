'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminNavGroups } from '@/lib/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Bot,
  CheckCircle2,
  Megaphone,
  Users,
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeModels: 0,
    totalUsers: 0,
    queueJobs: 0,
  })

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalCampaigns: data.totalCampaigns ?? 0,
          activeModels: data.activeModels ?? 0,
          totalUsers: data.totalUsers ?? 0,
          queueJobs: data.totalTemplates ?? 0,
        })
      })
      .catch(console.error)
  }, [])

  const statCards = [
    {
      label: 'Campaigns',
      value: stats.totalCampaigns,
      icon: Megaphone,
      hint: 'Across all organizations',
    },
    {
      label: 'Active AI models',
      value: stats.activeModels,
      icon: Bot,
      hint: 'Enabled in AI engine',
    },
    {
      label: 'Users',
      value: stats.totalUsers,
      icon: Users,
      hint: 'Registered accounts',
    },
    {
      label: 'Templates',
      value: stats.queueJobs,
      icon: Activity,
      hint: 'Prebuilt HTML campaign templates',
    },
  ]

  const moduleCount = adminNavGroups.reduce((sum, group) => sum + group.items.length, 0) - 1

  return (
    <>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Manage AI models, campaigns, Webflow integrations, intelligence modules, and platform settings."
      />

      <div className="flex-1 space-y-8 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">System operational</p>
              <p className="text-xs text-muted-foreground">
                {moduleCount} admin modules available · Webflow bridge · BullMQ workers
              </p>
            </div>
          </CardContent>
        </Card>

        {adminNavGroups.map((group) => (
          <section key={group.label} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{group.label}</h2>
              <Badge variant="outline">{group.items.length} modules</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items
                .filter((item) => item.href !== '/admin')
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Card className="h-full transition-colors hover:border-primary/50 hover:bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="size-4" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        {item.badge ? (
                          <Badge variant="secondary" className="w-fit text-[10px]">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </CardHeader>
                      <CardContent>
                        <CardDescription>Open {item.title.toLowerCase()} settings</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
