import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/api/org-access'
import crypto from 'crypto'

export type FormField = {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'url'
  required?: boolean
  placeholder?: string
  options?: string[]
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })
    await requireOrgAccess(user, orgId)

    const forms = await prisma.leadForm.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { submissions: true } } },
    })

    return NextResponse.json({ forms })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, name, fields, settings } = body

    if (!organizationId || !name || !fields?.length) {
      return NextResponse.json({ error: 'organizationId, name, and fields required' }, { status: 400 })
    }

    await requireOrgAccess(user, organizationId)

    const form = await prisma.leadForm.create({
      data: {
        organizationId,
        name,
        fields,
        settings: settings ?? { successMessage: 'Thanks! We will be in touch.' },
        embedToken: crypto.randomBytes(16).toString('hex'),
        createdById: user.id,
      },
    })

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
