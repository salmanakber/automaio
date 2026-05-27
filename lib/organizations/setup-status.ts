import { prisma } from '@/lib/prisma'

export type SetupStep = {
  id: string
  label: string
  description: string
  done: boolean
  href?: string
  actionLabel?: string
}

export type OrgSetupStatus = {
  steps: SetupStep[]
  completedCount: number
  totalCount: number
  percentComplete: number
  isFullySetup: boolean
  webflowConnected: boolean
  hasPublishedProject: boolean
}

export async function getOrgSetupStatus(orgId: string): Promise<OrgSetupStatus> {
  const [integration, projectCount, publishedCount] = await Promise.all([
    prisma.webflowIntegration.findFirst({ where: { organizationId: orgId } }),
    prisma.contentProject.count({ where: { organizationId: orgId } }),
    prisma.contentProject.count({
      where: { organizationId: orgId, status: 'published', webflowCmsItemId: { not: null } },
    }),
  ])

  const collectionsJson = integration?.collections as {
    automaioEmbed?: { scriptId?: string; configuredAt?: string }
    automaioRuntime?: { scriptId?: string; configuredAt?: string }
    collections?: Array<{ id: string }>
  } | null

  const webflowConnected = Boolean(integration?.webflowApiKey)
  const collectionConfigured = Boolean(integration?.campaignsCollectionId)
  const runtimeConfigured = Boolean(collectionsJson?.automaioRuntime?.scriptId)
  const legacyEmbedConfigured = Boolean(collectionsJson?.automaioEmbed?.scriptId)
  const embedConfigured = runtimeConfigured || legacyEmbedConfigured
  const hasPublishedProject = publishedCount > 0
  const hasAnyProject = projectCount > 0

  const steps: SetupStep[] = [
    {
      id: 'connect',
      label: 'Connect Webflow',
      description: 'Link your Webflow site via OAuth',
      done: webflowConnected,
      href: `/dashboard/${orgId}/settings?tab=integrations`,
      actionLabel: 'Connect',
    },
    {
      id: 'collection',
      label: 'Choose CMS collection',
      description: 'Pick where content will be published',
      done: collectionConfigured,
      href: `/dashboard/${orgId}/settings?tab=integrations`,
      actionLabel: 'Configure',
    },
    {
      id: 'template',
      label: 'Pick a template',
      description: 'Browse prebuilt designs for your content',
      done: hasAnyProject,
      href: `/dashboard/${orgId}/templates`,
      actionLabel: 'Browse templates',
    },
    {
      id: 'publish',
      label: 'Publish first project',
      description: 'Go live on your Webflow site automatically',
      done: hasPublishedProject,
      href: `/dashboard/${orgId}/get-started`,
      actionLabel: 'Start wizard',
    },
    {
      id: 'embed',
      label: 'Auto-runtime active',
      description: 'Landing pages render from Automaio without manual embed paste',
      done: embedConfigured || hasPublishedProject,
      href: `/dashboard/${orgId}/settings?tab=integrations`,
      actionLabel: embedConfigured ? undefined : 'Reconnect Webflow',
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const totalCount = steps.length

  return {
    steps,
    completedCount,
    totalCount,
    percentComplete: Math.round((completedCount / totalCount) * 100),
    isFullySetup: completedCount === totalCount,
    webflowConnected,
    hasPublishedProject,
  }
}
