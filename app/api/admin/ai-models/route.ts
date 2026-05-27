import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCatalogModel, getProviderEnvStatus } from '@/lib/ai/model-catalog'
import { assertCanRegisterModel } from '@/lib/ai/resolve-model-api-key'
import { listAdminAIModels, getNextFallbackOrder } from '@/lib/ai/admin-models'

export async function GET(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const data = await listAdminAIModels()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching AI configs:', error)
    return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const {
      modelName,
      apiKey,
      maxTokens = 2000,
      temperature = 0.7,
      isActive = true,
    } = await req.json()

    if (!modelName) {
      return NextResponse.json({ error: 'Model name required' }, { status: 400 })
    }

    const catalog = getCatalogModel(modelName)
    if (!catalog) {
      return NextResponse.json({ error: 'Unknown model. Pick from the catalog.' }, { status: 400 })
    }

    const canAdd = await assertCanRegisterModel(catalog)
    if (!canAdd.ok) {
      return NextResponse.json({ error: canAdd.message }, { status: 400 })
    }

    const existing = await prisma.aIModelConfig.findFirst({
      where: { modelName, organizationId: null },
    })

    if (existing) {
      return NextResponse.json({ error: 'Model already configured' }, { status: 409 })
    }

    const fallbackOrder = await getNextFallbackOrder()

    const config = await prisma.aIModelConfig.create({
      data: {
        modelName,
        apiKey: apiKey || null,
        maxTokens: Number(maxTokens),
        temperature: parseFloat(String(temperature)),
        isActive: Boolean(isActive),
        fallbackOrder,
      },
    })

    return NextResponse.json(
      {
        config: {
          id: config.id,
          modelName: config.modelName,
          isActive: config.isActive,
          maxTokens: config.maxTokens,
          temperature: Number(config.temperature),
          fallbackOrder: config.fallbackOrder,
          hasStoredApiKey: Boolean(config.apiKey),
        },
        providers: await getProviderConfiguredMap(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating AI config:', error)
    return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
  }
}
