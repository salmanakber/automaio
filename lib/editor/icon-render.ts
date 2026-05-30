import {
  getBootstrapPathMap,
  getLucidePathMap,
  parseIconRef,
  type IconSetId,
} from '@/lib/editor/icon-catalog'

export type IconRenderOptions = {
  size?: number
  color?: string
  className?: string
}

/** Render icon markup for canvas / export (preserves data-am-icon attrs). */
export function renderIconHtml(ref: string, opts: IconRenderOptions = {}): string {
  const { set, name } = parseIconRef(ref)
  const size = opts.size ?? 24
  const color = opts.color ?? 'currentColor'
  const style = `display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;color:${color};`

  if (set === 'material') {
    return `<span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="${name}" class="am-icon" style="${style}font-family:'Material Symbols Outlined',sans-serif;font-size:${size}px;font-variation-settings:'FILL' 0,'wght' 400;line-height:1;">${name}</span>`
  }

  const path =
    set === 'lucide'
      ? getLucidePathMap()[name]
      : set === 'bootstrap'
        ? getBootstrapPathMap()[name]
        : undefined

  if (!path) {
    return `<span data-am-icon="true" data-am-icon-set="${set}" data-am-icon-name="${name}" class="am-icon" style="${style}font-size:${Math.round(size * 0.7)}px;">?</span>`
  }

  const fill = set === 'bootstrap' ? 'currentColor' : 'none'
  const stroke = set === 'bootstrap' ? 'none' : 'currentColor'
  const sw = set === 'bootstrap' ? '0' : '2'

  return `<span data-am-icon="true" data-am-icon-set="${set}" data-am-icon-name="${name}" class="am-icon" style="${style}"><svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg></span>`
}

/** Compact runtime helpers injected into the visual editor iframe. */
export function buildIconEditorScript(): string {
  const lucide = JSON.stringify(getLucidePathMap())
  const bootstrap = JSON.stringify(getBootstrapPathMap())
  return `
var AM_LUCIDE=${lucide};
var AM_BOOT=${bootstrap};
function parseIconRef(ref){
  var t=(ref||'').trim(),i=t.indexOf(':');
  if(i<=0)return {set:'lucide',name:t||'chevron-left'};
  var s=t.slice(0,i),n=t.slice(i+1);
  if(s==='material'||s==='lucide'||s==='bootstrap')return {set:s,name:n};
  return {set:'lucide',name:t};
}
function renderIconHtml(ref,size,color){
  size=size||24;color=color||'currentColor';
  var ic=parseIconRef(ref);
  var base='data-am-icon="true" data-am-icon-set="'+ic.set+'" data-am-icon-name="'+ic.name+'" class="am-icon" style="display:inline-flex;align-items:center;justify-content:center;color:'+color+';"';
  if(ic.set==='material'){
    return '<span '+base+' style="display:inline-flex;align-items:center;justify-content:center;font-family:\\'Material Symbols Outlined\\',sans-serif;font-size:'+size+'px;width:'+size+'px;height:'+size+'px;color:'+color+';font-variation-settings:\\'FILL\\' 0,\\'wght\\' 400;line-height:1;">'+ic.name+'</span>';
  }
  var path=ic.set==='lucide'?AM_LUCIDE[ic.name]:AM_BOOT[ic.name];
  if(!path)return '<span '+base+' style="font-size:'+Math.round(size*0.7)+'px;">?</span>';
  var fill=ic.set==='bootstrap'?'currentColor':'none';
  var stroke=ic.set==='bootstrap'?'none':'currentColor';
  var sw=ic.set==='bootstrap'?'0':'2';
  return '<span '+base+'><svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" aria-hidden="true" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg></span>';
}
function applyIconToElement(el,ref,size,color){
  if(!el||!el.parentNode)return;
  var html=renderIconHtml(ref,size,color);
  var wrap=document.createElement('span');
  wrap.innerHTML=html;
  var icon=wrap.firstChild;
  if(!icon)return;
  var id=el.getAttribute('data-am-id');
  var uid=el.getAttribute('data-am-uid');
  if(id)icon.setAttribute('data-am-id',id);
  if(uid)icon.setAttribute('data-am-uid',uid);
  icon.setAttribute('data-am-kind','icon');
  el.parentNode.replaceChild(icon,el);
  if(typeof act!=='undefined'&&act===el)act=icon;
}
function applyCarouselNavIcons(section){
  if(!section)return;
  var prev=section.querySelector('[data-am-carousel-prev]');
  var next=section.querySelector('[data-am-carousel-next]');
  if(!prev||!next)return;
  var size=parseInt(section.getAttribute('data-am-carousel-icon-size')||'20',10)||20;
  var color=section.getAttribute('data-am-carousel-icon-color')||'#0f172a';
  var bg=section.getAttribute('data-am-carousel-nav-bg')||'rgba(255,255,255,0.95)';
  var navSize=parseInt(section.getAttribute('data-am-carousel-nav-size')||'42',10)||42;
  var prevRef=section.getAttribute('data-am-carousel-prev-icon')||'lucide:chevron-left';
  var nextRef=section.getAttribute('data-am-carousel-next-icon')||'lucide:chevron-right';
  prev.innerHTML=renderIconHtml(prevRef,size,color);
  next.innerHTML=renderIconHtml(nextRef,size,color);
  prev.style.background=bg;
  next.style.background=bg;
  prev.style.width=navSize+'px';
  prev.style.height=navSize+'px';
  next.style.width=navSize+'px';
  next.style.height=navSize+'px';
  prev.style.display='flex';
  next.style.display='flex';
  prev.style.alignItems='center';
  next.style.alignItems='center';
  prev.style.justifyContent='center';
  next.style.justifyContent='center';
  var nav=section.querySelector('[data-am-carousel-nav]');
  if(nav){
    nav.style.display=section.getAttribute('data-am-carousel-hide-arrows')==='1'?'none':'flex';
  }
  var dots=section.querySelector('[data-am-carousel-dots]');
  if(dots){
    dots.style.display=section.getAttribute('data-am-carousel-hide-dots')==='1'?'none':'flex';
  }
}
`
}

export const ICON_EDITOR_SCRIPT = buildIconEditorScript()

export const MATERIAL_SYMBOLS_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap'
