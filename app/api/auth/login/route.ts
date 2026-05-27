import { NextRequest, NextResponse } from 'next/server'
import { signIn, createSession } from '@/lib/auth'
import { setAuthCookie } from '@/lib/session-cookie'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await signIn(email, password)
    const token = await createSession(user.id)

    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } },
      { status: 200 }
    )

    setAuthCookie(response, token, req)

    console.log('[Auth Login] Cookie set for user:', user.email, '| secure:', req.headers.get('x-forwarded-proto'))

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
