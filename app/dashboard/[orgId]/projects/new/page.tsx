'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TemplatePicker } from '@/components/campaigns/TemplatePicker'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { LandingPageOnboarding, type OnboardingFormData } from '@/components/projects/LandingPageOnboarding'
import { getDefaultCollectionForContentType } from '@/lib/webflow/collection-defaults'
import { onboardingStorageKey } from '@/lib/onboarding/persistence'

type Integration = {
  id: string
  siteName: string | null
  campaignsCollectionId: string | null
  templatesCollectionId: string | null
  collections?: { collections: Array<{ id: string; name: string }> }
}

export default function NewProjectPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('project')
  const [contentType, setContentType] = useState('cms_entry')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [integrationId, setIntegrationId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(true)
  const [publishSite, setPublishSite] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [frequency, setFrequency] = useState('once')
  const [aiEnhance, setAiEnhance] = useState(true)
  const [onboardingData, setOnboardingData] = useState<OnboardingFormData | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const prefillName = searchParams.get('name')
    const prefillTemplate = searchParams.get('templateId')
    if (prefillName) setName(prefillName)
    if (prefillTemplate) setTemplateId(prefillTemplate)
  }, [searchParams])

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
          const defaultCol = getDefaultCollectionForContentType(list[0], contentType)
          if (defaultCol) setCollectionId(defaultCol)
          else {
            const cols = list[0].collections?.collections ?? []
            if (cols[0]) setCollectionId(cols[0].id)
          }
        }
      })
  }, [orgId])

  const isBlogPost = contentType === 'blog_post'
  const isLandingPage = contentType === 'landing_page'

  const handleContentTypeChange = (value: string) => {
    setContentType(value)
    if (value === 'blog_post') setTemplateId(null)
    if (value === 'landing_page') {
      setAiEnhance(true)
      setShowOnboarding(true)
    }
    const integration = integrations.find((i) => i.id === integrationId)
    if (integration) {
      const defaultCol = getDefaultCollectionForContentType(integration, value)
      if (defaultCol) setCollectionId(defaultCol)
    }
  }
  const selectedIntegration = integrations.find((i) => i.id === integrationId)
  const collections = selectedIntegration?.collections?.collections ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          organizationId: orgId,
          name,
          description,
          category,
          contentType,
          templateId: isBlogPost ? null : templateId,
          parameters: {
            headline: onboardingData?.businessDescription?.split('.')[0] || headline || name,
            body: onboardingData?.businessDescription || body,
            name,
            subheadline: description || onboardingData?.offer || body,
            ctaText: 'Get started',
            audience: onboardingData?.targetAudience || '',
            offer: onboardingData?.offer || '',
          },
          webflowIntegrationId: integrationId || null,
          cmsCollectionId: collectionId || null,
          showOnWebsite,
          publishSite,
          aiEnhance: isLandingPage ? (aiEnhance || Boolean(onboardingData)) : aiEnhance,
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

      const projectId = data.project.id

      if (scheduleMode === 'now') {
        const pubRes = await fetch(`/api/projects/${projectId}?action=publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
          body: JSON.stringify({ publishSite }),
        })
        const pubData = await pubRes.json()
        if (!pubRes.ok) {
          throw new Error(pubData.error ?? 'Created project but publish to Webflow failed')
        }
        if (pubData.liveUrl) {
          router.push(
            `/dashboard/${orgId}/projects/${projectId}?published=1&liveUrl=${encodeURIComponent(pubData.liveUrl)}`,
          )
          return
        }
      } else if (scheduledAt) {
        await fetch(`/api/projects/${projectId}?action=schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
          body: JSON.stringify({
            scheduledFor: new Date(scheduledAt).toISOString(),
            frequency,
            publishSite,
          }),
        })
      }

      router.push(`/dashboard/${orgId}/projects/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardShell
      orgId={orgId}
      title="New project"
      description="Choose a category, optional template, and schedule when to publish to Webflow."
    >
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basics</CardTitle>
            <CardDescription>Name and categorize your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Q2 Product Launch Blog" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="cms">CMS</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content type</Label>
                <Select value={contentType} onValueChange={handleContentTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_post">Blog post — write rich text content</SelectItem>
                    <SelectItem value="landing_page">Page — HTML template on Webflow</SelectItem>
                    <SelectItem value="cms_entry">CMS entry</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isBlogPost
                    ? 'Blog posts use a rich text editor. Content goes to CMS — no HTML template.'
                    : isLandingPage
                      ? 'Pages use an HTML template embedded on your Webflow collection page via iframe.'
                      : 'Choose how this content is published to Webflow.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isBlogPost ? 'Blog content' : isLandingPage ? 'HTML page template' : 'Content'}
            </CardTitle>
            <CardDescription>
              {isBlogPost
                ? 'Write your article with formatting — bold, lists, links.'
                : isLandingPage
                  ? 'Pick an HTML template. It loads on your Webflow page — not stored in CMS fields.'
                  : 'Pick a template or enter content manually'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLandingPage && showOnboarding && (
              <LandingPageOnboarding
                orgId={orgId}
                storageKey={onboardingStorageKey(orgId)}
                onComplete={(data) => {
                  setOnboardingData(data)
                  setAiEnhance(true)
                  setShowOnboarding(false)
                  if (data.businessDescription && !name) {
                    setName(data.businessDescription.split(/[.,]/)[0]?.slice(0, 60) || name)
                  }
                }}
                onSkip={() => setShowOnboarding(false)}
              />
            )}
            {isLandingPage && !showOnboarding && onboardingData && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
                AI onboarding complete — your template will be personalized automatically.
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 ml-2"
                  onClick={() => setShowOnboarding(true)}
                >
                  Edit answers
                </Button>
              </div>
            )}
            {isLandingPage && (
              <TemplatePicker
                selectedId={templateId ?? undefined}
                onSelect={(t) => setTemplateId(t.id)}
                categoryFilter="landing"
              />
            )}
            {!isBlogPost && (
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Main headline" />
              </div>
            )}
            {isBlogPost ? (
              <div className="space-y-2">
                <Label>Article body</Label>
                <RichTextEditor value={body} onChange={setBody} placeholder="Write your blog post…" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Body content</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write or paste content…" />
              </div>
            )}
            {isLandingPage && (
              <div className="flex items-center gap-3">
                <Switch checked={aiEnhance} onCheckedChange={setAiEnhance} id="ai-enhance" />
                <Label htmlFor="ai-enhance">
                  AI personalize landing page from onboarding answers
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webflow destination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Connect Webflow in{' '}
                <a href={`/dashboard/${orgId}/settings?tab=integrations`} className="text-primary underline">
                  Settings
                </a>
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Webflow site</Label>
                  <Select value={integrationId} onValueChange={setIntegrationId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {integrations.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.siteName ?? i.id}</SelectItem>
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
                  <p className="text-[11px] text-muted-foreground">
                    {isBlogPost
                      ? 'Blog posts → use your Blog collection (Settings → Integrations).'
                      : isLandingPage
                        ? 'HTML pages → use your Pages collection, not Blog. Configure both in Settings → Integrations.'
                        : 'Pick the Webflow collection this item should live in.'}
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} id="show-web" />
              <Label htmlFor="show-web">Show on website (publish as live CMS item)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={publishSite} onCheckedChange={setPublishSite} id="publish-site" />
              <Label htmlFor="publish-site">Trigger full site publish after CMS update</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={scheduleMode === 'now' ? 'default' : 'outline'} onClick={() => setScheduleMode('now')}>
                Publish now
              </Button>
              <Button type="button" variant={scheduleMode === 'later' ? 'default' : 'outline'} onClick={() => setScheduleMode('later')}>
                Schedule for later
              </Button>
            </div>
            {scheduleMode === 'later' && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setFrequency('weekly')}>
                    Weekly blog
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFrequency('daily')}>
                    Daily updates
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFrequency('once')}>
                    One-time
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Date & time</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
                </div>
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
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : scheduleMode === 'now' ? 'Create & publish' : 'Create & schedule'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardShell>
  )
}
