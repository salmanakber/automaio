'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RevenueIntelligencePage() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Subscription & Revenue Intelligence</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">MRR</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">$0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ARR</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">$0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Subs</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Metrics Tracked</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>✓ MRR / ARR tracking</li>
            <li>✓ Subscription cohort analysis</li>
            <li>✓ Churn prediction (AI-based)</li>
            <li>✓ Free to paid funnel analytics</li>
            <li>✓ Revenue by industry segment</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
