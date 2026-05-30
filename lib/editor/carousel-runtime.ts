/** Carousel/slider markup helpers and runtime script injected into pages. */

import type { BlockVariantId } from '@/lib/editor/block-variants'

export const CAROUSEL_CSS = `
/* ── Reset & Shell ──────────────────────────────────────────────── */
[data-am-carousel]{position:relative;--c-accent:#6366f1;--c-accent2:#a855f7;--c-thumb-active:#6366f1;--c-dot-active:#6366f1;--c-nav-bg:rgba(255,255,255,0.92);--c-nav-color:#0f172a;--c-overlay:linear-gradient(180deg,transparent 38%,rgba(10,10,20,0.68) 100%)}
[data-am-carousel-shell]{position:relative;margin:0 auto;width:100%}
[data-am-carousel-shell][data-am-full-width="1"]{max-width:none!important;width:100%}
[data-am-carousel-shell]:not([data-am-full-width="1"]){max-width:960px}

/* ── Viewport & Track ───────────────────────────────────────────── */
[data-am-carousel-viewport]{overflow:hidden;position:relative}
[data-am-carousel-track]{display:flex;transition:transform .5s cubic-bezier(.4,0,.2,1);will-change:transform}
[data-am-carousel-track] [data-am-item]{flex:0 0 100%;min-width:100%;box-sizing:border-box;position:relative;margin:0;overflow:hidden}
[data-am-carousel-track] [data-am-item] img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;transition:transform 7s ease}
[data-am-carousel-track] [data-am-item].am-active img{transform:scale(1.05)}

/* ── Overlay ────────────────────────────────────────────────────── */
[data-am-carousel-overlay]{pointer-events:none;position:absolute;inset:0;background:var(--c-overlay)}

/* ── Progress bar ───────────────────────────────────────────────── */
[data-am-carousel-progress]{position:absolute;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,var(--c-accent),var(--c-accent2));border-radius:0 2px 2px 0;z-index:10;transition:width .08s linear}

/* ── Slide counter badge ────────────────────────────────────────── */
[data-am-carousel-counter]{position:absolute;top:14px;right:14px;z-index:8;font-size:12px;font-weight:500;letter-spacing:.06em;color:rgba(255,255,255,.75);background:rgba(0,0,0,.32);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:3px 11px;pointer-events:none;line-height:1.6}

/* ── Caption ────────────────────────────────────────────────────── */
[data-am-carousel-caption]{position:absolute;bottom:0;left:0;right:0;padding:18px 20px;pointer-events:none;z-index:4}
[data-am-carousel-tag]{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:rgba(165,180,252,.95);background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.32);border-radius:999px;padding:2px 9px;margin-bottom:7px}
[data-am-carousel-title]{font-size:16px;font-weight:600;color:#f8fafc;line-height:1.4;margin:0}
[data-am-carousel-sub]{font-size:12px;color:rgba(203,213,225,.8);margin:3px 0 0;font-weight:400}

/* ── Nav buttons ────────────────────────────────────────────────── */
[data-am-carousel-nav]{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:space-between;padding:0 14px;box-sizing:border-box;z-index:6}
[data-am-carousel-prev],[data-am-carousel-next]{pointer-events:auto;flex-shrink:0;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:var(--c-nav-bg);color:var(--c-nav-color);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;line-height:0;transition:transform .15s ease,background .15s ease,border-color .15s ease;padding:0;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
[data-am-carousel-prev]:hover,[data-am-carousel-next]:hover{transform:scale(1.1)}
[data-am-carousel-prev] svg,[data-am-carousel-next] svg{display:block;width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}

/* ── Thumbnail strip ────────────────────────────────────────────── */
[data-am-carousel-thumbs]{display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;-ms-overflow-style:none}
[data-am-carousel-thumbs]::-webkit-scrollbar{display:none}
[data-am-carousel-thumb]{flex:0 0 64px;height:44px;border-radius:8px;overflow:hidden;border:2px solid transparent;cursor:pointer;transition:border-color .2s ease,opacity .2s ease,transform .15s ease;opacity:.55;padding:0;background:none;display:block}
[data-am-carousel-thumb]:hover{opacity:.85;transform:translateY(-1px)}
[data-am-carousel-thumb].am-active{border-color:var(--c-thumb-active);opacity:1;transform:translateY(-2px)}
[data-am-carousel-thumb] img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}

/* ── Dot strip ──────────────────────────────────────────────────── */
[data-am-carousel-dots]{display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;padding:0 6px}
[data-am-carousel-dot]{width:7px;height:7px;border-radius:999px;border:0;padding:0;background:rgba(100,116,139,.35);cursor:pointer;transition:background .2s ease,width .25s ease,transform .15s ease}
[data-am-carousel-dot].am-active{background:var(--c-dot-active);width:22px}
[data-am-carousel-dot]:hover:not(.am-active){background:rgba(100,116,139,.6)}

/* ════════════════════════════════════════════════════════════════
   VARIANT: classic
════════════════════════════════════════════════════════════════ */
[data-am-carousel-variant="classic"] [data-am-carousel-viewport]{border-radius:14px}
[data-am-carousel-variant="classic"] [data-am-carousel-track] [data-am-item] img{border-radius:14px}
[data-am-carousel-variant="classic"] [data-am-carousel-overlay]{border-radius:14px}
[data-am-carousel-variant="classic"] [data-am-carousel-prev],[data-am-carousel-variant="classic"] [data-am-carousel-next]{background:rgba(255,255,255,0.92);color:#0f172a;border-color:rgba(255,255,255,.6)}
[data-am-carousel-variant="classic"] [data-am-carousel-prev]:hover,[data-am-carousel-variant="classic"] [data-am-carousel-next]:hover{background:#fff}

/* ════════════════════════════════════════════════════════════════
   VARIANT: cinematic
════════════════════════════════════════════════════════════════ */
[data-am-carousel-variant="cinematic"][data-am-full-width="1"] [data-am-carousel-viewport]{border-radius:0}
[data-am-carousel-variant="cinematic"] [data-am-carousel-viewport]{border-radius:12px}
[data-am-carousel-variant="cinematic"] [data-am-carousel-track] [data-am-item] img{aspect-ratio:21/9;border-radius:12px}
[data-am-carousel-variant="cinematic"] [data-am-carousel-overlay]{background:linear-gradient(105deg,rgba(10,10,20,.78) 0%,rgba(10,10,20,.12) 55%,transparent 100%);border-radius:12px}
[data-am-carousel-variant="cinematic"] [data-am-carousel-nav]{padding:0 20px}
[data-am-carousel-variant="cinematic"] [data-am-carousel-prev],[data-am-carousel-variant="cinematic"] [data-am-carousel-next]{background:rgba(0,0,0,.4);color:#fff;border-color:rgba(255,255,255,.14)}
[data-am-carousel-variant="cinematic"] [data-am-carousel-prev]:hover,[data-am-carousel-variant="cinematic"] [data-am-carousel-next]:hover{background:rgba(99,102,241,.65);border-color:rgba(99,102,241,.5)}
[data-am-carousel-variant="cinematic"] [data-am-carousel-dot].am-active{width:26px;background:linear-gradient(90deg,#6366f1,#a855f7)}

/* ════════════════════════════════════════════════════════════════
   VARIANT: minimal
════════════════════════════════════════════════════════════════ */
[data-am-carousel-variant="minimal"] [data-am-carousel-viewport]{border-radius:8px;border:1px solid rgba(15,23,42,.1)}
[data-am-carousel-variant="minimal"] [data-am-carousel-track] [data-am-item] img{aspect-ratio:16/10;border-radius:8px}
[data-am-carousel-variant="minimal"] [data-am-carousel-overlay]{display:none}
[data-am-carousel-variant="minimal"] [data-am-carousel-caption]{display:none}
[data-am-carousel-variant="minimal"] [data-am-carousel-prev],[data-am-carousel-variant="minimal"] [data-am-carousel-next]{background:#fff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.06);backdrop-filter:none}
[data-am-carousel-variant="minimal"] [data-am-carousel-prev]:hover,[data-am-carousel-variant="minimal"] [data-am-carousel-next]:hover{background:#f8fafc}
[data-am-carousel-variant="minimal"] [data-am-carousel-dot].am-active{width:7px;background:#0f172a}
[data-am-carousel-variant="minimal"] [data-am-carousel-counter]{display:none}
[data-am-carousel-variant="minimal"] [data-am-carousel-progress]{display:none}
`

