'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { getDefaultCollectionForContentType } from '@/lib/webflow/collection-defaults'
import { getCollectionRoleLabel } from '@/lib/webflow/collection-detect'

type Integration = {
  id: string
  siteName: string | null
  campaignsCollectionId: string | null
  templatesCollectionId: string | null
  collections?: { collections: Array<{ id: string; name: string }> }
}

export function NewBlogPostForm({ orgId }: { orgId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [integrationId, setIntegrationId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [showOnWebsite, setShowOnWebsite] = useState(true)
  const [publishSite, setPublishSite] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/integrations/webflow?orgId=${orgId}`, {
      
    })
      .then((r) => r.json())
      .then((d) => {
        const list = d.integrations ?? []
        setIntegrations(list)
        if (list[0]) {
          setIntegrationId(list[0].id)
          const blogCol = getDefaultCollectionForContentType(list[0], 'blog_post')
          if (blogCol) setCollectionId(blogCol)
        }
      })
  }, [orgId])

  const selectedIntegration = integrations.find((i) => i.id === integrationId)
  const collections = selectedIntegration?.collections?.collections ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Blog post</CardTitle>
          <CardDescription>Rich text content published to your Webflow blog collection.</CardDescription>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webflow destination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Link href={`/dashboard/${orgId}/settings?tab=integrations`} className="underline">
                Connect Webflow
              </Link>{' '}
              first.
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
                <Label>Blog CMS collection</Label>
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
              </div>
            </>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} id="show-web" />
            <Label htmlFor="show-web">Publish as live CMS item</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={publishSite} onCheckedChange={setPublishSite} id="publish-site" />
            <Label htmlFor="publish-site">Publish Webflow site after save</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create blog post'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/dashboard/${orgId}/projects`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
