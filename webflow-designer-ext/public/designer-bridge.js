/**
 * Webflow Designer bridge — installs SEO canvas shell on collection templates.
 * Webflow returns 404 for CMS item URLs when the collection template canvas is empty.
 */
;(function () {
  var SEO_CANVAS_SNIPPET =
    '<!-- Automaio collection template shell -->\n' +
    '<main class="automaio-cms-shell" style="min-height:1px;width:100%">\n' +
    '  <div id="ai-page-root" data-automaio-root="true" style="min-height:1px"></div>\n' +
    '  <div class="ai-wrapper">\n' +
    '    <style>\n' +
    '{{wf {"path":"cssContent","type":"PlainText"} }}\n' +
    '    </style>\n' +
    '{{wf {"path":"htmlContent","type":"PlainText"} }}\n' +
    '  </div>\n' +
    '</main>\n' +
    '<script>\n' +
    '{{wf {"path":"jsContent","type":"PlainText"} }}\n' +
    '</script>'

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

    var selected = null
    try {
      selected = await webflow.getSelectedElement()
    } catch (e) {}

    if (selected && selected.children) return selected

    try {
      var all = await webflow.getAllElements()
      if (all && all.length) {
        for (var i = 0; i < all.length; i++) {
          var el = all[i]
          if (!el || !el.children) continue
          try {
            if (el.type === 'Body') return el
          } catch (e) {}
          try {
            var tag = el.getTag && (await el.getTag())
            if (tag && String(tag).toLowerCase() === 'body') return el
          } catch (e) {}
        }
        for (var j = 0; j < all.length; j++) {
          if (all[j] && all[j].children) return all[j]
        }
      }
    } catch (e) {}

    return null
  }

  async function appendSeoEmbed(target) {
    var preset = webflow.elementPresets

    if (preset && preset.Embed) {
      try {
        var embed = webflow.elementBuilder(preset.Embed)
        if (embed.setInnerHTML) {
          await embed.setInnerHTML(SEO_CANVAS_SNIPPET)
        } else if (embed.setHTML) {
          await embed.setHTML(SEO_CANVAS_SNIPPET)
        } else if (embed.setTextContent) {
          await embed.setTextContent(SEO_CANVAS_SNIPPET)
        }
        await target.append(embed)
        return true
      } catch (e) {}
    }

    if (preset && preset.DOM && webflow.elementBuilder) {
      try {
        var main = webflow.elementBuilder(preset.DOM)
        main.setTag('main')
        main.setAttribute('class', 'automaio-cms-shell')
        main.setAttribute('style', 'min-height:1px;width:100%')

        var root = main.append(preset.DOM)
        root.setTag('div')
        root.setAttribute('id', 'ai-page-root')
        root.setAttribute('data-automaio-root', 'true')

        var wrap = main.append(preset.DOM)
        wrap.setTag('div')
        wrap.setAttribute('class', 'ai-wrapper')
        wrap.setAttribute('data-automaio-split', '1')

        await target.append(main)
        return true
      } catch (e) {}
    }

    if (preset && preset.Section) {
      try {
        await target.append(preset.Section)
        return true
      } catch (e) {}
    }

    if (preset && preset.DivBlock) {
      try {
        await target.append(preset.DivBlock)
        return true
      } catch (e) {}
    }

    return false
  }

  async function installTemplateShell() {
    if (typeof webflow === 'undefined' || !webflow.ready) {
      notify('Open Automaio inside Webflow Designer (Apps panel), not in a browser tab.', 'Error')
      return { ok: false, error: 'webflow API unavailable' }
    }

    return webflow.ready().then(async function () {
      try {
        var page = await webflow.getCurrentPage()
        if (!page) {
          notify('Open your CMS collection template page first (Pages → CMS Collection pages).', 'Error')
          return { ok: false, error: 'no current page' }
        }

        var target = await findAppendTarget()
        if (!target) {
          notify('Click the Body element in the Navigator, then click Install template shell again.', 'Error')
          return { ok: false, error: 'no append target' }
        }

        var added = await appendSeoEmbed(target)

        if (!added) {
          notify('Could not add elements — select Body in Navigator and retry.', 'Error')
          return { ok: false, error: 'append failed' }
        }

        notify(
          'SEO template shell installed (server-side {{wf}} HTML/CSS). Turn Publish settings ON, then publish the site in Webflow.',
          'Success',
        )
        return { ok: true }
      } catch (err) {
        var msg = err && err.message ? err.message : String(err)
        notify('Install failed: ' + msg, 'Error')
        return { ok: false, error: msg }
      }
    })
  }

  window.AutomaioDesignerBridge = { installTemplateShell: installTemplateShell }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.type !== 'automaio-install-template-shell') return
    installTemplateShell().then(function (result) {
      try {
        if (event.source && event.source.postMessage) {
          event.source.postMessage(
            { type: 'automaio-install-template-shell-result', result: result },
            event.origin || '*',
          )
        }
      } catch (e) {}
    })
  })

  if (typeof webflow !== 'undefined' && webflow.ready) {
    webflow.ready().then(function () {
      console.info('[Automaio] Designer bridge ready — use Install template shell in the panel.')
    })
  }
})()
