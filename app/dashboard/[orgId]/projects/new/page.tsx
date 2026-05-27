'use client'

import { useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { NewLandingPageWizard } from '@/components/projects/NewLandingPageWizard'
import { NewBlogPostForm } from '@/components/projects/NewBlogPostForm'

export default function NewProjectPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string

  const type = searchParams.get('type') ?? 'landing_page'
  const templateId = searchParams.get('templateId')
  const prefillName = searchParams.get('name')
  const isBlog = type === 'blog_post'

  return (
    <DashboardShell
      orgId={orgId}
      title={isBlog ? 'New blog post' : 'New landing page'}
      description={
        isBlog
          ? 'Write rich text content and publish to your Webflow blog collection.'
          : 'AI-powered landing page — template, business onboarding, visual studio, then publish.'
      }
      actions={
        !isBlog ? (
          <Link
            href={`/dashboard/${orgId}/projects/new?type=blog_post`}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Switch to blog post
          </Link>
        ) : (
          <Link
            href={`/dashboard/${orgId}/projects/new`}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Switch to landing page
          </Link>
        )
      }
    >
      {isBlog ? (
        <NewBlogPostForm orgId={orgId} />
      ) : (
        <NewLandingPageWizard
          orgId={orgId}
          initialTemplateId={templateId}
          initialName={prefillName}
        />
      )}
    </DashboardShell>
  )
}
