'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save } from 'lucide-react'
import type { TemplateStructure } from '@/lib/templates/starter-templates'
import { IndustrySelect } from '@/components/ui/industry-select'
import { DEFAULT_INDUSTRY } from '@/lib/industries'
import {
  extractPlaceholders,
  renderTemplatePreview,
  resolvePreviewSample,
} from '@/lib/templates/preview'
import { DEFAULT_TEMPLATE_THEME, resolveTemplateTheme, type TemplateTheme } from '@/lib/templates/theme'
import { WebflowThemeFields } from '@/components/admin/TemplateEditorPanels'
import { TemplateColorsGuide } from '@/components/admin/TemplateColorsGuide'

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const startEditing = searchParams.get('edit') === '1'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(startEditing)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState(DEFAULT_INDUSTRY)
  const [description, setDescription] = useState('')
  const [html, setHtml] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [category, setCategory] = useState<'landing' | 'email' | 'promo'>('landing')
  const [previewSample, setPreviewSample] = useState<Record<string, string>>({})
  const [theme, setTheme] = useState<TemplateTheme>({ ...DEFAULT_TEMPLATE_THEME })

  useEffect(() => {
    if (!id) return
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const t = data.template
        if (!t) return
        setName(t.name)
        setIndustry(t.industry)
        setDescription(t.description ?? '')
        const structure = t.templateStructure as TemplateStructure
        setHtml(structure?.html ?? '')
        setStatus(structure?.status ?? 'published')
        setCategory(structure?.category ?? 'landing')
        setPreviewSample(structure?.previewSample ?? {})
        setTheme(resolveTemplateTheme(structure))
      })
      .finally(() => setLoading(false))
  }, [id])

  const placeholderTokens = useMemo(() => extractPlaceholders(html), [html])

  const previewHtml = useMemo(
    () =>
      renderTemplatePreview(html, resolvePreviewSample({ html, previewSample }), theme),
    [html, previewSample, theme],
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const unique = extractPlaceholders(html)
      const sample: Record<string, string> = {}
      for (const token of unique) {
        if (previewSample[token]?.trim()) sample[token] = previewSample[token].trim()
      }

      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          description,
          templateStructure: {
            html,
            placeholders: unique,
            status,
            category,
            previewSample: Object.keys(sample).length ? sample : undefined,
            theme,
          },
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setEditing(false)
    } catch (e) {
      console.error(e)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <AdminPageHeader title={name || 'Template'} description={description || 'HTML campaign template'}>
        <Button variant="outline" asChild size="sm">
          <Link href="/admin/templates">
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Link>
        </Button>
        {editing ? (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="size-4 mr-1" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setEditing(true)}>
            Edit HTML
          </Button>
        )}
      </AdminPageHeader>

      <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6">
        {editing ? <TemplateColorsGuide /> : null}
        <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{editing ? 'Edit theme' : 'Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <IndustrySelect id="industry" value={industry} onChange={setIndustry} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as typeof status)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as typeof category)}
                    >
                      <option value="landing">Landing</option>
                      <option value="promo">Promo</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="html">Layout HTML</Label>
                  <Textarea
                    id="html"
                    className="font-mono text-xs min-h-[320px]"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Structure only — lorem or empty headings are fine. AI writes real copy when
                    users launch a campaign.
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <WebflowThemeFields theme={theme} onChange={setTheme} />
                </div>
              </>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="font-medium">{industry}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium capitalize">{status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium capitalize">{category}</dd>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Click <strong>Edit HTML</strong> to change layout and brand colors.
                </p>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Library preview (sample styling). Real campaigns use AI-written copy from the user&apos;s
              launch brief.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="preview">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="source">HTML source</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="m-0">
                <iframe
                  title="Template preview"
                  className="h-[520px] w-full border-t bg-white"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                />
              </TabsContent>
              <TabsContent value="source" className="p-4">
                <pre className="max-h-[480px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {html}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  )
}
