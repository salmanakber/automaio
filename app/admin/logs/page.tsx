'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LogsDebugging() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedTab, setSelectedTab] = useState('api-logs')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-3 inline-block">← Back</Link>
          <h1 className="text-3xl font-bold">Logs & Debugging Center</h1>
        </div>
      </header>

      <div className="border-b bg-card sticky top-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['api-logs', 'errors', 'prompts', 'webhooks', 'health'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-4 border-b-2 font-medium capitalize ${
                  selectedTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {selectedTab === 'api-logs' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">API Logs</h2>
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-background/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold">Endpoint</th>
                    <th className="px-4 py-3 text-left font-semibold">Method</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[1,2,3,4,5].map((i) => (
                    <tr key={i} className="hover:bg-background/50">
                      <td className="px-4 py-3">2024-05-15 14:3{i}:00</td>
                      <td className="px-4 py-3 font-mono">/api/campaigns</td>
                      <td className="px-4 py-3">POST</td>
                      <td className="px-4 py-3"><span className="bg-green-500/20 text-green-700 px-2 py-1 rounded text-xs">200</span></td>
                      <td className="px-4 py-3">{245 + i*10}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'errors' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Error Tracking</h2>
            <div className="space-y-3">
              {[1,2].map((i) => (
                <div key={i} className="bg-card rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Error: Invalid API Key</h3>
                      <p className="text-muted-foreground text-sm mt-1">Occurred 5 times in last 24h</p>
                      <p className="text-muted-foreground text-sm font-mono mt-2">Endpoint: /api/webflow/sync</p>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'prompts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Prompt Tracing</h2>
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-card rounded-lg border p-4">
                  <h3 className="font-semibold">Campaign {i} - Email Generation</h3>
                  <p className="text-muted-foreground text-sm mt-2">Model: gpt-4o | Tokens: 250 | Cost: $0.08</p>
                  <Button variant="outline" size="sm" className="mt-3">View Prompt</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'webhooks' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Webhooks Logs</h2>
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-background/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Event</th>
                    <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Retry</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[1,2,3].map((i) => (
                    <tr key={i} className="hover:bg-background/50">
                      <td className="px-4 py-3">campaign.created</td>
                      <td className="px-4 py-3">2024-05-15 14:3{i}:00</td>
                      <td className="px-4 py-3"><span className="bg-green-500/20 text-green-700 px-2 py-1 rounded text-xs">Success</span></td>
                      <td className="px-4 py-3 text-muted-foreground">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'health' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-2 gap-6">
              {['API Server', 'Database', 'Cache', 'Queue'].map((service) => (
                <div key={service} className="bg-card rounded-lg border p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{service}</h3>
                    <span className="w-3 h-3 rounded-full bg-green-600"></span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">Uptime: 99.99%</p>
                  <p className="text-muted-foreground text-sm">Response: 45ms avg</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
