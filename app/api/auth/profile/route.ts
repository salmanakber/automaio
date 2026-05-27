import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req)
  if (response) return response

  return NextResponse.json({
    user: {
      id: user!.id,
      email: user!.email,
      firstName: user!.firstName,
      lastName: user!.lastName,
      avatar: user!.avatar,
      createdAt: user!.createdAt,
      updatedAt: user!.updatedAt,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireUser(req)
  if (response) return response

  try {
    const { firstName, lastName, currentPassword, newPassword } = await req.json()

    const data: {
      firstName?: string
      lastName?: string
      password?: string
    } = {}

    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required' }, { status: 400 })
      }
      const valid = await verifyPassword(currentPassword, user!.password)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters' },
          { status: 400 },
        )
      }
      data.password = await hashPassword(newPassword)
    }

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
