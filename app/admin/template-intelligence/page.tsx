'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TemplateIntelligencePage() {
  const [orgId] = useState('your-org-id');
  const { data: templates, isLoading, error } = useSWR(
    `/api/intelligence/templates?orgId=${orgId}`,
    fetcher
  );

  if (isLoading) return <div className="p-8">Loading template intelligence...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading templates</div>;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Template Intelligence & Improvement</h1>
        <p className="text-gray-600">AI-driven template performance scoring and optimization</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {templates && templates.length > 0
                ? (
                    templates.reduce((sum: number, t: any) => sum + t.performanceScore, 0) /
                    templates.length
                  ).toFixed(1)
                : '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{templates?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {templates && templates.length > 0
                ? (
                    templates.reduce((sum: number, t: any) => sum + t.conversionRate, 0) /
                    templates.length
                  ).toFixed(1)
                : '0'}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Performance Heatmap</CardTitle>
          <CardDescription>Usage vs Conversion Impact Analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates && templates.length > 0 &&
              templates?.map((template: any) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex-1">
                    <h3 className="font-semibold">{template.templateId}</h3>
                    <p className="text-sm text-gray-600">{template.industry}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Score</p>
                      <p className="font-bold">{template.performanceScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conversion</p>
                      <p className="font-bold">{template.conversionRate.toFixed(1)}%</p>
                    </div>
                    <Badge>{template.totalUsage} uses</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
