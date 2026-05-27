# Automaio Webflow Designer Extension

Webflow assigns a fixed **Designer Extension URI** like `https://xxxx.webflow-ext.com`. You cannot change it to ngrok — that is normal.

This folder is the extension **shell** Webflow loads. It iframes your Next.js app at `/webflow/designer` on your ngrok URL.

## Local development (3 terminals)

1. **Next.js** (port 3000):

   ```bash
   npm run dev
   ```

2. **ngrok**:

   ```bash
   ngrok http 3000
   ```

3. **Webflow extension** (serves this folder to `webflow-ext.com`):

   ```bash
   npm run webflow:extension
   ```

Update `AUTOMAIO_APP_URL` in `public/index.html` to match `NEXTAUTH_URL` in `.env` when ngrok URL changes.

## In Webflow Designer

Workspace → Apps → your app → **Launch Development App** (not only Install).

Install / OAuth uses **App homepage** (`/webflow/install`) on ngrok — separate from the Designer URI.
