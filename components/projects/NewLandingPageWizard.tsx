'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TemplatePicker, type TemplateOption } from '@/components/campaigns/TemplatePicker'
import { LandingPageOnboarding, type OnboardingFormData } from '@/components/projects/LandingPageOnboarding'
import { CreateLandingCollectionCard } from '@/components/webflow/CreateLandingCollectionCard'
import { getDefaultCollectionForContentType } from '@/lib/webflow/collection-defaults'
import {
  getCollectionRoleLabel,
  type CollectionCapabilities,
} from '@/lib/webflow/collection-detect'
import { onboardingStorageKey, loadLandingWizardDraft, saveLandingWizardDraft, clearLandingWizardDraft, clearOnboardingDraft } from '@/lib/onboarding/persistence'
import { countHtmlLines } from '@/lib/content/rendering-strategy'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layout,
  Globe,
  Zap,
  RefreshCw,
} from 'lucide-react'

const STEPS = ['Template', 'Business AI', 'Webflow', 'Create'] as const

type Integration = {
  id: string
  siteName: string | null
  campaignsCollectionId: string | null
  templatesCollectionId: string | null
  collections?: {
    collections?: Array<{
      id: string
      name: string
      fields?: Array<{ slug: string; name: string; type: string }>
    }>
  }
}

type NewLandingPageWizardProps = {
  orgId: string
  initialTemplateId?: string | null
  initialName?: string | null
}

