# context.md — Automaio Page Rendering System

## 🧠 System Overview

## 📦 Template Import / Ready-Made Templates Rule

When a user selects a ready-made template from the library OR imports an HTML template, it MUST be converted into the internal JSON page schema format before use.

### Conversion Rule:
- Imported HTML templates are NOT stored or rendered as raw HTML pages
- They must be parsed into reusable component blocks
- Each section of HTML must map to a registered block type (e.g., hero, features, cta)
- Final stored format must be JSON page schema only

Example flow:

HTML Template / Ready-made Template
→ Parser
→ Block conversion (component mapping)
→ JSON Page Schema
→ Renderer
→ Final HTML output

This ensures all templates (manual or imported) remain SEO-safe, structured, and compatible with the rendering engine.

## 🧠 System Overview

We are building an AI-powered website builder where pages are generated from structured data and rendered into SEO-friendly HTML.

The system must support:
- SEO-first rendering
- AI-generated pages
- Optional Webflow CMS integration (metadata only)
- Runtime enhancements (animations/interactions only)

---

## 🚨 Critical Rule (DO NOT BREAK)

### ❌ DO NOT:
- Store raw HTML as the primary page source
- Store raw CSS for runtime injection
- Store raw JS from CMS and execute it
- Use innerHTML as the main rendering system
- Use eval() or any CMS-driven code execution

These patterns break SEO, security, and scalability.

---

## 🟢 NEW ARCHITECTURE (REQUIRED)

### 1. CMS DATA STRUCTURE (SOURCE OF TRUTH)

All pages must be stored as structured JSON:

```json
{
  "pageId": "unique-id",
  "slug": "/landing-page",
  "seo": {
    "title": "Page Title",
    "description": "Page description"
  },
  "sections": [
    {
      "type": "hero",
      "props": {
        "title": "Build Faster",
        "subtitle": "AI-powered landing pages"
      }
    },
    {
      "type": "features",
      "props": {
        "items": ["Fast", "SEO Ready", "Scalable"]
      }
    }
  ]
}
```

---

### 2. RENDERING RULE (SERVER-SIDE ONLY)

Pages must be rendered BEFORE sending HTML to browser.

Flow:

JSON → Renderer → Final HTML → Response

Example output:

```html
<body>
  <section class="hero">
    <h1>Build Faster</h1>
    <p>AI-powered landing pages</p>
  </section>
</body>
```

---

### 3. SEO REQUIREMENT

- Content MUST exist in initial HTML response
- Page MUST be readable without JavaScript
- JS MUST NOT be required for core content rendering

---

### 4. RUNTIME SCRIPT ROLE (LIMITED)

The runtime script (AutomaioRuntime) is ONLY allowed for:

✔ Animations
✔ Scroll effects
✔ UI interactions
✔ Visual enhancements

---

### ❌ NOT ALLOWED IN RUNTIME

- Page rendering
- HTML structure injection
- CMS-driven JS execution
- eval() or script injection from CMS

---

### 5. CSS HANDLING

CSS must NOT be injected from CMS at runtime.

Allowed:
- Precompiled CSS per page
- Scoped component CSS
- Build-time CSS bundling

---

### 6. COMPONENT SYSTEM (REQUIRED)

Pages must be built using predefined components:

- Hero
- Features
- Pricing
- Testimonials
- CTA

Each section maps to a renderer function:

renderSection(type, props)

---

## 🟢 SYSTEM FLOW

AI Builder → JSON Schema → Server Renderer → SEO HTML Page → Runtime Enhancer

---

## 🚀 GOAL

- SEO-first architecture
- Safe rendering (no arbitrary code execution)
- Scalable AI page generation system
- Clean separation between content and behavior
- Webflow-compatible metadata layer (optional)

---

## ⚠️ FINAL RULE

If a page cannot display meaningful content without JavaScript, it is INVALID for production SEO.

---

## Webflow App Store / Marketplace alignment

Automaio ships as a Webflow Data Client app. Production defaults:

| Area | Policy |
|------|--------|
| **Default delivery** | Remote runtime — CMS stores Page ID + SEO; JSON page schema on Automaio |
| **custom_code scope** | OAuth only; one registered inline script on the collection template (footer) |
| **CMS fields** | No `eval()` or execution of JavaScript from Plain Text CMS fields |
| **Legacy modes** | Split HTML / iframe are opt-in only, with user acknowledgment in publish UI |
| **Runtime script** | AutomaioRuntime — animations/interactions only, not primary content rendering |

See `lib/webflow/marketplace-policy.ts` and `public/webflow-marketplace.json`.

