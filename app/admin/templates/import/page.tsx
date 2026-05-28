'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IndustrySelect } from '@/components/ui/industry-select'
import { DEFAULT_INDUSTRY } from '@/lib/industries'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FileUp, Info } from 'lucide-react'

import {
  buildDefaultPreviewSample,
  extractPlaceholders,
  renderTemplatePreview,
} from '@/lib/templates/preview'
import { DEFAULT_TEMPLATE_THEME, type TemplateTheme } from '@/lib/templates/theme'
import { TemplateColorsGuide } from '@/components/admin/TemplateColorsGuide'

export default function ImportTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState(DEFAULT_INDUSTRY)
  const [description, setDescription] = useState('')
  const [html, setHtml] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewSample, setPreviewSample] = useState<Record<string, string>>({})
  const [theme, setTheme] = useState<TemplateTheme>({ ...DEFAULT_TEMPLATE_THEME })

  const placeholders = useMemo(() => extractPlaceholders(html), [html])

  const previewDoc = useMemo(() => {
    if (!html.trim()) return ''
    const sample =
      Object.keys(previewSample).length > 0
        ? { ...buildDefaultPreviewSample(html), ...previewSample }
        : buildDefaultPreviewSample(html)
    return renderTemplatePreview(html, sample, theme)
  }, [html, previewSample, theme])

  const handleFile = (file: File | null) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setHtml(text)
      if (!name) {
        const base = file.name.replace(/\.(html?|htm)$/i, '')
        setName(base.replace(/[-_]/g, ' '))
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setError(null)
    if (!name.trim()) {
      setError('Template name is required.')
      return
    }
    if (!html.trim() || !html.includes('<')) {
      setError('Paste or upload valid HTML (must include at least one HTML tag).')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          industry,
          description:
            description.trim() ||
            `Imported HTML template${fileName ? ` from ${fileName}` : ''}. Ready for Webflow CMS.`,
          templateStructure: {
            html,
            placeholders,
            previewSample:
              Object.keys(previewSample).length > 0
                ? { ...buildDefaultPreviewSample(html), ...previewSample }
                : buildDefaultPreviewSample(html),
            theme,
            status: 'draft',
            category: 'landing',
            source: 'import',
          },
          bestPractices: [
            'Layout + brand colors only; campaign AI writes all customer-facing copy.',
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      router.push(`/admin/templates/${data.template.id}?edit=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Import HTML template"
        description="Bring your own Webflow-ready HTML. This is not a blank template builder."
      >
        <Button variant="outline" asChild size="sm">
          <Link href="/admin/templates">Back to library</Link>
        </Button>
        <Button size="sm" onClick={handleImport} disabled={saving || !html.trim()}>
          {saving ? 'Importing…' : 'Import template'}
        </Button>
      </AdminPageHeader>

      <div className="mx-auto max-w-3xl flex-1 space-y-6 p-6">
        <TemplateColorsGuide />
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Theme = layout + colors (not copy)</AlertTitle>
          <AlertDescription>
            Upload HTML for structure. Users describe their launch in plain language; AI writes
            the full page when they create a campaign. Use built-in templates in the library if
            you do not have HTML yet.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Upload or paste HTML</CardTitle>
            <CardDescription>
              Accepts .html / .htm files. Use sections, classes (.cta, .badge) or CSS variables for
              colors — see the color guide above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Label
                htmlFor="html-file"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm hover:bg-muted/50 sm:flex-1"
              >
                <FileUp className="size-4" />
                {fileName ? `Selected: ${fileName}` : 'Choose .html file'}
              </Label>
              <input
                id="html-file"
                type="file"
                accept=".html,.htm,text/html"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Textarea
              className="font-mono text-xs min-h-[240px]"
              placeholder="<html>...</html>"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />
            {placeholders.length > 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Legacy placeholders detected ({placeholders.join(', ')}). New campaigns use AI
                copy instead — you can remove these from HTML.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Template metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-name">Display name</Label>
              <Input
                id="import-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Agency landing — imported"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-industry">Industry</Label>
              <IndustrySelect
                id="import-industry"
                value={industry}
                onChange={setIndustry}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-desc">Description (optional)</Label>
              <Textarea
                id="import-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note for your team"
              />
            </div>
          </CardContent>
        </Card>

        {html.trim() ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
              <CardDescription>Brand colors are customized in the project visual editor after import.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                title="Import preview"
                className="h-[360px] w-full border-t bg-white"
                srcDoc={previewDoc}
                sandbox="allow-same-origin"
              />
            </CardContent>
          </Card>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </>
  )
}
