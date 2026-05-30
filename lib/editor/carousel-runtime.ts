/** Carousel/slider markup helpers and runtime script injected into pages. */

import type { BlockVariantId } from '@/lib/editor/block-variants'

export const CAROUSEL_CSS = `
[data-am-carousel="true"]{position:relative}
[data-am-carousel-shell]{position:relative;margin:0 auto;width:100%}
[data-am-carousel-shell][data-am-full-width="1"]{max-width:none!important;width:100%}
[data-am-carousel-shell]:not([data-am-full-width="1"]){max-width:920px}
[data-am-carousel-viewport]{overflow:hidden;position:relative;background:#0f172a}
[data-am-carousel-track]{display:flex;transition:transform .45s cubic-bezier(.4,0,.2,1);will-change:transform}
[data-am-carousel-track] [data-am-item]{flex:0 0 100%;min-width:100%;box-sizing:border-box;position:relative;margin:0}
[data-am-carousel-track] [data-am-item] img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
[data-am-carousel-overlay]{pointer-events:none;position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0) 45%,rgba(15,23,42,0.5) 100%)}
[data-am-carousel-nav]{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 16px;box-sizing:border-box;z-index:2}
[data-am-carousel-prev],[data-am-carousel-next]{pointer-events:auto;flex-shrink:0;border-radius:999px;border:0;background:rgba(255,255,255,0.95);color:#0f172a;cursor:pointer;box-shadow:0 4px 20px rgba(15,23,42,0.22);display:inline-flex;align-items:center;justify-content:center;line-height:0;transition:transform .15s ease,background .15s ease}
[data-am-carousel-prev]{margin-right:auto}
[data-am-carousel-next]{margin-left:auto}
[data-am-carousel-prev]:hover,[data-am-carousel-next]:hover{transform:scale(1.08);background:#fff}
[data-am-carousel-prev] .am-icon,[data-am-carousel-next] .am-icon,[data-am-carousel-prev] svg,[data-am-carousel-next] svg{display:block;margin:0 auto}
[data-am-carousel-dots]{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap;padding:0 8px}
[data-am-carousel-dot]{width:8px;height:8px;border-radius:999px;border:0;padding:0;background:#cbd5e1;cursor:pointer;transition:transform .15s ease,background .15s ease,width .2s ease}
[data-am-carousel-dot].active{background:#6366f1;transform:scale(1.15)}
[data-am-carousel="true"][data-am-carousel-variant="classic"] [data-am-carousel-viewport]{border-radius:16px}
[data-am-carousel="true"][data-am-carousel-variant="classic"] [data-am-carousel-track] [data-am-item] img{border-radius:16px}
[data-am-carousel="true"][data-am-carousel-variant="classic"] [data-am-carousel-overlay]{border-radius:16px}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-shell][data-am-full-width="1"] [data-am-carousel-viewport]{border-radius:0}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-viewport]{border-radius:12px;background:#020617}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-track] [data-am-item] img{border-radius:12px;aspect-ratio:21/9}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-overlay]{background:linear-gradient(105deg,rgba(15,23,42,0.75) 0%,rgba(15,23,42,0.15) 55%,transparent 100%)}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-nav]{padding:0 20px}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-prev],[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-next]{background:rgba(15,23,42,0.55);color:#fff;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.12)}
[data-am-carousel="true"][data-am-carousel-variant="cinematic"] [data-am-carousel-dot].active{width:24px;border-radius:6px;background:linear-gradient(90deg,#6366f1,#a855f7)}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-viewport]{border-radius:8px;background:#f8fafc;border:1px solid rgba(15,23,42,0.08)}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-track] [data-am-item] img{border-radius:8px;aspect-ratio:16/10}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-overlay]{display:none}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-nav]{align-items:flex-end;padding:0 12px 14px;justify-content:space-between}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-prev],[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-next]{width:36px!important;height:36px!important;background:#fff;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,0.08)}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-dots]{margin-top:10px}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-dot]{width:6px;height:6px;background:#e2e8f0}
[data-am-carousel="true"][data-am-carousel-variant="minimal"] [data-am-carousel-dot].active{background:#0f172a;transform:none;width:6px}
`

const CAROUSEL_SVG_PREV =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
const CAROUSEL_SVG_NEXT =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>'

