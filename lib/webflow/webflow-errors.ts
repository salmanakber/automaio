type WebflowErrorDetail = {
  param?: string
  description?: string
  message?: string
}

type ParsedWebflowError = {
  message?: string
  code?: string
  details?: WebflowErrorDetail[]
}

function parseWebflowErrorPayload(message: string): ParsedWebflowError | null {
  const jsonStart = message.indexOf('{')
  if (jsonStart < 0) return null

  try {
    return JSON.parse(message.slice(jsonStart)) as ParsedWebflowError
  } catch {
    return null
  }
}

function formatDetailLine(detail: WebflowErrorDetail): string {
  const field = detail.param?.replace(/^fieldData\./, '') ?? 'field'
  const desc = detail.description ?? detail.message ?? 'invalid value'
  return `${field}: ${desc}`
}

export function formatWebflowValidationError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  const parsed = parseWebflowErrorPayload(msg)

  if (parsed?.details?.length) {
    const unknownFields = parsed.details
      .filter((d) => d.description?.includes('not described in schema'))
      .map((d) => d.param?.replace(/^fieldData\./, '') ?? 'unknown')

    if (unknownFields.length) {
      return (
        `Your Webflow collection is missing these fields: ${unknownFields.join(', ')}. ` +
        'Open Settings → Webflow and sync your collection, or add the missing fields in Webflow.'
      )
    }

    const lines = parsed.details.map(formatDetailLine)
    return `Webflow could not save this item — ${lines.join('; ')}`
  }

  if (parsed?.message) {
    if (/validation_error/i.test(parsed.message)) {
      return 'Webflow rejected the content. Check that your collection has Name, Slug, and a Rich Text body field, then sync in Settings.'
    }
    return parsed.message
  }

  if (/rate limit|429|too many requests/i.test(msg)) {
    return (
      'Webflow rate limit reached (too many publish requests). ' +
      'Your CMS item was saved — wait 60 seconds, then publish again with "Publish Webflow site" unchecked, ' +
      'or publish the site manually from Webflow.'
    )
  }

  if (/Field not described in schema/i.test(msg)) {
    return 'Webflow rejected unknown CMS fields. Sync your collection in Settings and try again.'
  }

  return msg.replace(/^Webflow API \d+:\s*/, 'Webflow error: ')
}

export function formatWebflowCollectionCreateError(error: unknown, displayName?: string): string {
  const msg = error instanceof Error ? error.message : String(error)
  const name = displayName?.trim() || 'this name'

  if (
    /duplicate|already exist|already_exists|slug.*(taken|exists|in use)|unique constraint|conflict/i.test(
      msg,
    )
  ) {
    return (
      `A collection named "${name}" already exists in your Webflow site. ` +
      `Select it from the collection dropdown, or use a different name (for example "${name} 2").`
    )
  }

  if (/forbidden|403/i.test(msg)) {
    return 'Webflow denied access. Reconnect Webflow in Settings and ensure your API token can manage CMS collections.'
  }

  if (/rate limit|429/i.test(msg)) {
    return 'Webflow rate limit reached. Wait a minute and try again.'
  }

  const parsed = parseWebflowErrorPayload(msg)
  if (parsed?.message && !parsed.message.startsWith('Webflow API')) {
    return parsed.message
  }

  return 'Could not create the Webflow collection. Check your Webflow connection and try a different collection name.'
}

export function isDuplicateCollectionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /duplicate|already exist|already_exists|slug.*(taken|exists|in use)|unique constraint|conflict/i.test(
    msg,
  )
}
