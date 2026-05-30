/** Carousel/slider markup helpers and runtime script injected into pages. */

export const CAROUSEL_CSS = `
[data-am-carousel="true"]{position:relative}
[data-am-carousel-viewport]{overflow:hidden;border-radius:16px;position:relative;background:#0f172a}
[data-am-carousel-track]{display:flex;transition:transform .45s cubic-bezier(.4,0,.2,1);will-change:transform}
[data-am-carousel-track] [data-am-item]{flex:0 0 100%;min-width:100%;box-sizing:border-box;position:relative;margin:0}
[data-am-carousel-track] [data-am-item] img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-radius:16px}
[data-am-carousel-overlay]{pointer-events:none;position:absolute;inset:0;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,0) 40%,rgba(15,23,42,0.55) 100%)}
[data-am-carousel-nav]{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:space-between;padding:0 8px}
[data-am-carousel-prev],[data-am-carousel-next]{pointer-events:auto;width:40px;height:40px;border-radius:999px;border:0;background:rgba(255,255,255,0.92);color:#0f172a;font-size:22px;line-height:1;cursor:pointer;box-shadow:0 4px 16px rgba(15,23,42,0.18);display:flex;align-items:center;justify-content:center;transition:transform .15s ease,background .15s ease}
[data-am-carousel-prev]:hover,[data-am-carousel-next]:hover{transform:scale(1.06);background:#fff}
[data-am-carousel-dots]{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap}
[data-am-carousel-dot]{width:8px;height:8px;border-radius:999px;border:0;padding:0;background:#cbd5e1;cursor:pointer;transition:transform .15s ease,background .15s ease}
[data-am-carousel-dot].active{background:#6366f1;transform:scale(1.15)}
`

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
        dot.className='active';
        dot.setAttribute('data-am-carousel-dot',String(d));
        if(d>0)dot.className='';
        dot.setAttribute('aria-label','Slide '+(d+1));
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
    if(prev)prev.onclick=function(){step(-1);};
    if(next)next.onclick=function(){step(1);};
    if(dotsWrap)dotsWrap.onclick=function(ev){
      var btn=ev.target.closest('[data-am-carousel-dot]');
      if(!btn)return;
      goTo(parseInt(btn.getAttribute('data-am-carousel-dot')||'0',10)||0);
    };
    slides.forEach(function(slide){
      if(!slide.querySelector('[data-am-carousel-overlay]')){
        var ov=document.createElement('div');
        ov.className='data-am-carousel-overlay';
        ov.setAttribute('data-am-carousel-overlay','true');
        slide.appendChild(ov);
      }
    });
    window.addEventListener('resize',function(){goTo(idx);});
    goTo(0);
    if(section.getAttribute('data-am-carousel-autoplay')!=='0'){
      timer=setInterval(function(){goTo(idx>=slides.length-1?0:idx+1);},5000);
      section.addEventListener('mouseenter',function(){if(timer)clearInterval(timer);});
      section.addEventListener('mouseleave',function(){timer=setInterval(function(){goTo(idx>=slides.length-1?0:idx+1);},5000);});
    }
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){initCarousels(document);});
else initCarousels(document);
window.__amInitCarousels=initCarousels;
})();`

export function buildCarouselSectionHtml(
  bodyInner: string,
  blockAttrs: string,
  sectionStyle: string,
  title = 'Image slider',
): string {
  return `<section ${blockAttrs} data-am-carousel="true" style="${sectionStyle}position:relative;">
  <h2 style="text-align:center;margin-bottom:24px;">${title}</h2>
  <div data-am-carousel-shell style="position:relative;max-width:920px;margin:0 auto;">
    <div data-am-carousel-viewport>
      <div data-am-collection-body data-am-carousel-track data-am-columns="1" style="display:flex;gap:0;">
        ${bodyInner}
      </div>
    </div>
    <div data-am-carousel-nav">
      <button type="button" data-am-carousel-prev" aria-label="Previous slide">&lsaquo;</button>
      <button type="button" data-am-carousel-next" aria-label="Next slide">&rsaquo;</button>
    </div>
    <div data-am-carousel-dots"></div>
  </div>
</section>`
}
