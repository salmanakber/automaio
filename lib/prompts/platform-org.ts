import { prisma } from '@/lib/prisma'

const PLATFORM_SLUG = process.env.PLATFORM_ORG_SLUG ?? 'automaio-demo'

/** Organization that holds platform-wide prompts editable in admin. */
export async function getPlatformOrganizationId(): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { slug: PLATFORM_SLUG },
    select: { id: true },
  })

  if (!org) {
    throw new Error(
      `Platform organization "${PLATFORM_SLUG}" not found. Run npm run db:seed first.`,
    )
  }

  return org.id
}
