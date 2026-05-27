'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AutomationPage() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Automation Rule Builder</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Rules</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Rules</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Executions</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example Automation Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm">{'IF campaign_type = "SaaS" THEN use_template = "SaaS_Best"'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm">{'IF cost > threshold THEN switch_model = "cheaper_alt"'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm">{'IF engagement_drops > 20% THEN regenerate_content = true'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm">{'IF industry = "ecommerce" THEN priority_hook = "urgency"'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Workflow Support</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Build complex automation workflows like Zapier inside your system</p>
        </CardContent>
      </Card>
    </div>
  );
}
