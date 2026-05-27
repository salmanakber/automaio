'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FormFieldBuilder } from '@/components/forms/FormFieldBuilder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Globe, Save, Copy, Code2, Loader2, MapPin } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FormField } from '@/app/api/forms/route'

type Submission = {
  id: string
  data: Record<string, string>
  sourceUrl: string | null
  createdAt: string
}

type FormDetail = {
  id: string
  name: string
  embedToken: string
  status: string
  fields: FormField[]
  settings?: {
    successMessage?: string
    webflowIntegrationId?: string
    webflowPageId?: string
    webflowPageTitle?: string
  }
  submissions: Submission[]
}

export default function FormDetailPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const formId = params.formId as string
  const [form, setForm] = useState<FormDetail | null>(null)
  const [tab, setTab] = useState<'edit' | 'submissions'>('edit')
  const [name, setName] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [appUrl, setAppUrl] = useState('')
  const [integrations, setIntegrations] = useState<Array<{ id: string; siteName: string | null }>>([])
  const [pages, setPages] = useState<Array<{ id: string; title: string }>>([])
  const [integrationId, setIntegrationId] = useState('')
  const [pageId, setPageId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  const load = () => {
    fetch(`/api/forms/${formId}`, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then((r) => r.json())
      .then((d) => {
        const f = d.form as FormDetail | undefined
        if (!f) return
        setForm(f)
        setName(f.name)
        setFields(f.fields as FormField[])
        setSuccessMessage(f.settings?.successMessage ?? 'Thanks! We will be in touch.')
        setIntegrationId(f.settings?.webflowIntegrationId ?? '')
        setPageId(f.settings?.webflowPageId ?? '')
      })
  }

  useEffect(() => {
    fetch(`/api/integrations/webflow?orgId=${orgId}`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then((r) => r.json())
      .then((d) => setIntegrations(d.integrations ?? []))
  }, [orgId])

  useEffect(() => {
    if (!integrationId) {
      setPages([])
      return
    }
    fetch(`/api/integrations/webflow/pages?integrationId=${integrationId}`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then((r) => r.json())
      .then((d) => setPages(d.pages ?? []))
  }, [integrationId])

  const assignToPage = async () => {
    if (!integrationId || !pageId) return
    setAssigning(true)
    setAssignMsg('')
    try {
      const pageTitle = pages.find((p) => p.id === pageId)?.title
      const res = await fetch(`/api/forms/${formId}/assign-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ integrationId, pageId, pageTitle, publishSite: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAssignMsg(`Form added to "${pageTitle ?? 'page'}" and site published.`)
      load()
    } catch (err) {
      setAssignMsg(err instanceof Error ? err.message : 'Failed to assign form')
    } finally {
      setAssigning(false)
    }
  }

  useEffect(() => {
    setAppUrl(window.location.origin)
    load()
  }, [formId])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({
          name,
          fields,
          settings: { successMessage },
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const d = await res.json()
      setForm((prev) => (prev ? { ...prev, ...d.form } : prev))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const embedCode = form
    ? `<script src="${appUrl}/webflow/form-embed.js" data-form-token="${form.embedToken}" async></script>`
    : ''

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardShell
      orgId={orgId}
      title={form?.name ?? 'Form'}
      description="Drag fields to reorder · edit labels · embed on Webflow"
      actions={
        <Link href={`/dashboard/${orgId}/forms`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
        </Link>
      }
    >
      {!form ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <>
          <div className="flex gap-4 border-b mb-6">
            {(['edit', 'submissions'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium border-b-2 capitalize ${
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                }`}
              >
                {t === 'edit' ? 'Form builder' : `Submissions (${form.submissions.length})`}
              </button>
            ))}
          </div>

          {tab === 'edit' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Form settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Form name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Success message</Label>
                      <Input value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fields</CardTitle>
                    <CardDescription>Drag to reorder · add, edit, or remove fields</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormFieldBuilder fields={fields} onChange={setFields} />
                  </CardContent>
                </Card>

                <Button onClick={save} disabled={saving || fields.length === 0} size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-2" />
                      {saved ? 'Saved!' : 'Save form'}
                    </>
                  )}
                </Button>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Live preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.id}>
                        <label className="text-xs font-medium">
                          {field.label}
                          {field.required ? ' *' : ''}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                            placeholder={field.placeholder}
                            rows={3}
                            disabled
                          />
                        ) : field.type === 'select' ? (
                          <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background" disabled>
                            {(field.options ?? []).map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                            placeholder={field.placeholder}
                            disabled
                          />
                        )}
                      </div>
                    ))}
                    <Button className="w-full" disabled>
                      Submit
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="size-4" /> Add to Webflow page
                    </CardTitle>
                    <CardDescription>
                      Automatically inject this form on a Webflow page — no manual copy/paste.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.settings?.webflowPageTitle && (
                      <p className="text-xs text-emerald-700 bg-emerald-500/10 rounded-md px-3 py-2">
                        Currently on: <strong>{form.settings.webflowPageTitle}</strong>
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label>Webflow site</Label>
                      <Select value={integrationId} onValueChange={setIntegrationId}>
                        <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                        <SelectContent>
                          {integrations.map((i) => (
                            <SelectItem key={i.id} value={i.id}>{i.siteName ?? i.id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Page</Label>
                      <Select value={pageId} onValueChange={setPageId} disabled={!integrationId}>
                        <SelectTrigger><SelectValue placeholder="Select page" /></SelectTrigger>
                        <SelectContent>
                          {pages.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      onClick={assignToPage}
                      disabled={assigning || !integrationId || !pageId}
                    >
                      {assigning ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" /> Adding to page…
                        </>
                      ) : (
                        <>
                          <Globe className="size-4 mr-2" /> Add form to page
                        </>
                      )}
                    </Button>
                    {assignMsg && <p className="text-xs text-muted-foreground">{assignMsg}</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code2 className="size-4" /> Manual embed code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs break-all text-muted-foreground block mb-3">{embedCode}</code>
                    <Button variant="outline" size="sm" className="w-full" onClick={copyEmbed}>
                      <Copy className="size-3.5 mr-2" />
                      {copied ? 'Copied!' : 'Copy embed code'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : form.submissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No submissions yet. Embed the form on your Webflow site to start collecting leads.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {form.submissions.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">
                        {sub.data.email ?? sub.data.name ?? 'Submission'}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(sub.data).map(([key, val]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground capitalize">{key}: </span>
                        {val}
                      </div>
                    ))}
                    {sub.sourceUrl && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="size-3" /> {sub.sourceUrl}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
