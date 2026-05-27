'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TemplatePicker, type TemplateOption } from '@/components/campaigns/TemplatePicker'
import { LandingPageOnboarding, type OnboardingFormData } from '@/components/projects/LandingPageOnboarding'
import { SetupHealthChecklist } from '@/components/dashboard/SetupHealthChecklist'
import {
  loadWizardDraft,
  saveWizardDraft,
  clearWizardDraft,
  onboardingStorageKey,
} from '@/lib/onboarding/persistence'
import { CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { isWebflowOAuthConfigured } from '@/lib/integrations/webflow-oauth'

const STEPS = ['Connect Webflow', 'Pick template', 'AI personalize', 'Open studio'] as const

type Integration = {
  id: string
  siteName: string | null
  campaignsCollectionId: string | null
  collections?: { collections: Array<{ id: string; name: string }> }
}

export default function GetStartedPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [step, setStep] = useState(0)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [integrationId, setIntegrationId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [template, setTemplate] = useState<TemplateOption | null>(null)
  const [projectName, setProjectName] = useState('')
  const [onboardingData, setOnboardingData] = useState<OnboardingFormData | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{
    projectId: string
    liveUrl: string | null
    message: string
  } | null>(null)

  const oauthAvailable = isWebflowOAuthConfigured()
  const wizardRestored = useRef(false)

  useEffect(() => {
    const draft = loadWizardDraft(orgId)
    if (draft && !wizardRestored.current) {
      wizardRestored.current = true
      if (draft.step) setStep(draft.step)
      if (draft.projectName) setProjectName(draft.projectName)
      if (draft.integrationId) setIntegrationId(draft.integrationId)
      if (draft.collectionId) setCollectionId(draft.collectionId)
      if (draft.onboardingData) setOnboardingData(draft.onboardingData)
    }
  }, [orgId])

  useEffect(() => {
    if (step === 4) return
    saveWizardDraft(orgId, {
      step,
      projectName,
      templateId: template?.id,
      integrationId,
      collectionId,
      onboardingData: onboardingData ?? undefined,
    })
  }, [orgId, step, projectName, template, integrationId, collectionId, onboardingData])

  useEffect(() => {
    fetch(`/api/integrations/webflow?orgId=${orgId}`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then((r) => r.json())
      .then((d) => {
        const list = d.integrations ?? []
        setIntegrations(list)
        if (list[0]) {
          setIntegrationId(list[0].id)
          const cols = list[0].collections?.collections ?? []
          if (list[0].campaignsCollectionId) {
            setCollectionId(list[0].campaignsCollectionId)
          } else if (cols[0]) {
            setCollectionId(cols[0].id)
          }
        }
        if (list.length > 0) {
          const draft = loadWizardDraft(orgId)
          if (!draft) setStep(1)
        }
      })
  }, [orgId])

  const selectedIntegration = integrations.find((i) => i.id === integrationId)
  const collections = selectedIntegration?.collections?.collections ?? []

  const canNextStep0 = integrations.length > 0 && integrationId && collectionId
  const canNextStep1 = Boolean(template && projectName.trim())
  const canPersonalize = canNextStep0 && canNextStep1 && Boolean(onboardingData)

  const createAndPersonalize = async () => {
    if (!canPersonalize || !template || !onboardingData) return
    setPublishing(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({
          organizationId: orgId,
          name: projectName,
          description: onboardingData.businessDescription || projectName,
          category: 'project',
          contentType: 'landing_page',
          templateId: template.id,
          parameters: {
            name: projectName,
            headline: onboardingData.businessDescription?.split('.')[0] || projectName,
            subheadline: onboardingData.offer || template.description || '',
            body: onboardingData.businessDescription || projectName,
            ctaText: 'Get started',
            audience: onboardingData.targetAudience || '',
            offer: onboardingData.offer || '',
          },
          webflowIntegrationId: integrationId,
          cmsCollectionId: collectionId,
          showOnWebsite: true,
          publishSite: false,
          aiEnhance: true,
          onboarding: {
            websiteUrl: onboardingData.websiteUrl || undefined,
            businessDescription: onboardingData.businessDescription || undefined,
            primaryGoal: onboardingData.primaryGoal || undefined,
            targetAudience: onboardingData.targetAudience || undefined,
            offer: onboardingData.offer || undefined,
            tonePreset: onboardingData.tonePreset,
            ctaGoal: onboardingData.ctaGoal,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess({
        projectId: data.project.id,
        liveUrl: null,
        message: 'Your landing page has been personalized! Open the visual editor to refine and publish.',
      })
      clearWizardDraft(orgId)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personalization failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <DashboardShell
      orgId={orgId}
      title="Landing page wizard"
      description="Connect Webflow, pick a template, let AI personalize your page, then refine in the visual editor."
    >
      <SetupHealthChecklist orgId={orgId} compact />

      <div className="flex items-center gap-2 mb-8 max-w-2xl">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step || step === 4
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step || (step === 4 && i <= 3) ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:block truncate">{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border min-w-4" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-2xl">
          {error}
        </div>
      )}

      {step === 4 && success ? (
        <Card className="max-w-2xl border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-6" />
              Landing page personalized!
            </CardTitle>
            <CardDescription>{success.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Link href={`/dashboard/${orgId}/projects/${success.projectId}`}>
                <Button>Open visual editor</Button>
              </Link>
              <Link href={`/dashboard/${orgId}`}>
                <Button variant="outline">Back to dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : step === 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Step 1 — Connect Webflow</CardTitle>
            <CardDescription>Link your site so Automaio can publish automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.length === 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  No Webflow site connected yet. Use OAuth for the fastest setup.
                </p>
                {oauthAvailable ? (
                  <Button asChild>
                    <a href={`/api/integrations/webflow/oauth?orgId=${orgId}`}>Connect with Webflow</a>
                  </Button>
                ) : (
                  <Link href={`/dashboard/${orgId}/settings?tab=integrations`}>
                    <Button>Go to Integrations</Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Webflow site</Label>
                  <Select value={integrationId} onValueChange={setIntegrationId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {integrations.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.siteName ?? 'Webflow site'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CMS collection</Label>
                  <Select value={collectionId} onValueChange={setCollectionId}>
                    <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                    <SelectContent>
                      {collections.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!canNextStep0}>
                Next
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : step === 1 ? (
        <div className="max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Pick a landing page template</CardTitle>
              <CardDescription>Choose a design — AI will personalize it in the next step</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Spring Product Launch"
                />
              </div>
              <TemplatePicker
                selectedId={template?.id}
                onSelect={(t) => {
                  setTemplate(t)
                  if (!projectName) setProjectName(t.name)
                }}
                categoryFilter="landing"
              />
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!canNextStep1}>
              Next
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : step === 2 ? (
        <div className="max-w-3xl space-y-6">
          <LandingPageOnboarding
            orgId={orgId}
            compact
            storageKey={onboardingStorageKey(orgId)}
            onComplete={(data) => {
              setOnboardingData(data)
              setStep(3)
            }}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Step 4 — Personalize with AI</CardTitle>
            <CardDescription>
              AI will rewrite your landing page copy based on your business context while preserving the template design.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p><strong>Project:</strong> {projectName}</p>
              <p><strong>Template:</strong> {template?.name}</p>
              <p><strong>Site:</strong> {selectedIntegration?.siteName}</p>
              {onboardingData?.businessDescription && (
                <p><strong>Business:</strong> {onboardingData.businessDescription.slice(0, 120)}…</p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button onClick={createAndPersonalize} disabled={publishing || !canPersonalize}>
                {publishing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Personalizing…
                  </>
                ) : (
                  'Personalize landing page'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  )
}
