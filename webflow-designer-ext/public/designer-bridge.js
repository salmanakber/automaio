/**
 * Webflow Designer bridge — idempotent render embed install for direct HTML/CSS mode.
 * Compatible with Designer API v2 (apiVersion "2" in webflow.json).
 */
;(function () {
  var RENDER_MARKER = 'data-automaio-render-embed'
  var RENDER_VERSION = 'v1'
  var WEBFLOW_WAIT_MS = 30000

  var EMBED_MARKUP =
    '<!-- Automaio direct render (' +
    RENDER_MARKER +
    '="' +
    RENDER_VERSION +
    '") -->\n' +
    '<div class="automaio-render-root" ' +
    RENDER_MARKER +
    '="' +
    RENDER_VERSION +
    '">\n' +
    '  <style>\n' +
    '{{wf {"path":"generated-css","type":"PlainText"} }}\n' +
    '  </style>\n\n' +
    '{{wf {"path":"generated-html","type":"PlainText"} }}\n' +
    '</div>'

  function getWebflowApi() {
    try {
      if (typeof webflow !== 'undefined' && webflow) return webflow
    } catch (e) {}
    try {
      if (typeof window !== 'undefined' && window.webflow) return window.webflow
    } catch (e) {}
    return null
  }

  function hasWebflowApi(wf) {
    return !!(
      wf &&
      (typeof wf.getCurrentPage === 'function' ||
        typeof wf.getAllElements === 'function' ||
        typeof wf.getSelectedElement === 'function')
    )
  }

  function waitForWebflowApi(maxMs) {
    return new Promise(function (resolve) {
      var elapsed = 0
      var interval = 100

      function tick() {
        var wf = getWebflowApi()
        if (hasWebflowApi(wf)) {
          resolve(wf)
          return
        }
        elapsed += interval
        if (elapsed >= maxMs) {
          resolve(null)
          return
        }
        setTimeout(tick, interval)
      }

      tick()
    })
  }

  function whenWebflowReady(wf) {
    if (wf && typeof wf.ready === 'function') {
      return wf.ready()
    }
    return Promise.resolve()
  }

  function notifyWith(wf, message, type) {
    try {
      if (wf && wf.notify) {
        wf.notify({ type: type || 'Info', message: message })
      }
    } catch (e) {}
    console.log('[Automaio Designer]', message)
  }

  function isInsecureDevShell() {
    try {
      return window.location.protocol === 'http:' && window.location.hostname !== 'localhost'
    } catch (e) {
      return false
    }
  }

  function isLikelyDesignerContext() {
    try {
      if (window.parent && window.parent !== window) return true
      if (document.referrer && document.referrer.indexOf('webflow.com') !== -1) return true
    } catch (e) {}
    return false
  }

  async function resolveWebflowApi(options) {
    if (isInsecureDevShell()) return null

    var wf = getWebflowApi()
    if (hasWebflowApi(wf)) return wf
    var timeoutMs = (options && options.timeoutMs) || WEBFLOW_WAIT_MS
    return waitForWebflowApi(timeoutMs)
  }

  async function getBridgeStatus() {
    var wf = getWebflowApi()
    if (!hasWebflowApi(wf)) {
      wf = await waitForWebflowApi(1500)
    }

    var insecureDevShell = isInsecureDevShell()
    var inDesignerContext = isLikelyDesignerContext()

    if (insecureDevShell) {
      return {
        webflowAvailable: false,
        insecureDevShell: true,
        inDesignerContext: inDesignerContext,
        shellOrigin: window.location.origin,
        hint: 'HTTP dev shell — Webflow will not inject the Designer API',
      }
    }

    if (!hasWebflowApi(wf)) {
      return {
        webflowAvailable: false,
        insecureDevShell: false,
        inDesignerContext: inDesignerContext,
        shellOrigin: window.location.origin,
        hint: inDesignerContext
          ? 'Webflow API not injected yet'
          : 'Not running inside Webflow Designer',
      }
    }

    return {
      webflowAvailable: true,
      insecureDevShell: false,
      inDesignerContext: inDesignerContext,
      shellOrigin: window.location.origin,
      hint: 'ready',
    }
  }

  async function findAppendTarget(wf) {
    try {
      if (wf.getRootElement) {
        var root = await wf.getRootElement()
        if (root && root.children) return root
      }
    } catch (e) {}

    try {
      var selected = await wf.getSelectedElement()
      if (selected && selected.children) return selected
    } catch (e) {}

    try {
      var all = await wf.getAllElements()
      if (all && all.length) {
        for (var i = 0; i < all.length; i++) {
          var el = all[i]
          if (!el || !el.children) continue
          try {
            if (el.type === 'Body') return el
          } catch (e) {}
        }
        for (var j = 0; j < all.length; j++) {
          if (all[j] && all[j].children) return all[j]
        }
      }
    } catch (e) {}

    return null
  }

  async function embedContainsMarker(element) {
    try {
      if (element.getCustomAttribute && (await element.getCustomAttribute(RENDER_MARKER))) return true
    } catch (e) {}
    try {
      if (element.getAttribute && (await element.getAttribute(RENDER_MARKER))) return true
    } catch (e) {}
    try {
      var html = element.getInnerHTML && (await element.getInnerHTML())
      if (html && html.indexOf(RENDER_MARKER) !== -1) return true
    } catch (e) {}
    try {
      var text = element.getTextContent && (await element.getTextContent())
      if (text && text.indexOf(RENDER_MARKER) !== -1) return true
    } catch (e) {}
    return false
  }

  async function findExistingRenderEmbed(wf) {
    try {
      var all = await wf.getAllElements()
      for (var i = 0; i < (all || []).length; i++) {
        if (await embedContainsMarker(all[i])) return all[i]
      }
    } catch (e) {}
    return null
  }

  async function trySetEmbedMarkup(embed, wf) {
    if (!embed) return false
    try {
      if (embed.setInnerHTML) {
        await embed.setInnerHTML(EMBED_MARKUP)
        return true
      }
    } catch (e) {}
    try {
      if (embed.setHTML) {
        await embed.setHTML(EMBED_MARKUP)
        return true
      }
    } catch (e) {}
    try {
      if (embed.setTextContent) {
        await embed.setTextContent(EMBED_MARKUP)
        return true
      }
    } catch (e) {}
    notifyWith(
      wf,
      'Code Embed added — open Code Embed settings and paste the SEO snippet from the Automaio panel.',
      'Info',
    )
    return true
  }

  async function appendRenderEmbed(wf, target) {
    var preset = wf.elementPresets || {}

    if (preset.HtmlEmbed && target.append) {
      try {
        var htmlEmbed = await target.append(preset.HtmlEmbed)
        if (htmlEmbed) {
          await trySetEmbedMarkup(htmlEmbed, wf)
          return true
        }
      } catch (e) {}
    }

    if (preset.Embed && wf.elementBuilder) {
      try {
        var legacyEmbed = wf.elementBuilder(preset.Embed)
        await trySetEmbedMarkup(legacyEmbed, wf)
        await target.append(legacyEmbed)
        return true
      } catch (e) {}
    }

    if (preset.DOM) {
      try {
        if (wf.elementBuilder) {
          var builtDom = wf.elementBuilder(preset.DOM)
          builtDom.setTag('div')
          builtDom.setAttribute('class', 'automaio-render-root')
          builtDom.setAttribute(RENDER_MARKER, RENDER_VERSION)
          await target.append(builtDom)
          notifyWith(
            wf,
            'Added render container — paste the SEO embed snippet from the Automaio panel.',
            'Info',
          )
          return true
        }
        if (target.append) {
          var dom = await target.append(preset.DOM)
          if (dom) {
            if (dom.setTag) await dom.setTag('div')
            if (dom.setAttribute) {
              await dom.setAttribute('class', 'automaio-render-root')
              await dom.setAttribute(RENDER_MARKER, RENDER_VERSION)
            }
            notifyWith(
              wf,
              'Added render container — paste the SEO embed snippet from the Automaio panel.',
              'Info',
            )
            return true
          }
        }
      } catch (e) {}
    }

    if (preset.Section && target.append) {
      try {
        await target.append(preset.Section)
        return true
      } catch (e) {}
    }

    return false
  }

  async function assertCmsTemplatePage(page) {
    try {
      if (page.getKind) {
        var kind = await page.getKind()
        if (kind !== 'cms') {
          return {
            ok: false,
            error: 'not a cms template page',
            alreadyInstalled: false,
          }
        }
      }
      if (page.getCollectionID || page.getCollectionId) {
        var getCollectionId = page.getCollectionID || page.getCollectionId
        await getCollectionId.call(page)
      }
    } catch (e) {
      return {
        ok: false,
        error: 'not a cms template page',
        alreadyInstalled: false,
      }
    }
    return null
  }

  async function ensureRenderEmbed(options) {
    var wf = await resolveWebflowApi(options)
    if (isInsecureDevShell()) {
      return {
        ok: false,
        error: 'insecure dev shell',
        alreadyInstalled: false,
      }
    }

    if (!hasWebflowApi(wf)) {
      return {
        ok: false,
        error: isLikelyDesignerContext() ? 'webflow API unavailable' : 'not in designer',
        alreadyInstalled: false,
      }
    }

    await whenWebflowReady(wf)

    try {
      var existing = await findExistingRenderEmbed(wf)
      if (existing) {
        return { ok: true, alreadyInstalled: true, created: false }
      }

      var page = await wf.getCurrentPage()
      if (!page) {
        return { ok: false, error: 'no current page', alreadyInstalled: false }
      }

      var cmsCheck = await assertCmsTemplatePage(page)
      if (cmsCheck) return cmsCheck

      var target = await findAppendTarget(wf)
      if (!target) {
        return { ok: false, error: 'no append target', alreadyInstalled: false }
      }

      var added = await appendRenderEmbed(wf, target)
      if (!added) {
        return { ok: false, error: 'append failed', alreadyInstalled: false }
      }

      notifyWith(
        wf,
        'Direct render embed installed. HTML/CSS update automatically from CMS on each publish.',
        'Success',
      )
      return { ok: true, alreadyInstalled: false, created: true }
    } catch (err) {
      var msg = err && err.message ? err.message : String(err)
      return { ok: false, error: msg, alreadyInstalled: false }
    }
  }

  async function installTemplateShell() {
    var result = await ensureRenderEmbed({})
    if (!result.ok) {
      var wf = getWebflowApi()
      var userMessage
      if (result.error === 'no append target') {
        userMessage = 'Select Body in Navigator, then retry Install template shell.'
      } else if (result.error === 'not a cms template page') {
        userMessage =
          'Open your CMS collection template first (Pages → Collection pages → your template).'
      } else if (result.error === 'insecure dev shell') {
        userMessage =
          'Dev server is HTTP — Webflow will not inject the Designer API. Upload bundle.zip and use Launch App, or run webflow extension serve on your computer.'
      } else if (result.error === 'not in designer') {
        userMessage = 'Open Automaio from Webflow Designer (Apps panel), not in a browser tab.'
      } else if (result.error === 'webflow API unavailable') {
        userMessage =
          'Webflow Designer API not ready — close Automaio, reopen it from the Apps panel, then retry.'
      } else {
        userMessage = 'Install failed: ' + (result.error || 'unknown')
      }
      notifyWith(wf, userMessage, 'Error')
    }
    return result
  }

  window.AutomaioDesignerBridge = {
    ensureRenderEmbed: ensureRenderEmbed,
    installTemplateShell: installTemplateShell,
    getBridgeStatus: getBridgeStatus,
  }

  function handleResult(event, result) {
    try {
      if (event.source && event.source.postMessage) {
        event.source.postMessage(
          { type: event.resultType, result: result },
          event.origin || '*',
        )
      }
    } catch (e) {}
  }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || !data.type) return

    if (data.type === 'automaio-install-template-shell') {
      installTemplateShell().then(function (result) {
        handleResult(
          {
            source: event.source,
            origin: event.origin,
            resultType: 'automaio-install-template-shell-result',
          },
          result,
        )
      })
    }

    if (data.type === 'automaio-sync-render-embed') {
      ensureRenderEmbed(data).then(function (result) {
        handleResult(
          {
            source: event.source,
            origin: event.origin,
            resultType: 'automaio-sync-render-embed-result',
          },
          result,
        )
      })
    }

    if (data.type === 'automaio-bridge-status-request') {
      getBridgeStatus().then(function (status) {
        handleResult(
          {
            source: event.source,
            origin: event.origin,
            resultType: 'automaio-bridge-status-result',
          },
          status,
        )
      })
    }
  })

  resolveWebflowApi({ timeoutMs: WEBFLOW_WAIT_MS }).then(function (wf) {
    if (hasWebflowApi(wf)) {
      console.info('[Automaio] Designer bridge ready — render embed sync available.')
    }
  })
})()
