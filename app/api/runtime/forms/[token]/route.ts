import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ token: string }> }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Public form schema for runtime embed (like template runtime API). */
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
      embedToken: true,
    },
  })

  if (!form || form.status !== 'active') {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: CORS })
  }

  const settings = (form.settings as Record<string, unknown>) ?? {}

  return NextResponse.json(
    {
      version: 1,
      formId: form.id,
      token: form.embedToken,
      name: form.name,
      fields: form.fields,
      settings: {
        successMessage: settings.successMessage ?? 'Thank you!',
        redirectUrl: settings.redirectUrl ?? null,
        audienceType: settings.audienceType ?? 'lead',
        theme: settings.theme ?? {},
      },
      render: {
        cssContent: buildFormCss(settings.theme as Record<string, string> | undefined),
      },
    },
    { headers: { ...CORS, 'Cache-Control': 'public, max-age=30' } },
  )
}

function buildFormCss(theme?: Record<string, string>): string {
  const primary = theme?.primary ?? '#0f172a'
  const radius = theme?.radius ?? '8px'
  return `
.automaio-form{font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto}
.automaio-form label{display:block;font-size:13px;font-weight:500;margin-bottom:4px;color:#111}
.automaio-form input,.automaio-form textarea,.automaio-form select{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:${radius};font-size:14px;margin-bottom:12px;box-sizing:border-box}
.automaio-form button{background:${primary};color:#fff;border:0;padding:12px 20px;border-radius:${radius};font-size:14px;font-weight:600;cursor:pointer;width:100%}
.automaio-form button:hover{opacity:.92}
.automaio-form .success{padding:12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:${radius};color:#065f46;font-size:14px}
.automaio-form .error{padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:${radius};color:#991b1b;font-size:14px;margin-bottom:12px}
`.trim()
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
