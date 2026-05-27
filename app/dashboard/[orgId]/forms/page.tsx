'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Copy, FileInput, Code2 } from 'lucide-react'
import type { FormField } from '@/app/api/forms/route'

type LeadForm = {
  id: string
  name: string
  embedToken: string
  status: string
  fields: FormField[]
  _count?: { submissions: number }
}

const DEFAULT_FIELDS: FormField[] = [
  { id: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'Jane Doe' },
  { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@company.com' },
  { id: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'How can we help?' },
]

export default function FormsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [forms, setForms] = useState<LeadForm[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    fetch(`/api/forms?orgId=${orgId}`, {  })
      .then((r) => r.json())
      .then((d) => setForms(d.forms ?? []))
  }, [orgId])

  const createForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId, name, fields: DEFAULT_FIELDS }),
    })
    if (res.ok) {
      setShowCreate(false)
      setName('')
      const d = await res.json()
      setForms((prev) => [d.form, ...prev])
    }
  }

  const embedCode = (token: string) =>
    `<script src="${appUrl}/webflow/form-embed.js" data-form-token="${token}" async></script>`

  const copyEmbed = (token: string) => {
    navigator.clipboard.writeText(embedCode(token))
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <DashboardShell
      orgId={orgId}
      title="Lead Forms"
      description="Build dynamic forms and embed them on any Webflow page."
      actions={
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-2" /> New form
        </Button>
      }
    >
      {showCreate && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Create lead form</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createForm} className="flex gap-2 max-w-md">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact form" required />
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileInput className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">No forms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a form and paste the embed code into any Webflow page.
            </p>
            <Button onClick={() => setShowCreate(true)}>Create form</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{form.name}</CardTitle>
                    <CardDescription>{form._count?.submissions ?? 0} submissions</CardDescription>
                  </div>
                  <Badge variant="outline">{form.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Fields</p>
                  <div className="flex flex-wrap gap-1">
                    {(form.fields as FormField[]).map((f) => (
                      <Badge key={f.id} variant="secondary" className="text-xs">{f.label}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <Code2 className="size-3" /> Embed code
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyEmbed(form.embedToken)}>
                      <Copy className="size-3 mr-1" />
                      {copied === form.embedToken ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <code className="text-xs break-all text-muted-foreground">{embedCode(form.embedToken)}</code>
                </div>
                <Link href={`/dashboard/${orgId}/forms/${form.id}`}>
                  <Button variant="outline" size="sm" className="w-full">Edit form & submissions</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
