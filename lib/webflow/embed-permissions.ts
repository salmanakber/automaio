import { WebflowClient } from '@/lib/integrations/webflow-client'

export type CustomCodeAccessResult =
  | { ok: true }
  | { ok: false; reason: 'no_permission' | 'api_error'; message: string }

export function isCustomCodePermissionError(message: string) {
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('Forbidden') ||
    message.includes('Unauthorized')
  )
}

/** Embed setup failed but publish can continue via Rich Text HTML fallback. */
export function isEmbedRecoverableError(message: string) {
  return (
    isCustomCodePermissionError(message) ||
    message.includes('Custom code block not found') ||
    /404|not found|resource_not_found|Requested resource/i.test(message)
  )
}

/** Site API tokens cannot use custom_code — only OAuth Data Client apps can (required for Webflow App Store). */
export async function checkCustomCodeAccess(
  apiKey: string,
  siteId: string,
): Promise<CustomCodeAccessResult> {
  try {
    const client = new WebflowClient(apiKey)
    await client.listRegisteredScripts(siteId)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (isCustomCodePermissionError(message)) {
      return {
        ok: false,
        reason: 'no_permission',
        message:
          'Your Webflow connection cannot manage custom code. Reconnect via OAuth (not an API token) to enable automatic embed.',
      }
    }
    return { ok: false, reason: 'api_error', message }
  }
}
