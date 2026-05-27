import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await validateSession(token)

    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 200 })
      response.cookies.delete('auth_token')
      return response
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
