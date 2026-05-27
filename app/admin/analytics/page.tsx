'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminAnalytics() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-3 inline-block">← Back</Link>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm">Total Revenue</div>
            <div className="text-3xl font-bold mt-2">$42,500</div>
            <p className="text-green-600 text-sm mt-1">+12% this month</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm">AI Cost</div>
            <div className="text-3xl font-bold mt-2">$3,240</div>
            <p className="text-muted-foreground text-sm mt-1">7.6% of revenue</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm">Campaigns</div>
            <div className="text-3xl font-bold mt-2">156</div>
            <p className="text-muted-foreground text-sm mt-1">42 this week</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-muted-foreground text-sm">Avg CTR</div>
            <div className="text-3xl font-bold mt-2">3.8%</div>
            <p className="text-muted-foreground text-sm mt-1">Industry: 2.1%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Industry Trends</h3>
            <div className="space-y-2">
              {['SaaS', 'E-commerce', 'Finance', 'Healthcare'].map((ind) => (
                <div key={ind} className="flex justify-between text-sm">
                  <span>{ind}</span>
                  <span className="font-semibold">{Math.random() * 5 + 2}% avg CTR</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Webflow Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Calls</span>
                <span className="font-semibold">15,420</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sites Synced</span>
                <span className="font-semibold">28</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pages Created</span>
                <span className="font-semibold">342</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
