# Automaio Webflow Designer Extension

Webflow assigns a fixed **Designer Extension URI** like `https://xxxx.webflow-ext.com`. You cannot change it to your app domain — that is normal.

This folder is the extension **shell** Webflow loads. It iframes your Next.js app at `/webflow/designer` on your live URL (`https://automaio.kilo1app.com`).

## Production

1. Deploy the Next.js app with:

   ```env
   NEXTAUTH_URL=https://automaio.kilo1app.com
   NEXT_PUBLIC_APP_URL=https://automaio.kilo1app.com
   WEBFLOW_REDIRECT_URI=https://automaio.kilo1app.com/api/integrations/webflow/oauth/callback
   ```

2. Set `AUTOMAIO_APP_URL` in `public/index.html` to the same URL.

3. In Webflow Workspace → Apps → your app → open the Designer panel.

Install / OAuth uses **App homepage** (`/webflow/install`) on your live domain — separate from the Designer URI.

## Local development (optional)

1. **Next.js** (port 3000):

   ```bash
   npm run dev
   ```

2. **Webflow extension** (serves this folder to `webflow-ext.com`):

   ```bash
   npm run webflow:extension
   ```

3. Point `AUTOMAIO_APP_URL` in `public/index.html` to `http://localhost:3000` for local testing only.

In Webflow Designer: Workspace → Apps → your app → **Launch Development App**.
