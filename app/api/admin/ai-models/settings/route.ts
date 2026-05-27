import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import {
  OPTIMIZATION_MODES,
  getCatalogModel,
} from '@/lib/ai/model-catalog'
import { getPlatformAISettings, setPlatformAISettings } from '@/lib/ai/platform-settings'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const settings = await getPlatformAISettings()
    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { primaryModel, optimizationMode } = await req.json()

    if (primaryModel && !getCatalogModel(primaryModel)) {
      return NextResponse.json({ error: 'Invalid primary model' }, { status: 400 })
    }

    if (
      optimizationMode &&
      !OPTIMIZATION_MODES.includes(optimizationMode)
    ) {
      return NextResponse.json({ error: 'Invalid optimization mode' }, { status: 400 })
    }

    await setPlatformAISettings({ primaryModel, optimizationMode })
    const settings = await getPlatformAISettings()

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
