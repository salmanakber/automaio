'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, FileUp, Pencil } from 'lucide-react'

type TemplateRow = {
  id: string
  name: string
  industry: string
  description: string | null
  templateStructure: {
    html?: string
    status?: string
    category?: string
  }
  createdAt: string
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <AdminPageHeader
        title="Campaign Templates"
        description="Prebuilt and imported HTML templates. Automaio merges campaign data and publishes to Webflow CMS."
      >
        <Button asChild>
          <Link href="/admin/templates/import">
            <FileUp className="size-4 mr-2" />
            Import HTML
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="mx-auto max-w-6xl px-6 -mt-2 mb-2">
        <p className="text-sm text-muted-foreground rounded-lg border bg-muted/40 px-4 py-3">
          <strong>Import HTML</strong> is for bringing your own .html files — not for building a
          blank template from scratch. Edit any template below to adjust imported or seeded markup.
        </p>
      </div>

      <div className="mx-auto max-w-6xl flex-1 space-y-6 p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No templates yet. Run <code className="text-sm">npm run db:seed</code> or create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => {
              const structure = t.templateStructure as TemplateRow['templateStructure']
              return (
                <Card key={t.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <Badge variant="secondary">{t.industry}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {t.description ?? 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {structure?.category ?? 'landing'}
                    </Badge>
                    <Badge
                      variant={structure?.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {structure?.status ?? 'draft'}
                    </Badge>
                    <div className="flex w-full gap-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/admin/templates/${t.id}`}>
                          <Eye className="size-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/admin/templates/${t.id}?edit=1`}>
                          <Pencil className="size-3.5 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
