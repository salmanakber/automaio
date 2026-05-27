'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssetsPage() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Asset Management & Content Library</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Assets</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reused Assets</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Storage Used</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0 GB</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Usage</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0x</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Library Features</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>✓ Media asset storage</div>
          <div>✓ Reusable components</div>
          <div>✓ Brand asset versioning</div>
          <div>✓ AI auto-tagging</div>
          <div>✓ Reuse tracking</div>
          <div>✓ Performance analytics</div>
        </CardContent>
      </Card>
    </div>
  );
}
