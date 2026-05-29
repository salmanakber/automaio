# Webflow Designer Extension — fix "refused to connect"

## Why you see `webflow-ext.com refused to connect`

This happens when Webflow tries to load the **wrong URL**:

| Button | Loads from | Works? |
|--------|------------|--------|
| **Launch development app** | Your **Development URL** in app settings | Only if HTTPS and correct URL |
| **Launch App** | Published `bundle.zip` on Webflow CDN | After bundle upload |

**Do not** set Development URL to `https://….webflow-ext.com` — that domain only works for **Launch App** with a versioned path, not as a dev server. Opening it directly returns 404 → "refused to connect".

**Do not** use `http://your-server-ip:1337` — HTTP is blocked; Webflow will not inject the Designer API.

---

## Recommended setup (works on your live server)

### 1. Deploy latest Automaio

Pull, build, restart so `/webflow/extension-shell/` is available:

```bash
git pull
npm run build
# restart your process manager
```

Verify in browser: `https://automaio.kilo1app.com/webflow/extension-shell/`  
You should see the Automaio shell (dark UI + loading spinner), not a login redirect.

### 2. Webflow app settings

Workspace → **Apps & Integrations** → **Develop** → **Automaio** → **Edit App** → **Building Blocks** → **Designer Extension**

Set **Development URL** to exactly:

```
https://automaio.kilo1app.com/webflow/extension-shell/
```

Remove any URL pointing to `webflow-ext.com` or `http://209.97.132.83:1337`.

### 3. Upload production bundle (for Launch App)

```bash
npm run webflow:extension:bundle
```

Upload `webflow-designer-ext/bundle.zip` → **Publish extension version**.

### 4. In Webflow Designer

1. Open your **CMS collection template** page
2. Press **E** → **Automaio**
3. Click **Launch development app** (uses your HTTPS shell above)  
   **or** **Launch App** (uses uploaded bundle)
4. Top bar should show **Webflow API ready** (green dot)
5. Click **Install embed**

---

## Checklist if it still fails

- [ ] Development URL is `https://automaio.kilo1app.com/webflow/extension-shell/` (trailing slash OK)
- [ ] You are clicking **Launch development app** or **Launch App**, not opening URLs in a browser tab
- [ ] `https://automaio.kilo1app.com/webflow/extension-shell/` loads without login redirect
- [ ] Bundle upload shows in **Version history** with a recent date
- [ ] 2FA enabled on Webflow account (required to publish bundles)
- [ ] You are workspace **admin** (only admins can upload bundles)
