/**
 * Webflow Designer bridge — installs minimal canvas elements on collection templates.
 * Blank collection templates 404 until at least one element exists on the canvas.
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

  async function installTemplateShell() {
    if (typeof webflow === 'undefined' || !webflow.ready) {
      notify('Open this panel inside Webflow Designer to install the template shell.', 'Error')
      return { ok: false, error: 'webflow API unavailable' }
    }

    return webflow.ready().then(async function () {
      try {
        var page = await webflow.getCurrentPage()
        if (!page) {
          notify('Open your Landing pages collection template in the Designer first.', 'Error')
          return { ok: false, error: 'no current page' }
        }

        var collectionId = null
        try {
          if (page.getCollectionID) collectionId = await page.getCollectionID()
        } catch (e) {}

        var preset = webflow.elementPresets.DOM
        var main = webflow.elementBuilder(preset)
        main.setTag('main')
        main.setAttribute('class', 'automaio-cms-shell')
        main.setAttribute('style', 'min-height:1px;width:100%')

        var root = main.append(preset)
        root.setTag('div')
        root.setAttribute('id', 'ai-page-root')
        root.setAttribute('data-automaio-root', 'true')
        root.setAttribute('style', 'min-height:1px;width:100%')

        var wrap = main.append(preset)
        wrap.setTag('div')
        wrap.setAttribute('class', 'ai-wrapper')
        wrap.setAttribute('data-automaio-split', '1')
        wrap.setAttribute('style', 'min-height:1px;width:100%')

        var target = null
        try {
          target = await webflow.getSelectedElement()
        } catch (e) {}

        if (!target) {
          try {
            target = await webflow.getRootElement()
          } catch (e) {}
        }

        if (!target || !target.append) {
          notify(
            'Select the Body element on your collection template, then click Install template shell again.',
            'Error',
          )
          return { ok: false, error: 'no append target' }
        }

        await target.append(main)
        notify(
          'Automaio template shell installed. Publish your site from Webflow Designer so CMS URLs work.',
          'Success',
        )
        return { ok: true, collectionId: collectionId }
      } catch (err) {
        var msg = err && err.message ? err.message : String(err)
        notify('Could not install shell: ' + msg, 'Error')
        return { ok: false, error: msg }
      }
    })
  }

  window.AutomaioDesignerBridge = {
    installTemplateShell: installTemplateShell,
  }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.type !== 'automaio-install-template-shell') return
    installTemplateShell().then(function (result) {
      if (event.source && event.source.postMessage) {
        event.source.postMessage(
          { type: 'automaio-install-template-shell-result', result: result },
          event.origin || '*',
        )
      }
    })
  })
})()
