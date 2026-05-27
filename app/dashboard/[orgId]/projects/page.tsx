'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Globe, Clock, FolderKanban, Pencil } from 'lucide-react'

type Project = {
  id: string
  name: string
  category: string
  contentType: string
  status: string
  showOnWebsite: boolean
  scheduledFor: string | null
  webflowCmsItemId: string | null
  template?: { name: string } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  project: 'bg-violet-500/10 text-violet-700',
  blog: 'bg-blue-500/10 text-blue-700',
  cms: 'bg-emerald-500/10 text-emerald-700',
  custom: 'bg-amber-500/10 text-amber-700',
}

export default function ProjectsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = filter === 'all' ? '' : `&category=${filter}`
    fetch(`/api/projects?orgId=${orgId}${q}`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false))
  }, [orgId, filter])

  return (
    <DashboardShell
      orgId={orgId}
      title="Projects & CMS"
      description="Create blog posts, CMS entries, and custom content — schedule or publish to Webflow."
      actions={
        <Link href={`/dashboard/${orgId}/projects/new`}>
          <Button>
            <Plus className="size-4 mr-2" />
            New project
          </Button>
        </Link>
      }
    >
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'project', 'blog', 'cms', 'custom'].map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={filter === cat ? 'default' : 'outline'}
            onClick={() => setFilter(cat)}
            className="capitalize"
          >
            {cat === 'all' ? 'All' : cat}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading projects…</p>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderKanban className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Publish your first template to Webflow in under 5 minutes — no code required.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={`/dashboard/${orgId}/get-started`}>
                <Button>Quick start wizard</Button>
              </Link>
              <Link href={`/dashboard/${orgId}/templates`}>
                <Button variant="outline">Browse templates</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="h-full hover:border-primary/50 hover:shadow-md transition-all">
              <Link href={`/dashboard/${orgId}/projects/${project.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[project.category] ?? 'bg-muted'}`}
                    >
                      {project.category}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {project.contentType.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.template?.name && (
                    <p className="text-xs text-muted-foreground">Template: {project.template.name}</p>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {project.showOnWebsite && (
                      <span className="flex items-center gap-1">
                        <Globe className="size-3" /> On website
                      </span>
                    )}
                    {project.scheduledFor && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(project.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Link>
              <CardContent className="pt-0">
                <Link href={`/dashboard/${orgId}/projects/${project.id}`}>
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Pencil className="size-3.5" /> Edit project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
