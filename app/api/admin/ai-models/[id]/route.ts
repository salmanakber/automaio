import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { isPlatformSettingsRecord } from '@/lib/ai/model-catalog'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.aIModelConfig.findUnique({ where: { id } })
    if (!existing || isPlatformSettingsRecord(existing.modelName)) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    const config = await prisma.aIModelConfig.update({
      where: { id },
      data: {
        ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        ...(body.maxTokens != null ? { maxTokens: Number(body.maxTokens) } : {}),
        ...(body.temperature != null ? { temperature: Number(body.temperature) } : {}),
        ...(body.fallbackOrder != null ? { fallbackOrder: Number(body.fallbackOrder) } : {}),
        ...(body.apiKey !== undefined
          ? { apiKey: body.apiKey === '' ? null : body.apiKey }
          : {}),
      },
      select: {
        id: true,
        modelName: true,
        isActive: true,
        maxTokens: true,
        temperature: true,
        fallbackOrder: true,
        apiKey: true,
      },
    })

    return NextResponse.json({
      config: {
        id: config.id,
        modelName: config.modelName,
        isActive: config.isActive,
        maxTokens: config.maxTokens,
        temperature: Number(config.temperature),
        fallbackOrder: config.fallbackOrder,
        hasStoredApiKey: Boolean(config.apiKey),
      },
    })
  } catch (error) {
    console.error('Error updating AI model:', error)
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser(req)
  if (response) return response

  try {
    const { id } = await params
    const existing = await prisma.aIModelConfig.findUnique({ where: { id } })

    if (!existing || isPlatformSettingsRecord(existing.modelName)) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    await prisma.aIModelConfig.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
  }
}