const CAROUSEL_SVG_PREV =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>'
const CAROUSEL_SVG_NEXT =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>'

/** Sanitizer-safe — uses addEventListener only (no .onclick). */
export const CAROUSEL_JS = `(function(){
var AUTO_DELAY=5000,PROG_TICK=80;
function initCarousels(root){
  var scope=root||document;
  scope.querySelectorAll('[data-am-carousel="true"]').forEach(function(section){
    if(section.getAttribute('data-am-carousel-ready')==='1')return;
    var viewport=section.querySelector('[data-am-carousel-viewport]');
    var track=section.querySelector('[data-am-carousel-track]');
    if(!viewport||!track)return;
    var slides=Array.from(track.querySelectorAll('[data-am-item]'));
    if(!slides.length)return;
    section.setAttribute('data-am-carousel-ready','1');

    var idx=0,autoTimer=null,progTimer=null,progVal=0;
    var prev=section.querySelector('[data-am-carousel-prev]');
    var next=section.querySelector('[data-am-carousel-next]');
    var dotsWrap=section.querySelector('[data-am-carousel-dots]');
    var thumbsWrap=section.querySelector('[data-am-carousel-thumbs]');
    var counter=section.querySelector('[data-am-carousel-counter]');
    var progBar=section.querySelector('[data-am-carousel-progress]');

    /* build dots */
    if(dotsWrap&&!dotsWrap.children.length){
      slides.forEach(function(_,d){
        var dot=document.createElement('button');
        dot.type='button';
        dot.setAttribute('data-am-carousel-dot',String(d));
        dot.setAttribute('aria-label','Slide '+(d+1));
        if(d===0)dot.className='am-active';
        dotsWrap.appendChild(dot);
      });
    }

    /* build thumbnails from slide images if thumbs container is empty */
    if(thumbsWrap&&!thumbsWrap.children.length){
      slides.forEach(function(slide,t){
        var srcImg=slide.querySelector('img');
        var btn=document.createElement('button');
        btn.type='button';
        btn.setAttribute('data-am-carousel-thumb',String(t));
        btn.setAttribute('aria-label','Go to slide '+(t+1));
        if(t===0)btn.className='am-active';
        if(srcImg){
          var img=document.createElement('img');
          img.src=srcImg.src;
          img.alt='';
          img.setAttribute('loading','lazy');
          btn.appendChild(img);
        }
        thumbsWrap.appendChild(btn);
      });
    }

    /* progress bar */
    function startProg(){
      if(!progBar)return;
      clearInterval(progTimer);
      progVal=0;
      progBar.style.transition='none';
      progBar.style.width='0%';
      requestAnimationFrame(function(){
        progTimer=setInterval(function(){
          progVal+=100/(AUTO_DELAY/PROG_TICK);
          if(progVal>=100){progVal=100;clearInterval(progTimer);}
          progBar.style.transition='width '+PROG_TICK+'ms linear';
          progBar.style.width=Math.min(progVal,100)+'%';
        },PROG_TICK);
      });
    }
    function stopProg(){
      clearInterval(progTimer);
      if(progBar){progBar.style.transition='none';progBar.style.width='0%';}
    }

    function syncUI(){
      /* track position */
      var w=viewport.clientWidth||1;
      track.style.transform='translateX(-'+(idx*w)+'px)';
      /* active states */
      slides.forEach(function(s,i){s.classList.toggle('am-active',i===idx);});
      if(dotsWrap){
        Array.from(dotsWrap.querySelectorAll('[data-am-carousel-dot]')).forEach(function(d,i){
          d.classList.toggle('am-active',i===idx);
        });
      }
      if(thumbsWrap){
        var thumbBtns=Array.from(thumbsWrap.querySelectorAll('[data-am-carousel-thumb]'));
        thumbBtns.forEach(function(b,i){b.classList.toggle('am-active',i===idx);});
        /* scroll active thumb into view */
        if(thumbBtns[idx]){
          thumbBtns[idx].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
        }
      }
      if(counter){counter.textContent=(idx+1)+' \/ '+slides.length;}
    }

    function goTo(i){
      idx=((i%slides.length)+slides.length)%slides.length;
      syncUI();
    }

    function startAuto(){
      clearInterval(autoTimer);
      if(section.getAttribute('data-am-carousel-autoplay')==='0')return;
      autoTimer=setInterval(function(){goTo(idx+1);startProg();},AUTO_DELAY);
      startProg();
    }
    function stopAuto(){clearInterval(autoTimer);autoTimer=null;stopProg();}

    /* Nav */
    if(prev){prev.addEventListener('click',function(e){e.preventDefault();goTo(idx-1);if(section.getAttribute('data-am-carousel-autoplay')!=='0'){startAuto();}});}
    if(next){next.addEventListener('click',function(e){e.preventDefault();goTo(idx+1);if(section.getAttribute('data-am-carousel-autoplay')!=='0'){startAuto();}});}

    /* Dots */
    if(dotsWrap){dotsWrap.addEventListener('click',function(ev){
      var btn=ev.target.closest('[data-am-carousel-dot]');
      if(!btn)return;
      goTo(parseInt(btn.getAttribute('data-am-carousel-dot')||'0',10));
      if(section.getAttribute('data-am-carousel-autoplay')!=='0'){startAuto();}
    });}

    /* Thumbnails */
    if(thumbsWrap){thumbsWrap.addEventListener('click',function(ev){
      var btn=ev.target.closest('[data-am-carousel-thumb]');
      if(!btn)return;
      goTo(parseInt(btn.getAttribute('data-am-carousel-thumb')||'0',10));
      if(section.getAttribute('data-am-carousel-autoplay')!=='0'){startAuto();}
    });}

    /* Hover pause */
    section.addEventListener('mouseenter',stopAuto);
    section.addEventListener('mouseleave',function(){
      if(section.getAttribute('data-am-carousel-autoplay')!=='0'){startAuto();}
    });

    /* Touch/swipe */
    var tx=null;
    viewport.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
    viewport.addEventListener('touchend',function(e){
      if(tx===null)return;
      var dx=e.changedTouches[0].clientX-tx;
      if(Math.abs(dx)>40){goTo(dx<0?idx+1:idx-1);}
      tx=null;
    });

    /* Resize */
    window.addEventListener('resize',function(){syncUI();});

    goTo(0);
    startAuto();
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){initCarousels(document);});
}else{
  initCarousels(document);
}
window.__amInitCarousels=initCarousels;
})();`

