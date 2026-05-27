'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface WebflowConnection {
  id: string
  siteName: string
  siteId: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync: string
  collections: number
  apiCallsToday: number
  nextRateLimitReset: string
}

export default function WebflowBridge() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [connections, setConnections] = useState<WebflowConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('connections') // connections, logs, mapping, rates

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      // Mock data
      setConnections([
        {
          id: '1',
          siteName: 'Marketing Site',
          siteId: 'webflow-001',
          status: 'connected',
          lastSync: '2024-05-15 14:32',
          collections: 5,
          apiCallsToday: 145,
          nextRateLimitReset: '2024-05-16 00:00',
        },
        {
          id: '2',
          siteName: 'Customer Portal',
          siteId: 'webflow-002',
          status: 'connected',
          lastSync: '2024-05-15 12:15',
          collections: 3,
          apiCallsToday: 98,
          nextRateLimitReset: '2024-05-16 00:00',
        },
      ])
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeToken = async (connectionId: string) => {
    try {
      await fetch(`/api/integrations/webflow/${connectionId}/revoke`, { method: 'POST' })
      fetchConnections()
    } catch (error) {
      console.error('Failed to revoke token:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-3 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">Webflow API Bridge Management</h1>
          <p className="text-muted-foreground mt-1">Manage OAuth connections, API logs, and integrations</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-card sticky top-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['connections', 'logs', 'mapping', 'rates'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-4 border-b-2 font-medium capitalize ${
                  selectedTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {selectedTab === 'connections' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Connected Webflow Sites</h2>
              <Button>+ New Connection</Button>
            </div>

            <div className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.id} className="bg-card rounded-lg border p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{conn.siteName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          conn.status === 'connected'
                            ? 'bg-green-500/20 text-green-700'
                            : conn.status === 'error'
                            ? 'bg-red-500/20 text-red-700'
                            : 'bg-gray-500/20 text-gray-700'
                        }`}>
                          {conn.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Site ID: {conn.siteId}</p>
                      <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Collections:</span> {conn.collections}
                        </div>
                        <div>
                          <span className="text-muted-foreground">API Calls Today:</span> {conn.apiCallsToday}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Sync:</span> {conn.lastSync}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate Limit Reset:</span> {conn.nextRateLimitReset}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeToken(conn.id)}
                      >
                        Revoke Token
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'logs' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">API Logs & Activity</h2>
            <div className="bg-card rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-background/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Timestamp</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Site</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Endpoint</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-background/50">
                        <td className="px-4 py-3 text-sm">2024-05-15 14:32:{String(i).padStart(2, '0')}</td>
                        <td className="px-4 py-3 text-sm">Marketing Site</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">/sites/{i}/collections</td>
                        <td className="px-4 py-3 text-sm">GET</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-green-500/20 text-green-700 px-2 py-1 rounded text-xs font-medium">
                            200
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{123 + i * 10}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'mapping' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">CMS Field Mapping</h2>
            <div className="space-y-4">
              {['Marketing Site', 'Customer Portal'].map((site) => (
                <div key={site} className="bg-card rounded-lg border p-6">
                  <h3 className="font-semibold mb-4">{site}</h3>
                  <div className="space-y-3">
                    {['campaign_title', 'campaign_description', 'campaign_image', 'campaign_cta'].map((field) => (
                      <div key={field} className="flex items-center justify-between p-3 bg-background rounded-md">
                        <span className="font-mono text-sm">{field}</span>
                        <select className="px-3 py-2 border rounded-md text-sm bg-background w-40">
                          <option>Select CMS field...</option>
                          <option>Field 1</option>
                          <option>Field 2</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4">Save Mapping</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'rates' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Rate Limit Control</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Global Rate Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Requests per Minute</label>
                    <input
                      type="number"
                      defaultValue="120"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Requests per Hour</label>
                    <input
                      type="number"
                      defaultValue="5000"
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <Button>Save Limits</Button>
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Current Usage</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>This Minute</span>
                      <span className="font-semibold">45/120</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '37.5%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>This Hour</span>
                      <span className="font-semibold">2340/5000</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '46.8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
