'use client'

import { useEffect, useState } from 'react'

interface AnalyticsData {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  avgEngagementRate: number
  avgROI: number
  ctr: number
  conversionRate: number
}

interface AnalyticsDashboardProps {
  campaignId: string
}

export function AnalyticsDashboard({ campaignId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(
          `/api/campaigns/${campaignId}/analytics?days=${days}`
        )
        const result = await res.json()
        setData(result.summary)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [campaignId, days])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Impressions',
      value: data.totalImpressions.toLocaleString(),
      change: '+12%',
    },
    {
      label: 'Clicks',
      value: data.totalClicks.toLocaleString(),
      change: '+8%',
    },
    {
      label: 'Conversions',
      value: data.totalConversions.toLocaleString(),
      change: '+15%',
    },
    {
      label: 'Revenue',
      value: `$${data.totalRevenue.toLocaleString()}`,
      change: '+22%',
    },
    {
      label: 'CTR',
      value: `${data.ctr.toFixed(2)}%`,
      change: '+5%',
    },
    {
      label: 'Conversion Rate',
      value: `${data.conversionRate.toFixed(2)}%`,
      change: '+18%',
    },
    {
      label: 'Avg Engagement',
      value: `${data.avgEngagementRate.toFixed(1)}%`,
      change: '+3%',
    },
    {
      label: 'Average ROI',
      value: `${data.avgROI.toFixed(1)}%`,
      change: '+11%',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Campaign Performance</h3>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-card rounded-lg border p-6 hover:border-primary/50 transition-colors"
          >
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {metric.label}
            </p>
            <div className="flex justify-between items-end gap-4">
              <p className="text-2xl font-bold">{metric.value}</p>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
