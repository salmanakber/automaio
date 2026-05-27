'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimulationsPage() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Campaign Replay & Simulation Engine</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Simulations Run</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost Saved</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">$0</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li><strong>Replay:</strong> Re-run past campaigns with improvements</li>
            <li><strong>What-If:</strong> Test scenarios (different hook, industry, CTA)</li>
            <li><strong>Improvement:</strong> Simulate optimized versions</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>✓ Predicted engagement probability</div>
          <div>✓ Predicted conversion rate</div>
          <div>✓ Estimated revenue impact</div>
          <div>✓ Expected vs actual comparison</div>
        </CardContent>
      </Card>
    </div>
  );
}
