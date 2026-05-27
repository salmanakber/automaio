/**
 * Automaio Webflow embed — loads content in an isolated iframe.
 * No HTML/CSS injected into the parent Webflow page.
 * Content renders in a clean blank page inside the iframe (no navbar/footer).
 */
(function () {
  var root = document.getElementById('automaio-root')
  if (!root) return

  function getApiBase() {
    if (root.dataset.automaioApi) return root.dataset.automaioApi.replace(/\/$/, '')

    var scripts = document.querySelectorAll('script[src*="embed.js"]')
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src
      if (src) return src.replace(/\/webflow\/embed\.js.*$/, '')
    }
    return ''
  }

  function showMessage(text, color) {
    root.innerHTML =
      '<p style="font-family:system-ui;padding:2rem;color:' +
      (color || '#64748b') +
      ';text-align:center;font-size:14px;margin:0">' +
      text +
      '</p>'
  }

  function mountIframe(src, title) {
    root.innerHTML = ''
    var iframe = document.createElement('iframe')
    iframe.src = src
    iframe.title = title || 'Automaio content'
    iframe.loading = 'lazy'
    iframe.setAttribute(
      'style',
      'width:100%;border:0;display:block;min-height:320px;background:transparent;overflow:hidden;',
    )
    iframe.setAttribute('allow', 'fullscreen')
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups')
    root.appendChild(iframe)

    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'automaio-embed-resize') return
      if (typeof e.data.height === 'number' && e.data.height > 0) {
        iframe.style.height = e.data.height + 'px'
      }
    })
  }

  var base = getApiBase()
  if (!base) {
    showMessage(
      'Automaio: could not determine API URL. Re-copy the embed snippet from your Automaio project page.',
      '#b45309',
    )
    return
  }

  var projectId = root.dataset.automaioProjectId
  if (projectId) {
    mountIframe(
      base + '/webflow/embed/project/' + encodeURIComponent(projectId),
      'Automaio project',
    )
    return
  }

  var siteId = root.dataset.automaioSiteId
  var slug = root.dataset.automaioSlug
  if (siteId && slug) {
    mountIframe(
      base +
        '/webflow/embed/view?siteId=' +
        encodeURIComponent(siteId) +
        '&slug=' +
        encodeURIComponent(slug),
      'Automaio content',
    )
    return
  }

  if (siteId) {
    var pathSlug = location.pathname.split('/').filter(Boolean).pop()
    if (pathSlug) {
      mountIframe(
        base +
          '/webflow/embed/view?siteId=' +
          encodeURIComponent(siteId) +
          '&slug=' +
          encodeURIComponent(pathSlug),
        'Automaio content',
      )
      return
    }
  }

  showMessage(
    'Automaio: publish from the dashboard first.',
  )
})()
