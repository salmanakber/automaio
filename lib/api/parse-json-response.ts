/** Parse fetch response as JSON; surface HTML/error pages with a clear message. */
export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text()
  const contentType = res.headers.get('content-type') ?? ''

  if (!text.trim()) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return {} as T
  }

  if (contentType.includes('application/json') || text.trimStart().startsWith('{')) {
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`Invalid JSON response (${res.status})`)
    }
  }

  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    if (res.status === 413) {
      throw new Error('Template is too large to save. Try a shorter template or remove unused sections.')
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Session expired. Please refresh the page and sign in again.')
    }
    throw new Error(
      `Server returned an HTML page instead of JSON (${res.status}). Refresh and try again.`,
    )
  }

  if (!res.ok) throw new Error(text.slice(0, 200) || `Request failed (${res.status})`)
  throw new Error(`Unexpected response format (${res.status})`)
}
