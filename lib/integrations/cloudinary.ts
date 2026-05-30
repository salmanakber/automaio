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

export type CloudinaryUploadMode = 'signed' | 'unsigned-preset' | 'not-configured'

/** Which upload path the server will use (for debugging). */
export function getCloudinaryUploadMode(): CloudinaryUploadMode {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = getApiSecret()
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim()
  if (!cloudName) return 'not-configured'
  if (apiKey && apiSecret) return 'signed'
  if (preset) return 'unsigned-preset'
  return 'not-configured'
}

export function getCloudinaryDiagnostics() {
  const mode = getCloudinaryUploadMode()
  return {
    mode,
    hasCloudName: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    hasApiKey: Boolean(process.env.CLOUDINARY_API_KEY?.trim()),
    hasApiSecret: Boolean(getApiSecret()),
    hasUploadPreset: Boolean(process.env.CLOUDINARY_UPLOAD_PRESET?.trim()),
    /** When mode is signed, upload_preset is never sent to Cloudinary. */
    uploadPresetIgnored: mode === 'signed',
  }
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryUploadMode() !== 'not-configured'
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
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = getApiSecret()
  const mode = getCloudinaryUploadMode()
  const filename = options.filename ?? 'upload.jpg'
  const mime = guessMimeType(filename)

  const form = new FormData()
  const bytes = new Uint8Array(buffer)
  form.append('file', new File([bytes], filename, { type: mime }))

  // Signed server upload — never send upload_preset (mixing them causes whitelist errors)
  if (mode === 'signed' && apiKey && apiSecret) {
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
  } else if (mode === 'unsigned-preset') {
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim()
    if (!uploadPreset) {
      throw new Error('CLOUDINARY_UPLOAD_PRESET is not configured')
    }
    // Unsigned: file + preset only (no folder, api_key, or signature)
    form.append('upload_preset', uploadPreset)
  } else {
    throw new Error(
      'Cloudinary not configured — set CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET, or CLOUDINARY_UPLOAD_PRESET (unsigned)',
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
        `${message}. Create an unsigned upload preset in the Cloudinary dashboard, or set CLOUDINARY_API_SECRET for signed uploads.`,
      )
    }
    if (message.toLowerCase().includes('whitelisted for unsigned')) {
      throw new Error(
        `${message}. Your server is mixing signed credentials with upload_preset — restart \`npm run dev\` after .env changes, comment out CLOUDINARY_UPLOAD_PRESET when using API secret, and confirm the media API reports mode "signed".`,
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

/** Ensure CDN URLs load reliably in the studio (https, trimmed). */
export function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('http://res.cloudinary.com')) {
    return trimmed.replace(/^http:\/\//, 'https://')
  }
  return trimmed
}

export function normalizeMediaLibraryItem(item: unknown, index: number): MediaLibraryItem | null {
  if (!item || typeof item !== 'object') return null
  const raw = item as Record<string, unknown>
  const urlRaw =
    (typeof raw.url === 'string' && raw.url) ||
    (typeof raw.secureUrl === 'string' && raw.secureUrl) ||
    (typeof raw.secure_url === 'string' && raw.secure_url) ||
    ''
  const url = normalizeMediaUrl(urlRaw)
  if (!url) return null
  const publicId =
    (typeof raw.publicId === 'string' && raw.publicId) ||
    (typeof raw.public_id === 'string' && raw.public_id) ||
    ''
  const id =
    (typeof raw.id === 'string' && raw.id) ||
    publicId ||
    `media-${index}-${url.slice(-24)}`
  return {
    id,
    url,
    publicId,
    width: typeof raw.width === 'number' ? raw.width : undefined,
    height: typeof raw.height === 'number' ? raw.height : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    name: typeof raw.name === 'string' ? raw.name : undefined,
  }
}

export function readMediaLibrary(parameters: unknown): MediaLibraryItem[] {
  if (!parameters || typeof parameters !== 'object') return []
  const raw = (parameters as { mediaLibrary?: unknown }).mediaLibrary
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const items: MediaLibraryItem[] = []
  raw.forEach((item, index) => {
    const normalized = normalizeMediaLibraryItem(item, index)
    if (!normalized || seen.has(normalized.url)) return
    seen.add(normalized.url)
    items.push(normalized)
  })
  return items
}
