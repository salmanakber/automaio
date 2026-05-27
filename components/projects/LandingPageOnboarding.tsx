'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Globe, Target, Megaphone, CheckCircle2 } from 'lucide-react'
import { TONE_PRESETS, type TonePresetId } from '@/lib/ai/tone-presets'
import type { BusinessContext, CtaGoal } from '@/lib/ai/business-context-types'
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
  clearOnboardingDraft,
} from '@/lib/onboarding/persistence'

export type OnboardingFormData = {
  websiteUrl: string
  businessDescription: string
  primaryGoal: string
  targetAudience: string
  offer: string
  tonePreset: TonePresetId
  ctaGoal: CtaGoal
}

const DEFAULT_FORM: OnboardingFormData = {
  websiteUrl: '',
  businessDescription: '',
  primaryGoal: '',
  targetAudience: '',
  offer: '',
  tonePreset: 'high_converting',
  ctaGoal: 'leads',
}

const CTA_GOALS: Array<{ value: CtaGoal; label: string }> = [
  { value: 'leads', label: 'Lead generation' },
  { value: 'bookings', label: 'Bookings / demos' },
  { value: 'app_installs', label: 'App installs' },
  { value: 'sales', label: 'Direct sales' },
  { value: 'awareness', label: 'Brand awareness' },
]

type LandingPageOnboardingProps = {
  orgId: string
  onComplete: (data: OnboardingFormData, context?: BusinessContext) => void
  onSkip?: () => void
  onDraftChange?: (data: OnboardingFormData) => void
  compact?: boolean
  initialData?: Partial<OnboardingFormData>
  storageKey?: string
  projectId?: string
}

export function LandingPageOnboarding({
  orgId,
  onComplete,
  onSkip,
  onDraftChange,
  compact = false,
  initialData,
  storageKey,
  projectId,
}: LandingPageOnboardingProps) {
  const [form, setForm] = useState<OnboardingFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  })
  const [extracting, setExtracting] = useState(false)
  const [context, setContext] = useState<BusinessContext | null>(null)
  const [error, setError] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const key = storageKey ?? `automaio-onboarding:${orgId}:wizard`
    const draft = loadOnboardingDraft(key)
    if (draft && !initialData) {
      setForm((f) => ({ ...f, ...draft }))
    }
  }, [orgId, storageKey, initialData])

  useEffect(() => {
    onDraftChange?.(form)

    const key = storageKey ?? `automaio-onboarding:${orgId}:wizard`
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveOnboardingDraft(key, form)
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)

      if (projectId) {
        fetch(`/api/projects/${projectId}/onboarding`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingDraft: form }),
        }).catch(() => {})
      }
    }, 600)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [form, orgId, storageKey, projectId, onDraftChange])

  const update = <K extends keyof OnboardingFormData>(key: K, value: OnboardingFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const canExtract =
    form.websiteUrl.trim().length > 4 || form.businessDescription.trim().length > 10

  const handleExtract = async () => {
    if (!canExtract) return
    setExtracting(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/extract-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          websiteUrl: form.websiteUrl || undefined,
          businessDescription: form.businessDescription || undefined,
          primaryGoal: form.primaryGoal || undefined,
          targetAudience: form.targetAudience || undefined,
          offer: form.offer || undefined,
          tonePreset: form.tonePreset,
          ctaGoal: form.ctaGoal,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const ctx = data.context as BusinessContext
      setContext(ctx)

      setForm((f) => ({
        ...f,
        businessDescription: ctx.description ?? f.businessDescription,
        targetAudience: ctx.targetAudience ?? f.targetAudience,
        offer: ctx.offer ?? f.offer,
        primaryGoal: ctx.primaryGoal ?? f.primaryGoal,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const handleContinue = () => {
    const key = storageKey ?? `automaio-onboarding:${orgId}:wizard`
    clearOnboardingDraft(key)
    onComplete(form, context ?? undefined)
  }

  return (
    <Card className={compact ? 'border-primary/20' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <CardTitle className="text-lg">AI Business Onboarding</CardTitle>
        </div>
        <CardDescription>
          Tell us about your business — AI will personalize your landing page automatically.
          Provide a website URL, a short description, or both.
          {draftSaved && (
            <span className="block text-emerald-600 text-xs mt-1">Draft saved</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-muted-foreground" />
            Existing website URL
          </Label>
          <Input
            value={form.websiteUrl}
            onChange={(e) => update('websiteUrl', e.target.value)}
            placeholder="https://yourcompany.com"
          />
          <p className="text-xs text-muted-foreground">
            Optional — we&apos;ll extract company info, services, tone, and CTAs automatically.
          </p>
        </div>

        <div className="space-y-2">
          <Label>What does your business do?</Label>
          <Textarea
            value={form.businessDescription}
            onChange={(e) => update('businessDescription', e.target.value)}
            placeholder="We help SaaS teams launch conversion-focused landing pages in minutes…"
            rows={3}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Target className="size-3.5 text-muted-foreground" />
              Primary landing page goal
            </Label>
            <Input
              value={form.primaryGoal}
              onChange={(e) => update('primaryGoal', e.target.value)}
              placeholder="Generate qualified leads"
            />
          </div>
          <div className="space-y-2">
            <Label>Target audience</Label>
            <Input
              value={form.targetAudience}
              onChange={(e) => update('targetAudience', e.target.value)}
              placeholder="Marketing managers at B2B SaaS"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Megaphone className="size-3.5 text-muted-foreground" />
              Product / service promoted
            </Label>
            <Input
              value={form.offer}
              onChange={(e) => update('offer', e.target.value)}
              placeholder="AI landing page builder"
            />
          </div>
          <div className="space-y-2">
            <Label>CTA goal</Label>
            <Select value={form.ctaGoal} onValueChange={(v) => update('ctaGoal', v as CtaGoal)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CTA_GOALS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tone & style</Label>
          <Select
            value={form.tonePreset}
            onValueChange={(v) => update('tonePreset', v as TonePresetId)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TONE_PRESETS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label} — {t.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {context && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              Business understood
              <Badge variant="outline" className="text-[10px] ml-auto">
                {context.extractionSource}
              </Badge>
            </div>
            {context.companyName && (
              <p className="text-sm"><strong>Company:</strong> {context.companyName}</p>
            )}
            {context.description && (
              <p className="text-xs text-muted-foreground">{context.description}</p>
            )}
            {context.valuePropositions && context.valuePropositions.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4">
                {context.valuePropositions.slice(0, 3).map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExtract}
            disabled={extracting || !canExtract}
          >
            {extracting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Analyze business
              </>
            )}
          </Button>
          <Button type="button" onClick={handleContinue} disabled={!canExtract}>
            Continue with AI personalization
          </Button>
          {onSkip && (
            <Button type="button" variant="ghost" onClick={onSkip}>
              Skip — edit manually
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