export function NewLandingPageWizard({
  orgId,
  initialTemplateId,
  initialName,
}: NewLandingPageWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(initialTemplateId ? 1 : 0)
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId ?? null)
  const [startBlank, setStartBlank] = useState(false)
  const [templateName, setTemplateName] = useState(initialName ?? '')
  const [projectName, setProjectName] = useState(initialName ?? '')
  const [onboardingData, setOnboardingData] = useState<OnboardingFormData | null>(null)
  const [onboardingSkipped, setOnboardingSkipped] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [integrationId, setIntegrationId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [embedAccess, setEmbedAccess] = useState(false)
  const [collectionCaps, setCollectionCaps] = useState<CollectionCapabilities | null>(null)
  const [detectLoading, setDetectLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [templateLineCount, setTemplateLineCount] = useState(0)
  const draftRestored = useRef(false)

  const refreshIntegrations = useCallback(async () => {
    setCollectionsLoading(true)
    try {
      const res = await fetch(`/api/integrations/webflow?orgId=${orgId}&refresh=1`, {
        credentials: 'same-origin',
      })
      const d = await res.json()
      const list = d.integrations ?? []
      setIntegrations(list)
      return list as Integration[]
    } finally {
      setCollectionsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (draftRestored.current) return
    draftRestored.current = true
    const draft = loadLandingWizardDraft(orgId)
    if (draft) {
      if (draft.step !== undefined) setStep(draft.step)
      if (draft.templateId) setTemplateId(draft.templateId)
      if (draft.templateName) setTemplateName(draft.templateName)
      if (draft.projectName) setProjectName(draft.projectName)
      if (draft.integrationId) setIntegrationId(draft.integrationId)
      if (draft.collectionId) setCollectionId(draft.collectionId)
      if (draft.onboardingData) setOnboardingData(draft.onboardingData)
      if (draft.onboardingSkipped) setOnboardingSkipped(true)
    }
  }, [orgId])

  useEffect(() => {
    saveLandingWizardDraft(orgId, {
      step,
      projectName,
      templateId,
      templateName,
      integrationId,
      collectionId,
      onboardingData: onboardingData ?? undefined,
      onboardingSkipped,
    })
  }, [orgId, step, projectName, templateId, templateName, integrationId, collectionId, onboardingData, onboardingSkipped])

  useEffect(() => {
    refreshIntegrations().then((list) => {
      if (list[0] && !integrationId) {
        setIntegrationId(list[0].id)
        const pagesCol = getDefaultCollectionForContentType(list[0], 'landing_page')
        if (pagesCol && !collectionId) setCollectionId(pagesCol)
        fetch(`/api/integrations/webflow/${list[0].id}/embed-status`, { credentials: 'same-origin' })
          .then((r) => r.json())
          .then((status) => setEmbedAccess(Boolean(status.customCodeAccess)))
          .catch(() => {})
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, refreshIntegrations])

  useEffect(() => {
    if (!templateId) {
      setTemplateLineCount(0)
      return
    }
    fetch(`/api/templates/${templateId}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        const structure = d.template?.templateStructure
        const html = typeof structure === 'string' ? structure : JSON.stringify(structure ?? '')
        setTemplateLineCount(countHtmlLines(html))
      })
      .catch(() => setTemplateLineCount(200))
  }, [templateId])

  const selectedIntegration = integrations.find((i) => i.id === integrationId)
  const collections = selectedIntegration?.collections?.collections ?? []

  useEffect(() => {
    if (!integrationId || !collectionId) {
      setCollectionCaps(null)
      return
    }
    setDetectLoading(true)
    fetch(
      `/api/integrations/webflow/${integrationId}/collection-detect?collectionId=${collectionId}&htmlLines=${templateLineCount || 200}`,
      { credentials: 'same-origin' },
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.capabilities) setCollectionCaps(d.capabilities)
        if (d.customCodeAccess !== undefined) setEmbedAccess(Boolean(d.customCodeAccess))
      })
      .catch(() => setCollectionCaps(null))
      .finally(() => setDetectLoading(false))
  }, [integrationId, collectionId, templateLineCount])

  const canStep0 = Boolean(projectName.trim()) && (Boolean(templateId) || startBlank)
  const canStep2 = Boolean(integrationId && collectionId)
  const canCreate = canStep0 && canStep2 && (Boolean(onboardingData) || onboardingSkipped)

  const handleCreate = async () => {
    if (!canCreate || (!templateId && !startBlank)) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          name: projectName,
          description: onboardingData?.businessDescription || projectName,
          category: 'project',
          contentType: 'landing_page',
          templateId: startBlank ? null : templateId,
          parameters: {
            name: projectName,
            headline: onboardingData?.businessDescription?.split('.')[0] || projectName,
            subheadline: onboardingData?.offer || '',
            body: onboardingData?.businessDescription || '',
            ctaText: 'Get started',
            audience: onboardingData?.targetAudience || '',
            offer: onboardingData?.offer || '',
          },
          webflowIntegrationId: integrationId,
          cmsCollectionId: collectionId,
          showOnWebsite: true,
          publishSite: false,
          aiEnhance: Boolean(onboardingData),
          onboarding: onboardingData
            ? {
                websiteUrl: onboardingData.websiteUrl || undefined,
                businessDescription: onboardingData.businessDescription || undefined,
                primaryGoal: onboardingData.primaryGoal || undefined,
                targetAudience: onboardingData.targetAudience || undefined,
                offer: onboardingData.offer || undefined,
                tonePreset: onboardingData.tonePreset,
                ctaGoal: onboardingData.ctaGoal,
              }
            : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      clearLandingWizardDraft(orgId)
      clearOnboardingDraft(onboardingStorageKey(orgId))
      router.push(`/dashboard/${orgId}/projects/${data.project.id}?onboarded=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create landing page')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-medium flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI landing page builder
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Select template → tell AI about your business → open visual studio → publish to Webflow.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:block truncate">{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border min-w-4" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="size-5" />
              Step 1 — Choose a landing page template
            </CardTitle>
            <CardDescription>
              Pick a design or start with a blank canvas. AI can personalize copy after you add blocks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-violet-500/40 bg-violet-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Start with a blank page</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Skip templates — open the studio empty and drag blocks from the library.
                </p>
              </div>
              <Button
                type="button"
                variant={startBlank ? 'default' : 'outline'}
                className={startBlank ? 'bg-violet-600 hover:bg-violet-700' : ''}
                onClick={() => {
                  setStartBlank(true)
                  setTemplateId(null)
                  setTemplateName('Blank page')
                }}
              >
                Blank canvas
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Landing page name</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Spring Product Launch"
                required
              />
            </div>
            {!startBlank && (
            <TemplatePicker
              selectedId={templateId ?? undefined}
              categoryFilter="landing"
              onSelect={(t: TemplateOption) => {
                setStartBlank(false)
                setTemplateId(t.id)
                setTemplateName(t.name)
                if (!projectName) setProjectName(t.name)
              }}
            />
            )}
            {startBlank && (
              <p className="text-xs text-violet-300/90 rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                Blank page selected — you will choose starter blocks inside the visual studio.
              </p>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/${orgId}/projects`}>Cancel</Link>
              </Button>
              <Button onClick={() => setStep(1)} disabled={!canStep0}>
                Next — Business AI
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <LandingPageOnboarding
            orgId={orgId}
            storageKey={onboardingStorageKey(orgId)}
            onComplete={(data) => {
              setOnboardingData(data)
              if (data.businessDescription && !projectName) {
                setProjectName(data.businessDescription.split(/[.,]/)[0]?.slice(0, 60) || projectName)
              }
              setStep(2)
            }}
            onSkip={() => {
              setOnboardingSkipped(true)
              setStep(2)
            }}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              Step 3 — Webflow destination
            </CardTitle>
            <CardDescription>
              Landing pages publish to your <strong>Pages</strong> collection (not Blog).
              Automaio auto-detects fields and chooses iframe vs CMS HTML rendering.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.length === 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-3">
                <p>Connect Webflow first to publish landing pages.</p>
                <Button asChild>
                  <Link href={`/dashboard/${orgId}/settings?tab=integrations`}>Connect Webflow</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Webflow site</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => refreshIntegrations()}
                      disabled={collectionsLoading}
                    >
                      <RefreshCw className={`h-3 w-3 ${collectionsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  <Select value={integrationId} onValueChange={setIntegrationId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {integrations.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.siteName ?? i.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {integrationId && (
                  <CreateLandingCollectionCard
                    orgId={orgId}
                    integrationId={integrationId}
                    deliveryMode="remote_runtime"
                    onCreated={async (collection) => {
                      setCollectionId(collection.id)
                      await refreshIntegrations()
                    }}
                    compact
                  />
                )}

                <div className="space-y-2">
                  <Label>Landing pages CMS collection</Label>
                  {collections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No collections found. Create one below or in Webflow, then Refresh.
                    </p>
                  ) : (
                  <Select value={collectionId} onValueChange={setCollectionId}>
                    <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                    <SelectContent>
                      {collections.map((c) => {
                        const role = selectedIntegration
                          ? getCollectionRoleLabel(c.id, selectedIntegration)
                          : null
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {role ? ` · ${role}` : ''}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Blog collections are for articles only. Use a Pages / Landing Pages collection for HTML templates.
                  </p>
                </div>

                {detectLoading && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-3 animate-spin" />
                    Detecting collection fields…
                  </p>
                )}

                {collectionCaps && !detectLoading && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-xs">
                    <p className="font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Zap className="size-3.5" />
                      Auto-detected publish setup
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <DetectRow
                        label="Render mode"
                        value={
                          collectionCaps.renderMode === 'iframe_embed'
                            ? 'Iframe embed (iframe-url field)'
                            : collectionCaps.renderMode === 'split_plain_text'
                              ? 'Split HTML (html, css, js fields)'
                              : collectionCaps.renderMode === 'remote_runtime'
                                ? 'Remote runtime (Page ID + API)'
                                : 'Auto from collection fields'
                        }
                      />
                      <DetectRow
                        label="OAuth embed"
                        value={collectionCaps.embedAutoSetupPossible ? 'Auto-setup available' : 'Manual template paste'}
                      />
                      <DetectRow label="Body field" value={collectionCaps.hasRichTextBody ? 'Rich Text ✓' : collectionCaps.hasPlainTextBody ? 'Plain Text ✓' : 'Not detected'} />
                      <DetectRow label="CMS body field" value={collectionCaps.hasRichTextBody ? 'Rich Text ✓' : 'Required'} />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {collectionCaps.renderReason} Publish maps content to the active delivery mode fields (runtime, split html/css/js, or iframe-url).
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canStep2}>
                Next — Review
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4 — Create & personalize</CardTitle>
            <CardDescription>
              AI will rewrite your template copy, then open the visual studio for refinements before you publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p><strong>Page:</strong> {projectName}</p>
              <p><strong>Template:</strong> {templateName || templateId}</p>
              <p><strong>Business:</strong> {onboardingData?.businessDescription?.slice(0, 120) ?? '—'}…</p>
              <p><strong>Site:</strong> {selectedIntegration?.siteName}</p>
              <p><strong>Collection:</strong> {collections.find((c) => c.id === collectionId)?.name}</p>
              {collectionCaps && (
                <Badge variant="outline" className="text-[10px]">
                  {collectionCaps.renderMode === 'iframe_embed'
                    ? 'Iframe URL field'
                    : collectionCaps.renderMode === 'split_plain_text'
                      ? 'Split html / css / js'
                      : collectionCaps.renderMode === 'remote_runtime'
                        ? 'Remote runtime'
                        : 'Delivery auto'}
                </Badge>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button onClick={handleCreate} disabled={loading || !canCreate} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Personalizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Create & open studio
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Need a blog post instead?{' '}
        <Link href={`/dashboard/${orgId}/projects/new?type=blog_post`} className="underline">
          Create blog post
        </Link>
      </p>
    </div>
  )
}

function DetectRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border rounded-md px-2 py-1.5 bg-background">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
