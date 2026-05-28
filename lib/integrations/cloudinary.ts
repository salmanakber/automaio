import crypto from 'crypto'

export type CloudinaryUploadResult = {
  url: string
  secureUrl: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

function getCloudName() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) throw new Error('CLOUDINARY_CLOUD_NAME is not configured')
  return cloudName
}

function getApiSecret() {
  const secret = process.env.CLOUDINARY_API_SECRET?.trim()
  return secret || undefined
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = getApiSecret()
  return Boolean(cloudName && (preset || (apiKey && apiSecret)))
}

function formatCloudinaryError(data: Record<string, unknown>): string {
  const err = data.error
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return 'Cloudinary upload failed'
}

function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  }
  return (ext && map[ext]) || 'image/jpeg'
}

export async function uploadImageBuffer(
  buffer: Buffer,
  options: { folder: string; filename?: string },
): Promise<CloudinaryUploadResult> {
  const cloudName = getCloudName()
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = getApiSecret()
  const filename = options.filename ?? 'upload.jpg'
  const mime = guessMimeType(filename)

  const form = new FormData()
  const bytes = new Uint8Array(buffer)
  form.append('file', new File([bytes], filename, { type: mime }))

  if (uploadPreset) {
    form.append('upload_preset', uploadPreset)
    // Unsigned presets often lock folder in dashboard — only send folder when signed upload is used
    if (apiSecret && apiKey) {
      form.append('folder', options.folder)
    }
  } else if (apiKey && apiSecret) {
    const timestamp = Math.round(Date.now() / 1000)
    const params: Record<string, string> = {
      folder: options.folder,
      timestamp: String(timestamp),
    }
    const paramsToSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&')
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex')
    form.append('folder', options.folder)
    form.append('api_key', apiKey)
    form.append('timestamp', String(timestamp))
    form.append('signature', signature)
  } else {
    throw new Error(
      'Cloudinary not configured — set CLOUDINARY_UPLOAD_PRESET (unsigned) or CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET',
    )
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })

  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const message = formatCloudinaryError(data)
    if (message.toLowerCase().includes('preset not found')) {
      throw new Error(
        `${message}. Create an unsigned upload preset named "${uploadPreset}" in your Cloudinary dashboard, or set CLOUDINARY_API_SECRET for signed uploads.`,
      )
    }
    throw new Error(message)
  }

  return {
    url: String(data.url ?? ''),
    secureUrl: String(data.secure_url ?? data.url ?? ''),
    publicId: String(data.public_id ?? ''),
    width: Number(data.width ?? 0),
    height: Number(data.height ?? 0),
    format: String(data.format ?? ''),
    bytes: Number(data.bytes ?? 0),
  }
}

export type MediaLibraryItem = {
  id: string
  url: string
  publicId: string
  width?: number
  height?: number
  createdAt: string
  name?: string
}

export function readMediaLibrary(parameters: unknown): MediaLibraryItem[] {
  if (!parameters || typeof parameters !== 'object') return []
  const raw = (parameters as { mediaLibrary?: unknown }).mediaLibrary
  if (!Array.isArray(raw)) return []
  return raw.filter((item) => item && typeof item === 'object' && typeof item.url === 'string') as MediaLibraryItem[]
}
