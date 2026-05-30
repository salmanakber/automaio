import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireOrgAccessByUserId } from '@/lib/api/org-access'
import {
  getCloudinaryDiagnostics,
  isCloudinaryConfigured,
  normalizeMediaLibraryItem,
  normalizeMediaUrl,
  readMediaLibrary,
  uploadImageBuffer,
  type MediaLibraryItem,
} from '@/lib/integrations/cloudinary'

type RouteParams = { params: Promise<{ id: string }> }

const MAX_FILES_PER_REQUEST = 20
const MAX_FILE_BYTES = 10 * 1024 * 1024

function collectFiles(form: FormData): File[] {
  const fromFiles = form.getAll('files').filter((f): f is File => f instanceof File)
  const fromFile = form.getAll('file').filter((f): f is File => f instanceof File)
  const merged = [...fromFiles, ...fromFile]
  const seen = new Set<string>()
  return merged.filter((f) => {
    const key = `${f.name}-${f.size}-${f.lastModified}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

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
      cloudinary: getCloudinaryDiagnostics(),
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
        {
          error:
            'Image uploads are not configured. Contact your administrator to enable media storage.',
        },
        { status: 503 },
      )
    }

    const form = await req.formData()
    const files = collectFiles(form)
    if (!files.length) {
      return NextResponse.json({ error: 'At least one image file is required' }, { status: 400 })
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES_PER_REQUEST} files per upload` }, { status: 400 })
    }

    const folder = `automaio/projects/${id}`
    const uploadedItems: MediaLibraryItem[] = []
    const errors: { name: string; error: string }[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push({ name: file.name, error: 'Only image uploads are supported' })
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        errors.push({ name: file.name, error: 'File exceeds 10MB limit' })
        continue
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const uploaded = await uploadImageBuffer(buffer, {
          folder,
          filename: file.name || 'image.jpg',
        })

        uploadedItems.push(
          normalizeMediaLibraryItem(
            {
              id: uploaded.publicId || `media-${Date.now()}-${uploadedItems.length}`,
              url: normalizeMediaUrl(uploaded.secureUrl || uploaded.url),
              publicId: uploaded.publicId,
              width: uploaded.width,
              height: uploaded.height,
              createdAt: new Date().toISOString(),
              name: file.name,
            },
            uploadedItems.length,
          )!,
        )
      } catch (err) {
        errors.push({
          name: file.name,
          error: err instanceof Error ? err.message : 'Upload failed',
        })
      }
    }

    if (!uploadedItems.length) {
      return NextResponse.json(
        { error: errors[0]?.error ?? 'All uploads failed', errors },
        { status: 500 },
      )
    }

    const existingParams = (project.parameters as Record<string, unknown>) ?? {}
    const library = readMediaLibrary(existingParams)
    const merged = [...uploadedItems, ...library.filter((m) => !uploadedItems.some((u) => u.url === m.url))].slice(
      0,
      200,
    )

    await prisma.contentProject.update({
      where: { id },
      data: {
        parameters: {
          ...existingParams,
          mediaLibrary: merged,
        } as object,
      },
    })

    return NextResponse.json({
      items: merged,
      uploaded: uploadedItems,
      item: uploadedItems[0],
      errors: errors.length ? errors : undefined,
      cloudinary: getCloudinaryDiagnostics(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
