import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { clearAuthCookie } from '@/lib/session-cookie'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ success: true }, { status: 200 })
    clearAuthCookie(response, req)
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
