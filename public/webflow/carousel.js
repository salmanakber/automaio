(function () {
  'use strict'

  var LUCIDE = {
    'chevron-left': 'M15 18l-6-6 6-6',
    'chevron-right': 'M9 18l6-6-6-6',
    'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
    'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  }

  function parseIconRef(ref) {
    var t = (ref || '').trim()
    var i = t.indexOf(':')
    if (i <= 0) return { set: 'lucide', name: t || 'chevron-left' }
    return { set: t.slice(0, i), name: t.slice(i + 1) }
  }

  function renderNavIcon(ref, size, color) {
    size = size || 20
    color = color || '#0f172a'
    var ic = parseIconRef(ref)
    if (ic.set === 'material') {
      return (
        '<span class="am-icon" style="font-family:\'Material Symbols Outlined\',sans-serif;font-size:' +
        size +
        'px;color:' +
        color +
        ';line-height:1;">' +
        ic.name +
        '</span>'
      )
    }
    var path = LUCIDE[ic.name] || LUCIDE['chevron-left']
    return (
      '<svg viewBox="0 0 24 24" width="' +
      size +
      '" height="' +
      size +
      '" aria-hidden="true" fill="none" stroke="' +
      color +
      '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="' +
      path +
      '"/></svg>'
    )
  }

  function applyCarouselNavIcons(section) {
    var prev = section.querySelector('[data-am-carousel-prev]')
    var next = section.querySelector('[data-am-carousel-next]')
    if (!prev || !next) return
    var size = parseInt(section.getAttribute('data-am-carousel-icon-size') || '20', 10) || 20
    var color = section.getAttribute('data-am-carousel-icon-color') || '#0f172a'
    var bg = section.getAttribute('data-am-carousel-nav-bg') || 'rgba(255,255,255,0.95)'
    var navSize = parseInt(section.getAttribute('data-am-carousel-nav-size') || '42', 10) || 42
    var prevRef = section.getAttribute('data-am-carousel-prev-icon') || 'lucide:chevron-left'
    var nextRef = section.getAttribute('data-am-carousel-next-icon') || 'lucide:chevron-right'
    prev.innerHTML = renderNavIcon(prevRef, size, color)
    next.innerHTML = renderNavIcon(nextRef, size, color)
    prev.style.background = bg
    next.style.background = bg
    prev.style.width = navSize + 'px'
    prev.style.height = navSize + 'px'
    next.style.width = navSize + 'px'
    next.style.height = navSize + 'px'
    prev.style.display = 'flex'
    next.style.display = 'flex'
    prev.style.alignItems = 'center'
    next.style.alignItems = 'center'
    prev.style.justifyContent = 'center'
    next.style.justifyContent = 'center'
    var nav = section.querySelector('[data-am-carousel-nav]')
    if (nav) nav.style.display = section.getAttribute('data-am-carousel-hide-arrows') === '1' ? 'none' : 'flex'
    var dots = section.querySelector('[data-am-carousel-dots]')
    if (dots) dots.style.display = section.getAttribute('data-am-carousel-hide-dots') === '1' ? 'none' : 'flex'
  }

  function initCarousels(root) {
    var scope = root || document
    scope.querySelectorAll('[data-am-carousel="true"]').forEach(function (section) {
      if (section.getAttribute('data-am-carousel-ready') === '1') return
      var viewport = section.querySelector('[data-am-carousel-viewport]')
      var track = section.querySelector('[data-am-carousel-track]')
      if (!viewport || !track) return
      var slides = track.querySelectorAll('[data-am-item]')
      if (!slides.length) return

      section.setAttribute('data-am-carousel-ready', '1')
      var idx = 0
      var timer = null
      var prev = section.querySelector('[data-am-carousel-prev]')
      var next = section.querySelector('[data-am-carousel-next]')
      var dotsWrap = section.querySelector('[data-am-carousel-dots]')

      if (dotsWrap && !dotsWrap.children.length) {
        for (var d = 0; d < slides.length; d++) {
          var dot = document.createElement('button')
          dot.type = 'button'
          dot.setAttribute('data-am-carousel-dot', String(d))
          dot.setAttribute('aria-label', 'Slide ' + (d + 1))
          if (d === 0) dot.className = 'active'
          dotsWrap.appendChild(dot)
        }
      }

      function syncDots() {
        if (!dotsWrap) return
        dotsWrap.querySelectorAll('[data-am-carousel-dot]').forEach(function (btn, i) {
          btn.classList.toggle('active', i === idx)
        })
      }

      function goTo(i) {
        idx = Math.max(0, Math.min(slides.length - 1, i))
        var w = viewport.clientWidth || 1
        track.style.transform = 'translateX(-' + idx * w + 'px)'
        syncDots()
      }

      function step(delta) {
        goTo(idx + delta)
      }

      if (prev) {
        prev.addEventListener('click', function (e) {
          e.preventDefault()
          step(-1)
        })
      }
      if (next) {
        next.addEventListener('click', function (e) {
          e.preventDefault()
          step(1)
        })
      }
      if (dotsWrap) {
        dotsWrap.addEventListener('click', function (ev) {
          var btn = ev.target.closest('[data-am-carousel-dot]')
          if (!btn) return
          goTo(parseInt(btn.getAttribute('data-am-carousel-dot') || '0', 10) || 0)
        })
      }

      slides.forEach(function (slide) {
        if (!slide.querySelector('[data-am-carousel-overlay]')) {
          var ov = document.createElement('div')
          ov.setAttribute('data-am-carousel-overlay', 'true')
          ov.style.cssText =
            'pointer-events:none;position:absolute;inset:0;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,0) 40%,rgba(15,23,42,0.55) 100%)'
          if (slide.style.position !== 'relative') slide.style.position = 'relative'
          slide.appendChild(ov)
        }
      })

      window.addEventListener('resize', function () {
        goTo(idx)
      })
      applyCarouselNavIcons(section)
      goTo(0)

      if (section.getAttribute('data-am-carousel-autoplay') !== '0') {
        timer = setInterval(function () {
          goTo(idx >= slides.length - 1 ? 0 : idx + 1)
        }, 5000)
        section.addEventListener('mouseenter', function () {
          if (timer) {
            clearInterval(timer)
            timer = null
          }
        })
        section.addEventListener('mouseleave', function () {
          if (!timer) {
            timer = setInterval(function () {
              goTo(idx >= slides.length - 1 ? 0 : idx + 1)
            }, 5000)
          }
        })
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initCarousels(document)
    })
  } else {
    initCarousels(document)
  }

  window.__amInitCarousels = initCarousels
})()