export type CarouselBuildOptions = {
  variant?: BlockVariantId
  fullWidth?: boolean
  title?: string
  autoplay?: boolean
  showThumbs?: boolean
  showDots?: boolean
  showCounter?: boolean
  showProgress?: boolean
  showCaption?: boolean
}

export function buildCarouselSectionHtml(
  bodyInner: string,
  blockAttrs: string,
  sectionStyle: string,
  options: CarouselBuildOptions | string = 'Image slider',
): string {
  const isStr = typeof options === 'string'
  const title        = isStr ? options               : (options.title        ?? '')
  const variant      = isStr ? 'classic'             : (options.variant      ?? 'classic')
  const fullWidth    = isStr ? false                 : Boolean(options.fullWidth)
  const autoplay     = isStr ? true                  : (options.autoplay     ?? true)
  const showThumbs   = isStr ? true                  : (options.showThumbs   ?? true)
  const showDots     = isStr ? true                  : (options.showDots     ?? true)
  const showCounter  = isStr ? true                  : (options.showCounter  ?? true)
  const showProgress = isStr ? true                  : (options.showProgress ?? true)
  const showCaption  = isStr ? true                  : (options.showCaption  ?? true)

  const shellFull     = fullWidth ? ' data-am-full-width="1"' : ''
  const variantAttr   = ` data-am-carousel-variant="${variant}"`
  const autoplayAttr  = autoplay ? '' : ' data-am-carousel-autoplay="0"'
  const headingHtml   = title ? `\n  <h2 style="text-align:center;margin-bottom:20px;">${title}</h2>` : ''
  const counterHtml   = showCounter  ? '\n      <span data-am-carousel-counter aria-live="polite"></span>' : ''
  const progressHtml  = showProgress ? '\n      <span data-am-carousel-progress aria-hidden="true"></span>' : ''
  const thumbsHtml    = showThumbs   ? '\n  <div data-am-carousel-thumbs role="list" aria-label="Slide thumbnails"></div>' : ''
  const dotsHtml      = showDots     ? '\n  <div data-am-carousel-dots role="tablist" aria-label="Slides"></div>' : ''

  /* Wrap each [data-am-item] with an overlay + caption placeholder if caption is on */
  const enrichedBody = showCaption
    ? bodyInner
        .replace(
          /(<\s*\[data-am-item\][^>]*>)/gi,
          '$1<div data-am-carousel-overlay aria-hidden="true"></div>\n        <div data-am-carousel-caption></div>\n        ',
        )
    : bodyInner

  return `<section ${blockAttrs} data-am-carousel="true"${variantAttr}${autoplayAttr} style="${sectionStyle}position:relative;">${headingHtml}
  <div data-am-carousel-shell${shellFull} style="position:relative;width:100%;">
    <div data-am-carousel-viewport>${counterHtml}${progressHtml}
      <div data-am-collection-body data-am-carousel-track data-am-columns="1" style="display:flex;gap:0;">
        ${enrichedBody}
      </div>
      <div data-am-carousel-nav>
        <button type="button" data-am-carousel-prev aria-label="Previous slide">${CAROUSEL_SVG_PREV}</button>
        <button type="button" data-am-carousel-next aria-label="Next slide">${CAROUSEL_SVG_NEXT}</button>
      </div>
    </div>${thumbsHtml}${dotsHtml}
  </div>
</section>`
}