import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { getProviderKeyStatus, setAdminProviderKeys } from '@/lib/ai/provider-keys'
import type { AIProvider as ProviderId } from '@/lib/ai/model-catalog'

const VALID: ProviderId[] = [
  'google',
  'openai',
  'anthropic',
  'groq',
  'deepseek',
  'mistral',
  'together',
  'openrouter',
]

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const providers = await getProviderKeyStatus()
    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Provider keys GET:', error)
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const body = await req.json()
    const keys = body.keys as Partial<Record<ProviderId, string | null>> | undefined

    if (!keys || typeof keys !== 'object') {
      return NextResponse.json({ error: 'Expected { keys: { google: "...", ... } }' }, { status: 400 })
    }

    const updates: Partial<Record<ProviderId, string | null>> = {}
    for (const [provider, value] of Object.entries(keys)) {
      if (!VALID.includes(provider as ProviderId)) continue
      if (value === null || value === '') {
        updates[provider as ProviderId] = null
      } else if (typeof value === 'string') {
        updates[provider as ProviderId] = value
      }
    }

    await setAdminProviderKeys(updates)
    const providers = await getProviderKeyStatus()
    return NextResponse.json({ providers, message: 'API keys saved' })
  } catch (error) {
    console.error('Provider keys PATCH:', error)
    return NextResponse.json({ error: 'Failed to save API keys' }, { status: 500 })
  }
}