/** Sanitizer-safe — uses addEventListener only (no .onclick). */
export const CAROUSEL_JS = `(function(){
function initCarousels(root){
  var scope=root||document;
  scope.querySelectorAll('[data-am-carousel="true"]').forEach(function(section){
    if(section.getAttribute('data-am-carousel-ready')==='1')return;
    var viewport=section.querySelector('[data-am-carousel-viewport]');
    var track=section.querySelector('[data-am-carousel-track]');
    if(!viewport||!track)return;
    var slides=track.querySelectorAll('[data-am-item]');
    if(!slides.length)return;
    section.setAttribute('data-am-carousel-ready','1');
    var idx=0,timer=null;
    var prev=section.querySelector('[data-am-carousel-prev]');
    var next=section.querySelector('[data-am-carousel-next]');
    var dotsWrap=section.querySelector('[data-am-carousel-dots]');
    if(dotsWrap&&!dotsWrap.children.length){
      for(var d=0;d<slides.length;d++){
        var dot=document.createElement('button');
        dot.type='button';
        dot.setAttribute('data-am-carousel-dot',String(d));
        dot.setAttribute('aria-label','Slide '+(d+1));
        if(d===0)dot.className='active';
        dotsWrap.appendChild(dot);
      }
    }
    function syncDots(){
      if(!dotsWrap)return;
      dotsWrap.querySelectorAll('[data-am-carousel-dot]').forEach(function(btn,i){
        btn.classList.toggle('active',i===idx);
      });
    }
    function goTo(i){
      idx=Math.max(0,Math.min(slides.length-1,i));
      var w=viewport.clientWidth||1;
      track.style.transform='translateX(-'+(idx*w)+'px)';
      syncDots();
    }
    function step(delta){goTo(idx+delta);}
    if(prev){prev.addEventListener('click',function(e){e.preventDefault();step(-1);});}
    if(next){next.addEventListener('click',function(e){e.preventDefault();step(1);});}
    if(dotsWrap){dotsWrap.addEventListener('click',function(ev){
      var btn=ev.target.closest('[data-am-carousel-dot]');
      if(!btn)return;
      goTo(parseInt(btn.getAttribute('data-am-carousel-dot')||'0',10)||0);
    });}
    slides.forEach(function(slide){
      if(section.getAttribute('data-am-carousel-variant')==='minimal')return;
      if(!slide.querySelector('[data-am-carousel-overlay]')){
        var ov=document.createElement('div');
        ov.setAttribute('data-am-carousel-overlay','true');
        if(slide.style.position!=='relative')slide.style.position='relative';
        slide.appendChild(ov);
      }
    });
    window.addEventListener('resize',function(){goTo(idx);});
    goTo(0);
    if(section.getAttribute('data-am-carousel-autoplay')!=='0'){
      timer=setInterval(function(){goTo(idx>=slides.length-1?0:idx+1);},5000);
      section.addEventListener('mouseenter',function(){if(timer){clearInterval(timer);timer=null;}});
      section.addEventListener('mouseleave',function(){if(!timer){timer=setInterval(function(){goTo(idx>=slides.length-1?0:idx+1);},5000);}});
    }
  });
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){initCarousels(document);});}
else{initCarousels(document);}
window.__amInitCarousels=initCarousels;
})();`

export type CarouselBuildOptions = {
  variant?: BlockVariantId
  fullWidth?: boolean
  title?: string
}

export function buildCarouselSectionHtml(
  bodyInner: string,
  blockAttrs: string,
  sectionStyle: string,
  options: CarouselBuildOptions | string = 'Image slider',
): string {
  const title = typeof options === 'string' ? options : (options.title ?? 'Image slider')
  const variant =
    typeof options === 'string' ? 'classic' : (options.variant ?? 'classic')
  const fullWidth = typeof options === 'string' ? false : Boolean(options.fullWidth)
  const shellFull = fullWidth ? ' data-am-full-width="1"' : ''
  const variantAttr = ` data-am-carousel-variant="${variant}"`

  return `<section ${blockAttrs} data-am-carousel="true"${variantAttr} style="${sectionStyle}position:relative;">
  <h2 style="text-align:center;margin-bottom:24px;">${title}</h2>
  <div data-am-carousel-shell style="position:relative;width:100%;"${shellFull}>
    <div data-am-carousel-viewport>
      <div data-am-collection-body data-am-carousel-track data-am-columns="1" style="display:flex;gap:0;">
        ${bodyInner}
      </div>
      <div data-am-carousel-nav">
        <button type="button" data-am-carousel-prev aria-label="Previous slide">${CAROUSEL_SVG_PREV}</button>
        <button type="button" data-am-carousel-next aria-label="Next slide">${CAROUSEL_SVG_NEXT}</button>
      </div>
    </div>
    <div data-am-carousel-dots"></div>
  </div>
</section>`
}
