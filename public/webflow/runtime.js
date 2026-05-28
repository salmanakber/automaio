/**
 * Automaio Remote Runtime — fetches page schema from platform API and renders in-place.
 * Webflow CMS stores only pageId + SEO metadata; rendering stays on platform infrastructure.
 */
(function (global) {
  'use strict'

  function getScriptBase() {
    var scripts = document.querySelectorAll('script[src*="runtime.js"]')
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src
      if (src) return src.replace(/\/webflow\/runtime\.js.*$/, '')
    }
    return ''
  }

  function showError(target, message) {
    if (!target) return
    target.innerHTML =
      '<p style="font-family:system-ui;padding:2rem;color:#b45309;text-align:center;font-size:14px;margin:0">' +
      message +
      '</p>'
  }

  function hideTemplateShell(target) {
    if (!target) return
    var container = target.closest('main') || target.parentElement || document.body
    if (!container) return
    var children = container.children
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      if (child === target || child.id === 'ai-page-root') continue
      if (child.contains(target)) continue
      child.setAttribute('data-automaio-hidden', 'true')
      child.style.setProperty('display', 'none', 'important')
    }
    document.documentElement.setAttribute('data-automaio-active', 'true')
  }

  function injectScopedCss(css, scopeId) {
    if (!css || !css.trim()) return null
    var id = scopeId || 'automaio-runtime-styles'
    var existing = document.getElementById(id)
    if (existing) existing.remove()
    var style = document.createElement('style')
    style.id = id
    style.textContent = css
    document.head.appendChild(style)
    return style
  }

  function injectStylesheetLinks(urls) {
    if (!urls || !urls.length) return
    for (var i = 0; i < urls.length; i++) {
      var href = urls[i]
      if (!href) continue
      var linkId = 'automaio-stylesheet-' + i
      if (document.getElementById(linkId)) continue
      var link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
  }

  function runIsolatedJs(js) {
    if (!js || !js.trim()) return
    try {
      var fn = new Function(js)
      fn()
    } catch (err) {
      console.warn('[AutomaioRuntime] Script execution skipped:', err)
    }
  }

  function renderSections(target, schema) {
    if (schema.render && schema.render.htmlContent) {
      target.innerHTML = schema.render.htmlContent
      return
    }

    var html = ''
    var sections = schema.sections || []
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      var c = section.content || {}
      html += '<section class="automaio-section automaio-section-' + section.type + '" data-section-id="' + section.id + '">'
      if (c.title) html += '<h2>' + escapeHtml(c.title) + '</h2>'
      if (c.text_0) html += '<p>' + escapeHtml(c.text_0) + '</p>'
      if (c.cta) html += '<a class="automaio-cta" href="#">' + escapeHtml(c.cta) + '</a>'
      html += '</section>'
    }
    target.innerHTML = html
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  async function fetchSchema(apiBase, pageId) {
    var url = apiBase.replace(/\/$/, '') + '/api/runtime/pages/' + encodeURIComponent(pageId)
    var res = await fetch(url, { credentials: 'omit', cache: 'default' })
    if (!res.ok) {
      var errBody = {}
      try {
        errBody = await res.json()
      } catch (e) {}
      throw new Error(errBody.error || 'Failed to load page (' + res.status + ')')
    }
    return res.json()
  }

  async function render(options) {
    var pageId = options && options.pageId
    var targetSelector = (options && options.target) || '#ai-page-root'
    var target =
      typeof targetSelector === 'string'
        ? document.querySelector(targetSelector)
        : targetSelector

    if (!pageId) {
      showError(target, 'Automaio: missing pageId.')
      return
    }
    if (!target) {
      console.warn('[AutomaioRuntime] Target not found:', targetSelector)
      return
    }

    var apiBase = (options && options.apiBase) || getScriptBase()
    if (!apiBase) {
      showError(target, 'Automaio: could not determine API URL.')
      return
    }

    target.setAttribute('data-automaio-page-id', pageId)
    target.setAttribute('data-automaio-loading', 'true')
    target.innerHTML =
      '<p style="font-family:system-ui;padding:2rem;color:#64748b;text-align:center;font-size:14px;margin:0">Loading page from Automaio…</p>'

    try {
      var schema = await fetchSchema(apiBase, pageId)
      var renderBundle = schema.render || {}

      if (!renderBundle.htmlContent && !(schema.sections && schema.sections.length)) {
        throw new Error('Page has no renderable HTML yet — personalize or save HTML in Automaio first.')
      }

      if (renderBundle.stylesheetUrls && renderBundle.stylesheetUrls.length) {
        injectStylesheetLinks(renderBundle.stylesheetUrls)
      }
      injectScopedCss(renderBundle.cssContent, 'automaio-runtime-' + pageId)
      renderSections(target, schema)
      runIsolatedJs(renderBundle.jsContent)

      if (options && options.hideShell !== false) {
        hideTemplateShell(target)
      }

      target.removeAttribute('data-automaio-loading')
      target.setAttribute('data-automaio-rendered', schema.version || '1')
      target.dispatchEvent(
        new CustomEvent('automaio:rendered', { detail: { pageId: pageId, schema: schema } }),
      )
    } catch (err) {
      showError(target, 'Automaio: ' + (err.message || 'render failed'))
      console.error('[AutomaioRuntime]', err)
    }
  }

  global.AutomaioRuntime = {
    version: '1.0.2',
    render: render,
  }

  // Auto-init when root has data-automaio-page-id (manual embed path)
  function autoInit() {
    var root = document.getElementById('ai-page-root') || document.querySelector('[data-automaio-page-id]')
    if (!root) return
    var pageId = root.getAttribute('data-automaio-page-id')
    if (!pageId || !pageId.trim() || pageId.indexOf('{{') !== -1) return
    render({
      pageId: pageId.trim(),
      target: root,
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit)
  } else {
    autoInit()
  }
})(typeof window !== 'undefined' ? window : globalThis)
