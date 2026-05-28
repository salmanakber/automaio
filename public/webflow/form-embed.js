(function () {
  'use strict'

  var script = document.currentScript
  if (!script) return

  var token = script.getAttribute('data-form-token')
  if (!token) {
    console.error('[Automaio] Missing data-form-token on form embed script')
    return
  }

  var base = script.src.replace(/\/webflow\/form-embed\.js.*$/, '')
  var containerId = 'automaio-form-' + token.slice(0, 8)
  var container = document.getElementById(containerId)

  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.setAttribute('data-automaio-form-root', 'true')
    script.parentNode.insertBefore(container, script.nextSibling)
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag)
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'className') node.className = attrs[key]
        else if (key === 'text') node.textContent = attrs[key]
        else node.setAttribute(key, attrs[key])
      })
    }
    if (children) children.forEach(function (c) { if (c) node.appendChild(c) })
    return node
  }

  fetch(base + '/api/runtime/forms/' + encodeURIComponent(token))
    .then(function (r) { return r.json() })
    .then(function (schema) {
      if (!schema || schema.error) throw new Error(schema.error || 'Form not found')

      var fields = schema.fields || []
      var settings = schema.settings || {}
      var css = (schema.render && schema.render.cssContent) || ''

      if (css) {
        var style = el('style', null, [])
        style.textContent = css
        document.head.appendChild(style)
      }

      var formEl = el('form', { className: 'automaio-form' })
      container.innerHTML = ''
      container.appendChild(formEl)

      if (schema.name) {
        formEl.appendChild(el('h3', { text: schema.name, className: 'automaio-form-title' }))
      }

      fields.forEach(function (field) {
        var wrap = el('div')
        wrap.appendChild(el('label', { text: field.label + (field.required ? ' *' : '') }))
        var input
        if (field.type === 'textarea') {
          input = el('textarea', { name: field.id, placeholder: field.placeholder || '', rows: '4' })
        } else if (field.type === 'select' && field.options) {
          input = el('select', { name: field.id })
          field.options.forEach(function (opt) {
            input.appendChild(el('option', { value: opt, text: opt }))
          })
        } else if (field.type === 'checkbox') {
          input = el('input', { type: 'checkbox', name: field.id })
        } else {
          input = el('input', {
            type: field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text',
            name: field.id,
            placeholder: field.placeholder || '',
          })
        }
        if (field.required) input.required = true
        wrap.appendChild(input)
        formEl.appendChild(wrap)
      })

      formEl.appendChild(el('button', { type: 'submit', text: 'Submit' }))

      formEl.addEventListener('submit', function (e) {
        e.preventDefault()
        var payload = {}
        fields.forEach(function (field) {
          var input = formEl.querySelector('[name="' + field.id + '"]')
          if (!input) return
          if (field.type === 'checkbox') payload[field.id] = input.checked
          else payload[field.id] = input.value
        })

        fetch(base + '/api/forms/public/' + token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload, sourceUrl: window.location.href }),
        })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res.redirectUrl) {
              window.location.href = res.redirectUrl
              return
            }
            formEl.innerHTML = ''
            formEl.appendChild(el('div', { className: 'success', text: res.message || settings.successMessage || 'Thank you!' }))
          })
          .catch(function () {
            var err = el('div', { className: 'error', text: 'Something went wrong. Please try again.' })
            formEl.insertBefore(err, formEl.firstChild)
          })
      })
    })
    .catch(function () {
      container.innerHTML = '<p style="color:#991b1b;font-size:13px;font-family:system-ui">Unable to load form.</p>'
    })
})()
