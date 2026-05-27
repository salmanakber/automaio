'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Mail, Send, Users } from 'lucide-react'
import { TemplatePicker, type TemplateOption } from '@/components/campaigns/TemplatePicker'
import { getTemplateHtml } from '@/lib/webflow/template-renderer'

type EmailCampaign = {
  id: string
  name: string
  subject: string
  status: string
  frequency: string
  nextSendAt: string | null
}

type Subscriber = {
  id: string
  email: string
  firstName: string | null
  status: string
}

export default function EmailPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showAddSub, setShowAddSub] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', htmlBody: '' })
  const [emailTemplateId, setEmailTemplateId] = useState<string | undefined>()
  const [subEmail, setSubEmail] = useState('')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [frequency, setFrequency] = useState('once')
  const [loading, setLoading] = useState(false)

  const load = () => {
    fetch(`/api/email-campaigns?orgId=${orgId}`, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
    fetch(`/api/subscribers?orgId=${orgId}`, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then((r) => r.json())
      .then((d) => setSubscribers(d.subscribers ?? []))
  }

  useEffect(() => {
    load()
  }, [orgId])

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ organizationId: orgId, ...form, frequency }),
      })
      if (!res.ok) throw new Error('Failed')
      setShowCreate(false)
      setForm({ name: '', subject: '', htmlBody: '' })
      load()
    } finally {
      setLoading(false)
    }
  }

  const addSubscriber = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
      body: JSON.stringify({ organizationId: orgId, email: subEmail }),
    })
    setSubEmail('')
    setShowAddSub(false)
    load()
  }

  const sendNow = async (id: string) => {
    setLoading(true)
    await fetch(`/api/email-campaigns/${id}?action=send-now`, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
    load()
    setLoading(false)
  }

  const scheduleCampaign = async (id: string) => {
    if (!scheduledAt) return
    setLoading(true)
    await fetch(`/api/email-campaigns/${id}?action=schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
      body: JSON.stringify({ scheduledFor: new Date(scheduledAt).toISOString(), frequency }),
    })
    setScheduleId(null)
    load()
    setLoading(false)
  }

  const applyEmailTemplate = (template: TemplateOption) => {
    setEmailTemplateId(template.id)
    const html = getTemplateHtml(template.templateStructure)
    setForm((prev) => ({ ...prev, htmlBody: html }))
  }

  return (
    <DashboardShell
      orgId={orgId}
      title="Email Campaigns"
      description="Create campaigns, schedule sends (daily, twice daily, weekly), and manage subscribers."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddSub(true)}>
            <Users className="size-4 mr-2" /> Add subscriber
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-2" /> New campaign
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Mail className="size-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{campaigns.length}</p>
              <p className="text-xs text-muted-foreground">Email campaigns</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="size-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{subscribers.filter((s) => s.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Active subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              Email delivery uses Brevo → Resend → Amazon SES fallback chain so sends never fail silently.
            </p>
          </CardContent>
        </Card>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New email campaign</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createCampaign} className="space-y-4">
              <div className="space-y-2">
                <Label>Email template</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Pick an email template category design, then edit the HTML below or in the visual editor after saving.
                </p>
                <TemplatePicker
                  selectedId={emailTemplateId}
                  onSelect={applyEmailTemplate}
                  categoryFilter="email"
                />
              </div>
              <div className="space-y-2 max-w-lg"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2 max-w-lg"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
              <div className="space-y-2"><Label>HTML body</Label><Textarea value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} rows={8} required /></div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice_daily">Twice daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showAddSub && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Add subscriber</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addSubscriber} className="flex gap-2 max-w-md">
              <Input type="email" value={subEmail} onChange={(e) => setSubEmail(e.target.value)} placeholder="email@example.com" required />
              <Button type="submit">Add</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddSub(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground text-sm">No email campaigns yet.</CardContent></Card>
        ) : (
          campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.subject}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{c.status}</Badge>
                      <Badge variant="outline" className="capitalize">{c.frequency.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => sendNow(c.id)} disabled={loading}>
                      <Send className="size-3 mr-1" /> Send now
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setScheduleId(c.id)}>Schedule</Button>
                  </div>
                </div>
                {scheduleId === c.id && (
                  <div className="mt-4 flex gap-2 items-end flex-wrap p-3 rounded-lg border bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-xs">Send at</Label>
                      <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                    </div>
                    <Button size="sm" onClick={() => scheduleCampaign(c.id)} disabled={loading}>Confirm schedule</Button>
                    <Button size="sm" variant="ghost" onClick={() => setScheduleId(null)}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  )
}
