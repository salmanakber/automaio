'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function BillingMonetization() {
  const [stats, setStats] = useState<{
    totalUsers: number
    organizations: number
    totalCampaigns: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) =>
        setStats({
          totalUsers: d.totalUsers ?? 0,
          organizations: d.organizations ?? 0,
          totalCampaigns: d.totalCampaigns ?? 0,
        }),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="Billing & Monetization"
        description="Stripe billing is not connected yet. Platform usage metrics are live from your database."
      />

      <div className="mx-auto max-w-6xl px-6 pb-12 space-y-6">
        {loading ? (
          <Loader2 className="size-8 animate-spin mx-auto" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Registered users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalUsers ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.organizations ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalCampaigns ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Stripe & subscriptions</CardTitle>
                <CardDescription>
                  Connect Stripe to enable plans, invoices, and usage billing. Until then, all users
                  have full access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Planned plans: Starter, Professional, Enterprise — configure in a future release.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
