/**
 * Webflow Designer bridge — installs canvas shell on collection templates.
 * Webflow returns 404 for CMS item URLs when the collection template canvas is empty.
 */
;(function () {
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

        var preset = webflow.elementPresets
        var added = false

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
            root.setAttribute('style', 'min-height:1px;width:100%')

            var wrap = main.append(preset.DOM)
            wrap.setTag('div')
            wrap.setAttribute('class', 'ai-wrapper')
            wrap.setAttribute('data-automaio-split', '1')
            wrap.setAttribute('style', 'min-height:1px;width:100%')

            await target.append(main)
            added = true
          } catch (e) {}
        }

        if (!added && preset && preset.Section) {
          try {
            await target.append(preset.Section)
            added = true
          } catch (e) {}
        }

        if (!added && preset && preset.DivBlock) {
          try {
            await target.append(preset.DivBlock)
            added = true
          } catch (e) {}
        }

        if (!added) {
          notify('Could not add elements — select Body in Navigator and retry.', 'Error')
          return { ok: false, error: 'append failed' }
        }

        notify(
          'Template shell installed. Now: Settings (gear) → Publish settings ON → Publish site in Webflow.',
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
