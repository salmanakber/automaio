import { prisma } from '@/lib/prisma'

export async function findOrCreateGoogleUser(profile: {
  sub: string
  email: string
  given_name?: string
  family_name?: string
  picture?: string
}) {
  const email = profile.email.toLowerCase().trim()

  const byGoogle = await prisma.user.findUnique({ where: { googleId: profile.sub } })
  if (byGoogle) {
    return prisma.user.update({
      where: { id: byGoogle.id },
      data: {
        email,
        firstName: profile.given_name ?? byGoogle.firstName,
        lastName: profile.family_name ?? byGoogle.lastName,
        avatar: profile.picture ?? byGoogle.avatar,
      },
    })
  }

  const byEmail = await prisma.user.findUnique({ where: { email } })
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: profile.sub,
        firstName: profile.given_name ?? byEmail.firstName,
        lastName: profile.family_name ?? byEmail.lastName,
        avatar: profile.picture ?? byEmail.avatar,
      },
    })
  }

  return prisma.user.create({
    data: {
      email,
      googleId: profile.sub,
      firstName: profile.given_name,
      lastName: profile.family_name,
      avatar: profile.picture,
    },
  })
}
