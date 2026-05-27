import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
import { createSession } from '@/lib/auth'
import { setAuthCookie } from '@/lib/session-cookie'

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const user = await signUp(email, password, firstName, lastName)
    const token = await createSession(user.id)

    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } },
      { status: 201 }
    )

    setAuthCookie(response, token, req)

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
