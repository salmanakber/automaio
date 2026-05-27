'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROMPT_TYPES } from '@/lib/prompts/defaults'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type PromptRow = {
  id: string
  promptType: string
  industry: string | null
  version: number
  usageCount: number
  performanceScore: string | number
  promptDriftScore: string | number
  updatedAt: string
}

export default function PromptIntelligencePage() {
  const [prompts, setPrompts] = useState<PromptRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/prompts')
      .then((r) => r.json())
      .then((d) => setPrompts(d.prompts ?? []))
      .finally(() => setLoading(false))
  }, [])

  const industryPrompts = prompts.filter((p) => p.promptType === PROMPT_TYPES.industry)
  const assetPrompts = prompts.filter((p) => p.promptType.startsWith('asset_'))

  return (
    <div>
      <AdminPageHeader
        title="Prompt Intelligence"
        description="Live overview of active platform prompts used by the AI engine."
      >
        <Button asChild variant="outline">
          <Link href="/admin/prompts">Edit prompts</Link>
        </Button>
      </AdminPageHeader>

      <div className="mx-auto max-w-6xl px-6 pb-12 space-y-6">
        {loading ? (
          <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active prompts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{prompts.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Industries covered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{industryPrompts.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Content asset prompts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{assetPrompts.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active prompt registry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4">Industry</th>
                        <th className="pb-2 pr-4">Version</th>
                        <th className="pb-2 pr-4">Usage</th>
                        <th className="pb-2">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prompts.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono text-xs">{p.promptType}</td>
                          <td className="py-2 pr-4">{p.industry ?? '—'}</td>
                          <td className="py-2 pr-4">
                            <Badge variant="secondary">v{p.version}</Badge>
                          </td>
                          <td className="py-2 pr-4">{p.usageCount}</td>
                          <td className="py-2 text-muted-foreground">
                            {new Date(p.updatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Performance scoring and drift detection will populate as campaigns use each prompt.
                  Edit prompts in Prompt & Template Engine.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
