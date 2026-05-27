'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil } from 'lucide-react'

type Template = {
  id: string
  name: string
  industry: string
  description: string | null
  templateStructure: { status?: string; category?: string }
}

export default function TemplateMarketplace() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  const byIndustry = useMemo(() => {
    const map = new Map<string, Template[]>()
    for (const t of templates) {
      const list = map.get(t.industry) ?? []
      list.push(t)
      map.set(t.industry, list)
    }
    return map
  }, [templates])

  const published = templates.filter(
    (t) => (t.templateStructure as { status?: string })?.status === 'published',
  )
  const draft = templates.filter(
    (t) => (t.templateStructure as { status?: string })?.status !== 'published',
  )

  return (
    <>
      <AdminPageHeader
        title="Template Marketplace"
        description="Manage prebuilt HTML templates available to all Automaio customers."
      />

      <div className="mx-auto max-w-6xl flex-1 space-y-8 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{templates.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{published.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{draft.length}</p>
            </CardContent>
          </Card>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">By industry</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...byIndustry.entries()].map(([industry, items]) => (
                <Card key={industry}>
                  <CardHeader>
                    <CardTitle className="text-base">{industry}</CardTitle>
                    <p className="text-sm text-muted-foreground">{items.length} templates</p>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/admin/templates?industry=${encodeURIComponent(industry)}`}>
                        Browse
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">All templates</h2>
          <div className="space-y-3">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{t.industry}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {(t.templateStructure as { status?: string })?.status ?? 'draft'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/templates/${t.id}`}>
                        <Eye className="size-3.5 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/admin/templates/${t.id}?edit=1`}>
                        <Pencil className="size-3.5 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
