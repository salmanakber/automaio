'use client'

import { useState, useEffect } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function QueueManagementPage() {
  const [queues, setQueues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const queueNames = [
    'campaign-generation',
    'content-generation',
    'campaign-schedule',
    'analytics',
  ]

  useEffect(() => {
    const fetchQueueStatus = async () => {
      setLoading(true)
      const newQueues: Record<string, any> = {}

      for (const queue of queueNames) {
        try {
          const res = await fetch(`/api/queue/jobs?queue=${queue}`)
          const data = await res.json()
          newQueues[queue] = data.counts || {}
        } catch (error) {
          console.error(`Failed to fetch ${queue}:`, error)
        }
      }

      setQueues(newQueues)
      setLoading(false)
    }

    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <AdminPageHeader
        title="Queue Management"
        description="Monitor and manage BullMQ background jobs in real time."
      />
      <div className="space-y-6 p-6">

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {queueNames.map((queueName) => {
          const queue = queues[queueName] || {}
          const total = (queue.waiting || 0) + (queue.active || 0) + (queue.delayed || 0)

          return (
            <Card key={queueName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg capitalize">{queueName.replace('-', ' ')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Waiting:</span>
                  <Badge variant="outline">{queue.waiting || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {queue.active || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delayed:</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    {queue.delayed || 0}
                  </Badge>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">Total:</span>
                  <Badge className="bg-black text-white">{total}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-600">Loading queue data...</p>
            ) : (
              <div className="grid gap-4">
                {queueNames.map((queueName) => (
                  <div key={queueName} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold capitalize">{queueName.replace('-', ' ')}</h3>
                      <Button size="sm" variant="outline">
                        View Jobs
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Waiting</p>
                        <p className="text-lg font-bold">{queues[queueName]?.waiting || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Active</p>
                        <p className="text-lg font-bold text-blue-600">{queues[queueName]?.active || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="text-lg font-bold text-green-600">{queues[queueName]?.completed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Failed</p>
                        <p className="text-lg font-bold text-red-600">{queues[queueName]?.failed || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Start Workers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
            <p className="text-gray-600 mb-2">Development (with file watching):</p>
            <code className="text-black">pnpm run worker:dev</code>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
            <p className="text-gray-600 mb-2">Production (worker only):</p>
            <code className="text-black">pnpm run worker:start</code>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
            <p className="text-gray-600 mb-2">Set Redis URL (optional):</p>
            <code className="text-black">REDIS_URL=redis://localhost:6379 pnpm run worker:start</code>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
