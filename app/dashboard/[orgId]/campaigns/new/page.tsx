'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { CampaignBuilder } from '@/components/CampaignBuilder'
import { Sidebar } from '@/components/Sidebar'

export default function NewCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organizationId: orgId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      const campaignId = result.campaign.id as string
      router.push(`/dashboard/${orgId}/campaigns/${campaignId}?generate=1`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar orgId={orgId} />
      <main className="flex-1 ml-64 p-8 max-w-4xl">
        <Link
          href={`/dashboard/${orgId}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Back to campaigns
        </Link>
        <CampaignBuilder onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  )
}
