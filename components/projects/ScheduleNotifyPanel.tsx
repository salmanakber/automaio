'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Pencil } from 'lucide-react'
import { AUDIENCE_TYPES } from '@/lib/campaigns/notify-audience'

export type ScheduleNotifySettings = {
  notifySubscribers: boolean
  audienceTypes: string[]
  emailCampaignId: string
}

type ScheduleNotifyPanelProps = {
  orgId: string
  value: ScheduleNotifySettings
  onChange: (next: ScheduleNotifySettings) => void
}

type EmailCampaignOption = { id: string; name: string; subject: string }

export function ScheduleNotifyPanel({ orgId, value, onChange }: ScheduleNotifyPanelProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaignOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/email-campaigns?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [orgId])

  const toggleAudience = (type: string, checked: boolean) => {
    const next = checked
      ? [...value.audienceTypes, type]
      : value.audienceTypes.filter((t) => t !== type)
    onChange({ ...value, audienceTypes: next })
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            Notify subscribers
          </p>
          <p className="text-[10px] text-zinc-500 leading-snug">
            When the schedule fires, email leads in selected audience groups (worker — no Webflow call at schedule time).
          </p>
        </div>
        <Switch
          checked={value.notifySubscribers}
          onCheckedChange={(v) => onChange({ ...value, notifySubscribers: v })}
        />
      </div>

      {value.notifySubscribers && (
        <>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-zinc-500">Audience types</Label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-xs text-zinc-300 capitalize">
                  <Checkbox
                    checked={value.audienceTypes.includes(type)}
                    onCheckedChange={(c) => toggleAudience(type, Boolean(c))}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-zinc-500 flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email template
            </Label>
            <Select
              value={value.emailCampaignId || undefined}
              onValueChange={(id) => onChange({ ...value, emailCampaignId: id })}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-700 h-9 text-xs">
                <SelectValue placeholder={loading ? 'Loading…' : 'Choose email campaign'} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name} — {c.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {value.emailCampaignId && (
              <Button variant="outline" size="sm" className="h-7 text-[10px] border-zinc-700" asChild>
                <Link href={`/dashboard/${orgId}/email?campaign=${value.emailCampaignId}`}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit email template
                </Link>
              </Button>
            )}
            {!campaigns.length && !loading && (
              <p className="text-[10px] text-zinc-500">
                Create an email campaign under Email → then pick it here. Use {'{{projectName}}'} and {'{{liveUrl}}'} in the body.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
