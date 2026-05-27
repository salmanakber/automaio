'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GrowthLabPage() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Experimentation & Growth Lab</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Tests</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed Tests</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Winners Found</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Uplift</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0%</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Types Available</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-4">
            <li>✓ A/B Testing</li>
            <li>✓ Multivariate Testing</li>
            <li>✓ Hook Experimentation</li>
            <li>✓ CTA Testing</li>
            <li>✓ Auto Promotion</li>
            <li>✓ Statistical Confidence</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
