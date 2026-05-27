import { NextResponse } from 'next/server'
import { isGoogleOAuthConfigured } from '@/lib/auth/google-oauth'

export async function GET() {
  return NextResponse.json({
    google: isGoogleOAuthConfigured(),
  })
}
