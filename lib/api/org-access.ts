import { prisma } from '@/lib/prisma'

export async function userHasOrgAccess(userId: string, orgId: string) {
  return prisma.organization.findFirst({
    where: {
      id: orgId,
      OR: [{ ownerId: userId }, { teamMembers: { some: { userId } } }],
    },
  })
}

export async function requireOrgAccess(user: { id: string }, orgId: string) {
  const org = await userHasOrgAccess(user.id, orgId)
  if (!org) throw new Error('Forbidden')
  return org
}

export async function requireOrgAccessByUserId(userId: string, orgId: string) {
  return requireOrgAccess({ id: userId }, orgId)
}
