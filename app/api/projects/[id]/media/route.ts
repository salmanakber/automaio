import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import {
  isCloudinaryConfigured,
  readMediaLibrary,
  uploadImageBuffer,
  type MediaLibraryItem,
} from '@/lib/integrations/cloudinary'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = _req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    const items = readMediaLibrary(project.parameters)
    return NextResponse.json({
      items,
      cloudinaryConfigured: isCloudinaryConfigured(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load media'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = req.cookies.get('auth_token')?.value
    const user = await validateSession(token || '')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const project = await prisma.contentProject.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await requireOrgAccessByUserId(user.id, project.organizationId)

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to .env' },
        { status: 503 },
      )
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const folder = `automaio/projects/${id}`
    const uploaded = await uploadImageBuffer(buffer, {
      folder,
      filename: file.name || 'image.jpg',
    })

    const item: MediaLibraryItem = {
      id: uploaded.publicId || `media-${Date.now()}`,
      url: uploaded.secureUrl || uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      createdAt: new Date().toISOString(),
      name: file.name,
    }

    const existingParams = (project.parameters as Record<string, unknown>) ?? {}
    const library = readMediaLibrary(existingParams)
    const nextLibrary = [item, ...library.filter((m) => m.url !== item.url)].slice(0, 200)

    await prisma.contentProject.update({
      where: { id },
      data: {
        parameters: {
          ...existingParams,
          mediaLibrary: nextLibrary,
        } as object,
      },
    })

    return NextResponse.json({ item, items: nextLibrary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
