'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompliancePage() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Compliance & Content Safety Layer</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rules Active</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content Flagged</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Violations Blocked</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approval Queue</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Rule Types</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Policy Enforcement</h4>
            <p className="text-sm text-gray-600">Block unsafe claims and industries</p>
          </div>
          <div>
            <h4 className="font-semibold">Tone Checking</h4>
            <p className="text-sm text-gray-600">Brand tone compliance</p>
          </div>
          <div>
            <h4 className="font-semibold">Regional Compliance</h4>
            <p className="text-sm text-gray-600">EU, US, region-specific rules</p>
          </div>
          <div>
            <h4 className="font-semibold">Claim Validation</h4>
            <p className="text-sm text-gray-600">Verify product claims</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>✓ AI content policy enforcement</li>
            <li>✓ Unsafe claim detection</li>
            <li>✓ Brand tone compliance checks</li>
            <li>✓ Regional compliance rules</li>
            <li>✓ Content approval workflow (enterprise)</li>
            <li>✓ Auto-flag problematic content</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
