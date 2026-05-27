'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { TemplatePicker, type TemplateOption } from '@/components/campaigns/TemplatePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus } from 'lucide-react'

const INDUSTRIES = ['All', 'SaaS', 'E-commerce', 'Agency', 'Local', 'Healthcare']

export default function TemplatesGalleryPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All')

  const handleUseTemplate = (template: TemplateOption) => {
    const qs = new URLSearchParams({ templateId: template.id, name: template.name })
    router.push(`/dashboard/${orgId}/projects/new?${qs.toString()}`)
  }

  return (
    <DashboardShell
      orgId={orgId}
      title="Template gallery"
      description="Browse prebuilt designs. Pick one and publish to Webflow in minutes."
      actions={
        <Link href={`/dashboard/${orgId}/projects/new`}>
          <Button variant="outline">
            <Plus className="size-4 mr-2" />
            Blank project
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <Badge
              key={ind}
              variant={industry === ind ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setIndustry(ind)}
            >
              {ind}
            </Badge>
          ))}
        </div>
      </div>

      <TemplatePicker
        mode="gallery"
        search={search}
        industryFilter={industry === 'All' ? undefined : industry}
        onUseTemplate={handleUseTemplate}
      />
    </DashboardShell>
  )
}
