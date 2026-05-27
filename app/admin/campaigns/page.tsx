'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CampaignMonitor {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  aiModel: string
  contentCount: number
  errorCount: number
  createdAt: string
}

export default function CampaignMonitoring() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignMonitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    setCampaigns([
      {
        id: '1',
        name: 'Q2 Product Launch',
        status: 'active',
        aiModel: 'gpt-4o',
        contentCount: 12,
        errorCount: 0,
        createdAt: '2024-04-15',
      },
      {
        id: '2',
        name: 'Summer Sale Campaign',
        status: 'draft',
        aiModel: 'claude-opus',
        contentCount: 8,
        errorCount: 2,
        createdAt: '2024-05-01',
      },
    ])
    setLoading(false)
  }, [])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-3 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">Campaign System Monitoring</h1>
          <p className="text-muted-foreground mt-1">View, inspect, and manage campaigns</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-card rounded-lg border p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-500/20 text-green-700' :
                      campaign.status === 'draft' ? 'bg-gray-500/20 text-gray-700' :
                      campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-700' :
                      'bg-blue-500/20 text-blue-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">AI Model:</span> {campaign.aiModel}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Content Assets:</span> {campaign.contentCount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Errors:</span>
                      <span className={campaign.errorCount > 0 ? 'text-red-600 ml-1 font-semibold' : 'text-green-600 ml-1'}>
                        {campaign.errorCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span> {campaign.createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Inspect</Button>
                  <Button variant="outline" size="sm">Logs</Button>
                  <Button variant="outline" size="sm">Clone</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
