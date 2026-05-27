import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function requireUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value ?? ''
  const user = await validateSession(token)

  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { user, response: null }
}
