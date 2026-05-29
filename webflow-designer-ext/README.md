# Automaio Webflow Designer Extension

Webflow loads this folder from a fixed **`*.webflow-ext.com`** URI. That shell iframes your Next.js app at `/webflow/designer` on your live domain.

## Why you see “Launch Development App” and localhost:1337

| What you click | What loads |
|----------------|------------|
| **Launch development app** | `localhost:1337` — local CLI only (`npm run webflow:extension`) |
| **Launch App** | Production bundle hosted by Webflow — use this on live sites |

If Designer shows **Launch development app**, you are in **dev mode**. Your live site at [automaio.kilo1app.com](https://automaio.kilo1app.com/) is separate — publish the extension bundle to Webflow once (see below).

Ref: [Webflow — publish your Designer Extension](https://developers.webflow.com/apps/docs/publishing-your-app)

## Production setup (live server)

### 1. Deploy Next.js with

```env
NEXTAUTH_URL=https://automaio.kilo1app.com
NEXT_PUBLIC_APP_URL=https://automaio.kilo1app.com
WEBFLOW_REDIRECT_URI=https://automaio.kilo1app.com/api/integrations/webflow/oauth/callback
```

### 2. Confirm extension shell URL

In `public/index.html`, `AUTOMAIO_APP_URL` must match (already set to production):

```js
var AUTOMAIO_APP_URL = 'https://automaio.kilo1app.com'
```

### 3. Bundle and upload to Webflow

From the repo root (on your machine or CI):

```bash
npm run webflow:extension:bundle
```

This creates `webflow-designer-ext/bundle.zip`.

Then in **Webflow Workspace**:

1. **Settings → Apps & Integrations → Develop**
2. Select **Automaio** → **Publish extension version**
3. Upload `bundle.zip` and add release notes

### 4. In Webflow Designer (your site)

1. Press **E** (Apps panel)
2. Open **Automaio**
3. Click **Launch App** — **not** “Launch development app”

Also set in Webflow app settings (**Edit App → Building Blocks**):

- **App homepage**: `https://automaio.kilo1app.com/webflow/install`
- **Designer Extension URI**: shown after upload (Webflow-hosted; do not change to your domain)

## Local development only

```bash
npm run dev                    # Next.js on :3301
npm run webflow:extension      # Extension shell on :1337
```

Temporarily set `AUTOMAIO_APP_URL` in `public/index.html` to your local Next URL if needed.

In Designer: **Launch development app** (localhost:1337) — never use this for production sites.
