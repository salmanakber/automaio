(function () {
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

  fetch(base + '/api/forms/public/' + token)
    .then(function (r) { return r.json() })
    .then(function (data) {
      if (!data.form) throw new Error('Form not found')
      var form = data.form
      var fields = form.fields || []
      var settings = form.settings || {}

      var style = el('style', null, [])
      style.textContent =
        '.automaio-form{font-family:system-ui,sans-serif;max-width:480px}' +
        '.automaio-form label{display:block;font-size:13px;font-weight:500;margin-bottom:4px;color:#111}' +
        '.automaio-form input,.automaio-form textarea,.automaio-form select{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box}' +
        '.automaio-form button{background:#111;color:#fff;border:0;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;width:100%}' +
        '.automaio-form button:hover{opacity:.9}' +
        '.automaio-form .success{padding:12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;color:#065f46;font-size:14px}' +
        '.automaio-form .error{padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;font-size:14px;margin-bottom:12px}'
      container.appendChild(style)

      var formEl = el('form', { className: 'automaio-form' })
      container.appendChild(formEl)

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
        } else {
          input = el('input', {
            type: field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text',
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
          if (input) payload[field.id] = input.value
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
            formEl.appendChild(el('div', { className: 'success', text: res.message || 'Thank you!' }))
          })
          .catch(function () {
            var err = el('div', { className: 'error', text: 'Something went wrong. Please try again.' })
            formEl.insertBefore(err, formEl.firstChild)
          })
      })
    })
    .catch(function () {
      container.innerHTML = '<p style="color:#991b1b;font-size:13px">Unable to load form.</p>'
    })
})()
