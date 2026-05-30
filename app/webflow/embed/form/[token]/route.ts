import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/app-url'

/** Embeddable lead form page for canvas preview and external iframes. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const safeToken = encodeURIComponent(token)
  const base = getAppBaseUrl().replace(/\/$/, '')
  const containerId = `automaio-form-${token.slice(0, 8)}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Automaio form</title>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #fff; }
    .automaio-form { max-width: 520px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="${containerId}" data-automaio-form-root="true"></div>
  <script src="${base}/webflow/form-embed.js" data-form-token="${safeToken}" async></script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': 'frame-ancestors *',
    },
  })
}
