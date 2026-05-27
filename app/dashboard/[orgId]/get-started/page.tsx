'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
import { SetupHealthChecklist } from '@/components/dashboard/SetupHealthChecklist'
import { CheckCircle2, ArrowLeft, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import { isWebflowOAuthConfigured } from '@/lib/integrations/webflow-oauth'

const STEPS = ['Connect Webflow', 'Pick template', 'Publish live'] as const

type Integration = {
  id: string
  siteName: string | null
  campaignsCollectionId: string | null
  collections?: { collections: Array<{ id: string; name: string }> }
}

export default function GetStartedPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [step, setStep] = useState(0)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [integrationId, setIntegrationId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [template, setTemplate] = useState<TemplateOption | null>(null)
  const [projectName, setProjectName] = useState('')
  const [headline, setHeadline] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{
    projectId: string
    liveUrl: string | null
    message: string
  } | null>(null)

  const oauthAvailable = isWebflowOAuthConfigured()

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
        if (list.length > 0) setStep(1)
      })
  }, [orgId])

  const selectedIntegration = integrations.find((i) => i.id === integrationId)
  const collections = selectedIntegration?.collections?.collections ?? []

  const canNextStep0 = integrations.length > 0 && integrationId && collectionId
  const canNextStep1 = Boolean(template && projectName.trim())
  const canPublish = canNextStep0 && canNextStep1

  const publish = async () => {
    if (!canPublish || !template) return
    setPublishing(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({
          organizationId: orgId,
          name: projectName,
          description: headline || projectName,
          category: 'blog',
          contentType: 'blog_post',
          templateId: template.id,
          parameters: {
            name: projectName,
            headline: headline || projectName,
            subheadline: template.description ?? '',
            body: headline || projectName,
            ctaText: 'Learn more',
          },
          webflowIntegrationId: integrationId,
          cmsCollectionId: collectionId,
          showOnWebsite: true,
          publishSite: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const pubRes = await fetch(`/api/projects/${data.project.id}?action=publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ publishSite: true }),
      })
      const pubData = await pubRes.json()
      if (!pubRes.ok) throw new Error(pubData.error ?? 'Publish failed')

      setSuccess({
        projectId: data.project.id,
        liveUrl: pubData.liveUrl ?? null,
        message: pubData.embedMessage ?? 'Your content is live on Webflow!',
      })
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <DashboardShell
      orgId={orgId}
      title="First publish wizard"
      description="Connect Webflow, pick a template, and go live in under 5 minutes."
    >
      <SetupHealthChecklist orgId={orgId} compact />

      <div className="flex items-center gap-2 mb-8 max-w-2xl">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step || step === 3
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step || (step === 3 && i <= 2) ? <CheckCircle2 className="size-4" /> : i + 1}
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

      {step === 3 && success ? (
        <Card className="max-w-2xl border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-6" />
              You&apos;re live!
            </CardTitle>
            <CardDescription>{success.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success.liveUrl && (
              <a
                href={success.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary underline"
              >
                View on your Webflow site
                <ExternalLink className="size-3.5" />
              </a>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href={`/dashboard/${orgId}/projects/${success.projectId}`}>
                <Button>Manage project</Button>
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
              <CardTitle>Step 2 — Pick a template</CardTitle>
              <CardDescription>Choose a design — you can customize copy before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project name</Label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Spring Product Launch"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Your main headline"
                  />
                </div>
              </div>
              <TemplatePicker
                selectedId={template?.id}
                onSelect={(t) => {
                  setTemplate(t)
                  if (!projectName) setProjectName(t.name)
                  if (!headline) setHeadline(t.name)
                }}
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
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Step 3 — Publish live</CardTitle>
            <CardDescription>
              Automaio will save to CMS, install the embed, and publish your Webflow site automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <p><strong>Project:</strong> {projectName}</p>
              <p><strong>Template:</strong> {template?.name}</p>
              <p><strong>Site:</strong> {selectedIntegration?.siteName}</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button onClick={publish} disabled={publishing || !canPublish}>
                {publishing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  'Publish to Webflow'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  )
}
