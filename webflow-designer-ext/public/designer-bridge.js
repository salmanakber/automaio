/**
 * Webflow Designer bridge — idempotent render embed install for direct HTML/CSS mode.
 */
;(function () {
  var RENDER_MARKER = 'data-automaio-render-embed'
  var RENDER_VERSION = 'v1'

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

  function notify(message, type) {
    try {
      if (typeof webflow !== 'undefined' && webflow.notify) {
        webflow.notify({ type: type || 'Info', message: message })
      }
    } catch (e) {}
    console.log('[Automaio Designer]', message)
  }

  async function findAppendTarget() {
    try {
      if (typeof webflow !== 'undefined' && webflow.getRootElement) {
        var root = await webflow.getRootElement()
        if (root && root.children) return root
      }
    } catch (e) {}

    try {
      var selected = await webflow.getSelectedElement()
      if (selected && selected.children) return selected
    } catch (e) {}

    try {
      var all = await webflow.getAllElements()
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

  async function findExistingRenderEmbed() {
    try {
      var all = await webflow.getAllElements()
      for (var i = 0; i < (all || []).length; i++) {
        if (await embedContainsMarker(all[i])) return all[i]
      }
    } catch (e) {}
    return null
  }

  async function appendRenderEmbed(target) {
    var preset = webflow.elementPresets

    if (preset && preset.Embed && webflow.elementBuilder) {
      try {
        var embed = webflow.elementBuilder(preset.Embed)
        if (embed.setInnerHTML) await embed.setInnerHTML(EMBED_MARKUP)
        else if (embed.setHTML) await embed.setHTML(EMBED_MARKUP)
        else if (embed.setTextContent) await embed.setTextContent(EMBED_MARKUP)
        await target.append(embed)
        return true
      } catch (e) {}
    }

    if (preset && preset.DOM && webflow.elementBuilder) {
      try {
        var wrap = webflow.elementBuilder(preset.DOM)
        wrap.setTag('div')
        wrap.setAttribute('class', 'automaio-render-root')
        wrap.setAttribute(RENDER_MARKER, RENDER_VERSION)
        await target.append(wrap)
        notify('Added render container — paste SEO embed from Automaio panel if bindings are missing.', 'Info')
        return true
      } catch (e) {}
    }

    if (preset && preset.Section) {
      try {
        await target.append(preset.Section)
        return true
      } catch (e) {}
    }

    return false
  }

  async function ensureRenderEmbed(options) {
    if (typeof webflow === 'undefined' || !webflow.ready) {
      return { ok: false, error: 'webflow API unavailable', alreadyInstalled: false }
    }

    return webflow.ready().then(async function () {
      try {
        var existing = await findExistingRenderEmbed()
        if (existing) {
          return { ok: true, alreadyInstalled: true, created: false }
        }

        var page = await webflow.getCurrentPage()
        if (!page) {
          return { ok: false, error: 'no current page', alreadyInstalled: false }
        }

        var target = await findAppendTarget()
        if (!target) {
          return { ok: false, error: 'no append target', alreadyInstalled: false }
        }

        var added = await appendRenderEmbed(target)
        if (!added) {
          return { ok: false, error: 'append failed', alreadyInstalled: false }
        }

        notify(
          'Direct render embed installed. HTML/CSS update automatically from CMS on each publish.',
          'Success',
        )
        return { ok: true, alreadyInstalled: false, created: true }
      } catch (err) {
        var msg = err && err.message ? err.message : String(err)
        return { ok: false, error: msg, alreadyInstalled: false }
      }
    })
  }

  async function installTemplateShell() {
    var result = await ensureRenderEmbed({})
    if (!result.ok) {
      notify(
        result.error === 'no append target'
          ? 'Select Body in Navigator, then retry Install template shell.'
          : 'Install failed: ' + (result.error || 'unknown'),
        'Error',
      )
    }
    return result
  }

  window.AutomaioDesignerBridge = {
    ensureRenderEmbed: ensureRenderEmbed,
    installTemplateShell: installTemplateShell,
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
        handleResult({ source: event.source, origin: event.origin, resultType: 'automaio-install-template-shell-result' }, result)
      })
    }

    if (data.type === 'automaio-sync-render-embed') {
      ensureRenderEmbed(data).then(function (result) {
        handleResult({ source: event.source, origin: event.origin, resultType: 'automaio-sync-render-embed-result' }, result)
      })
    }
  })

  if (typeof webflow !== 'undefined' && webflow.ready) {
    webflow.ready().then(function () {
      console.info('[Automaio] Designer bridge ready — render embed sync available.')
    })
  }
})()
