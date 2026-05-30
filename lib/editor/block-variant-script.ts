import { VARIANT_MAP } from '@/lib/editor/block-variants'
import { getVariantInnerHtml } from '@/lib/editor/block-variant-html'

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '')
}

function buildAmVariantHtmlFunction(): string {
  const widgetBlocks: string[] = []
  for (const widget of Object.keys(VARIANT_MAP)) {
    if (widget === 'carousel') continue
    const options = VARIANT_MAP[widget]
    if (!options?.length) continue

    const branches: string[] = []
    for (const opt of options) {
      const html = getVariantInnerHtml(widget, opt.id)
      if (html) branches.push(`if(v==='${opt.id}')return '${esc(html)}';`)
    }
    const fallback = getVariantInnerHtml(widget, options[0].id)
    if (!branches.length || !fallback) continue
    widgetBlocks.push(`if(widget==='${widget}'){${branches.join('')}return '${esc(fallback)}';}`)
  }

  return `function AM_VARIANT_HTML(widget,variant){
  var v=variant||'';
  ${widgetBlocks.join('\n  ')}
  return '';
}`
}

/** Injected into the visual editor iframe for live variant switching. */
export const BLOCK_VARIANT_APPLY_SCRIPT = `
${buildAmVariantHtmlFunction()}
function applyBlockVariant(el,variant){
  if(!el||!variant)return;
  var w=el.getAttribute('data-am-widget')||'';
  var html=AM_VARIANT_HTML(w,variant);
  if(!html)return;
  snapshotEl(el);
  el.setAttribute('data-am-block-variant',variant);
  el.innerHTML=html;
  scanEditable();
  if(w==='carousel'||el.getAttribute('data-am-carousel')==='true'){
    el.removeAttribute('data-am-carousel-ready');
    initCarousels();
    applyCarouselNavIcons(el);
  }
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}
function applyCarouselShell(el,opts){
  if(!el)return;
  var shell=el.querySelector('[data-am-carousel-shell]');
  if(shell){
    if(opts.fullWidth!=null){
      if(opts.fullWidth){shell.setAttribute('data-am-full-width','1');shell.style.maxWidth='none';}
      else{shell.removeAttribute('data-am-full-width');shell.style.maxWidth='';}
      el.setAttribute('data-am-carousel-full-width',opts.fullWidth?'1':'0');
    }
  }
  if(opts.variant!=null){
    el.setAttribute('data-am-carousel-variant',opts.variant);
    el.querySelectorAll('[data-am-carousel-overlay]').forEach(function(ov){ov.remove();});
  }
}
`
