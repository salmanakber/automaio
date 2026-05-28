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

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
}

function getCloudName() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) throw new Error('CLOUDINARY_CLOUD_NAME is not configured')
  return cloudName
}

export async function uploadImageBuffer(
  buffer: Buffer,
  options: { folder: string; filename?: string },
): Promise<CloudinaryUploadResult> {
  const cloudName = getCloudName()
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  const form = new FormData()
  form.append('file', new Blob([buffer]), options.filename ?? 'upload.jpg')
  form.append('folder', options.folder)

  if (uploadPreset) {
    form.append('upload_preset', uploadPreset)
  } else if (apiKey && apiSecret) {
    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = `folder=${options.folder}&timestamp=${timestamp}`
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex')
    form.append('api_key', apiKey)
    form.append('timestamp', String(timestamp))
    form.append('signature', signature)
  } else {
    throw new Error(
      'Cloudinary not configured — set CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET',
    )
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })

  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(String(data.error ?? 'Cloudinary upload failed'))
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
