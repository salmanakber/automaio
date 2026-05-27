import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const form = await prisma.leadForm.findUnique({
    where: { embedToken: token },
    select: {
      id: true,
      name: true,
      fields: true,
      settings: true,
      status: true,
    },
  })

  if (!form || form.status !== 'active') {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  return NextResponse.json({ form }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  })
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const form = await prisma.leadForm.findUnique({ where: { embedToken: token } })

  if (!form || form.status !== 'active') {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  const body = await req.json()
  const data = body.data ?? body

  const submission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      data,
      sourceUrl: body.sourceUrl ?? req.headers.get('referer') ?? undefined,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    },
  })

  const settings = form.settings as { successMessage?: string; redirectUrl?: string } | null

  return NextResponse.json(
    {
      success: true,
      submissionId: submission.id,
      message: settings?.successMessage ?? 'Thank you!',
      redirectUrl: settings?.redirectUrl,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
