'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { LandingPageOnboarding, type OnboardingFormData } from '@/components/projects/LandingPageOnboarding'
import { getCollectionRoleLabel } from '@/lib/webflow/collection-detect'
import { onboardingStorageKey } from '@/lib/onboarding/persistence'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react'

const STEPS = ['Content', 'Business AI', 'Webflow', 'Create'] as const

type Integration = {
  id: string
  siteName: string | null
  campaignsCollectionId: string | null
  templatesCollectionId: string | null
  collections?: { collections: Array<{ id: string; name: string }> }
}

export function NewBlogPostForm({ orgId }: { orgId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [onboardingData, setOnboardingData] = useState<OnboardingFormData | null>(null)
  const [onboardingSkipped, setOnboardingSkipped] = useState(false)
  const [integrationId, setIntegrationId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(true)
  const [publishSite, setPublishSite] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    refreshIntegrations().then((list) => {
      if (list[0]) {
        setIntegrationId(list[0].id)
        if (list[0].campaignsCollectionId) setCollectionId(list[0].campaignsCollectionId)
      }
    })
  }, [refreshIntegrations])

  const selectedIntegration = integrations.find((i) => i.id === integrationId)
  const collections = selectedIntegration?.collections?.collections ?? []

  const canStep0 = Boolean(name.trim() && body.trim())
  const canStep2 = Boolean(integrationId && collectionId)
  const canCreate = canStep0 && canStep2

  const handleCreate = async () => {
    if (!canCreate) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          name,
          description: body.slice(0, 200),
          category: 'blog',
          contentType: 'blog_post',
          parameters: { name, headline: name, body },
          webflowIntegrationId: integrationId || null,
          cmsCollectionId: collectionId || null,
          showOnWebsite,
          publishSite,
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
      router.push(`/dashboard/${orgId}/projects/${data.project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blog post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-medium flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI blog post builder
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Write content → optional AI business context → pick Webflow blog collection → edit in rich text studio.
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
            <CardTitle>Step 1 — Article content</CardTitle>
            <CardDescription>Title and body. AI can enhance this after onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Article body</Label>
              <RichTextEditor value={body} onChange={setBody} placeholder="Write your blog post…" />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/${orgId}/projects`}>Cancel</Link>
              </Button>
              <Button onClick={() => setStep(1)} disabled={!canStep0}>
                Next — Business AI <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <LandingPageOnboarding
            orgId={orgId}
            storageKey={`${onboardingStorageKey(orgId)}:blog`}
            onComplete={(data) => {
              setOnboardingData(data)
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
            <CardTitle>Step 3 — Webflow blog collection</CardTitle>
            <CardDescription>
              Collections are fetched live from your connected Webflow site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.length === 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-3">
                <p>Connect Webflow first.</p>
                <Button asChild>
                  <Link href={`/dashboard/${orgId}/settings?tab=integrations`}>Connect Webflow</Link>
                </Button>
              </div>
            ) : (
              <>
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
                    Refresh collections
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

                <div className="space-y-2">
                  <Label>Blog CMS collection</Label>
                  {collections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No collections found. Create one in Webflow, then click Refresh.
                    </p>
                  ) : (
                    <Select value={collectionId} onValueChange={setCollectionId}>
                      <SelectTrigger><SelectValue placeholder="Select blog collection" /></SelectTrigger>
                      <SelectContent>
                        {collections.map((c) => {
                          const role = selectedIntegration
                            ? getCollectionRoleLabel(c.id, selectedIntegration)
                            : null
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}{role ? ` · ${role}` : ''}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} id="show-web" />
                  <Label htmlFor="show-web">Publish as live CMS item</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={publishSite} onCheckedChange={setPublishSite} id="publish-site" />
                  <Label htmlFor="publish-site">Publish Webflow site after first publish</Label>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canStep2}>
                Next — Create <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4 — Create blog post</CardTitle>
            <CardDescription>
              {onboardingData
                ? 'AI will enhance your article using business context, then open the rich text studio.'
                : onboardingSkipped
                  ? 'Opens rich text studio for editing and publishing.'
                  : 'Review and create.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-1 text-sm">
              <p><strong>Title:</strong> {name}</p>
              <p><strong>Site:</strong> {selectedIntegration?.siteName}</p>
              <p><strong>Collection:</strong> {collections.find((c) => c.id === collectionId)?.name}</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button onClick={handleCreate} disabled={loading || !canCreate} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {onboardingData ? 'Enhancing with AI…' : 'Creating…'}
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
        Need a landing page instead?{' '}
        <Link href={`/dashboard/${orgId}/projects/new`} className="underline">
          Create landing page
        </Link>
      </p>
    </div>
  )
}
