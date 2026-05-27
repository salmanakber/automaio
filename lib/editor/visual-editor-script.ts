/** Injected into iframe for ProjectVisualEditor */
export const VISUAL_EDITOR_SCRIPT = `(function(){
function skip(n){return n.closest('style,script,noscript,svg,path,iframe,#am-tb');}
function isLeafText(el){
  var ch=el.childNodes,i;
  for(i=0;i<ch.length;i++){if(ch[i].nodeType===1&&ch[i].tagName!=='BR')return false;}
  return (el.textContent||'').trim().length>0;
}
var idx=0;
document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,button,li,td,th,blockquote,label,figcaption,span,div').forEach(function(e){
  if(skip(e)||e.closest('[data-am-id]'))return;
  if(isLeafText(e)&&e.textContent.trim().length>0){
    e.setAttribute('data-am-id',String(idx++));
    e.setAttribute('data-am-kind','text');
  }
});
document.querySelectorAll('a[href]').forEach(function(e){
  if(skip(e)||e.closest('[data-am-id]'))return;
  e.setAttribute('data-am-id',String(idx++));
  e.setAttribute('data-am-kind','link');
});
document.querySelectorAll('img').forEach(function(e){
  if(skip(e)||e.closest('[data-am-id]'))return;
  e.setAttribute('data-am-id',String(idx++));
  e.setAttribute('data-am-kind','image');
});
document.querySelectorAll('pre,code').forEach(function(e){
  if(skip(e)||e.closest('[data-am-id]'))return;
  if((e.textContent||'').trim().length>0){
    e.setAttribute('data-am-id',String(idx++));
    e.setAttribute('data-am-kind','code');
  }
});
var tb=document.createElement('div');tb.id='am-tb';
tb.innerHTML='<div id="am-tb-inner">'+
  '<button class="am-ai" data-a="ai">\\u2728 AI</button>'+
  '<button data-a="edit">\\u270F Edit</button>'+
  '<button class="am-del" data-a="delete">\\u2715 Del</button>'+
  '<button class="am-done" data-a="done">\\u2713</button></div>';
document.body.appendChild(tb);
var act=null;
function pos(){
  if(!act){tb.style.display='none';return;}
  var r=act.getBoundingClientRect();
  tb.style.display='block';
  var t=r.top-46;if(t<4)t=r.bottom+6;
  tb.style.top=t+'px';tb.style.left=Math.max(4,r.left)+'px';
}
function payloadFor(el){
  var kind=el.getAttribute('data-am-kind')||'text';
  var p={type:'am-updated',id:el.getAttribute('data-am-id'),tag:el.tagName.toLowerCase(),kind:kind};
  if(kind==='image'){p.src=el.src;p.alt=el.alt||'';}
  else if(kind==='link'){p.href=el.getAttribute('href')||'';p.text=el.textContent;}
  else if(kind==='code'){p.text=el.textContent;}
  else{p.text=el.textContent;}
  return p;
}
function notifyUpd(el){window.parent.postMessage(payloadFor(el),'*');}
function desel(){
  if(!act)return;
  act.contentEditable='false';act.classList.remove('am-active');
  notifyUpd(act);act=null;tb.style.display='none';
}
function focusElement(el){
  try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});}catch(e){}
  var r=el.getBoundingClientRect();
  var kind=el.getAttribute('data-am-kind')||'text';
  var msg={type:'am-selected',id:el.getAttribute('data-am-id'),tag:el.tagName.toLowerCase(),kind:kind,
    rect:{top:r.top,left:r.left,width:r.width,height:r.height}};
  if(kind==='image'){msg.src=el.src;msg.alt=el.alt||'';msg.text=el.alt||'';}
  else if(kind==='link'){msg.href=el.getAttribute('href')||'';msg.text=el.textContent;}
  else if(kind==='code'){msg.text=el.textContent;}
  else{msg.text=el.textContent;}
  window.parent.postMessage(msg,'*');
}
function sel(el){
  if(act&&act!==el)desel();
  act=el;el.classList.add('am-active');pos();focusElement(el);
}
function setTextPreserve(el,text){
  if(!el.querySelector(':scope > *')){el.textContent=text;return;}
  var nodes=[];
  function walk(n){for(var i=0;i<n.childNodes.length;i++){var x=n.childNodes[i];if(x.nodeType===3)nodes.push(x);else if(x.nodeType===1)walk(x);}}
  walk(el);
  if(!nodes.length){el.textContent=text;return;}
  nodes.forEach(function(n){n.textContent='';});
  nodes[0].textContent=text;
}
document.addEventListener('click',function(ev){
  if(ev.target.closest('#am-tb'))return;
  var t=ev.target.closest('[data-am-id]');
  if(t){ev.preventDefault();ev.stopPropagation();sel(t);}
  else desel();
});
tb.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b||!act)return;
  var a=b.getAttribute('data-a');
  var kind=act.getAttribute('data-am-kind')||'text';
  if(a==='edit'){
    if(kind==='image'){window.parent.postMessage({type:'am-image-req',id:act.getAttribute('data-am-id'),src:act.src,alt:act.alt||''},'*');}
    else if(kind==='link'){window.parent.postMessage({type:'am-link-req',id:act.getAttribute('data-am-id'),href:act.getAttribute('href')||'',text:act.textContent},'*');}
    else if(kind==='code'){window.parent.postMessage({type:'am-code-req',id:act.getAttribute('data-am-id'),text:act.textContent,tag:act.tagName.toLowerCase()},'*');}
    else{act.contentEditable='true';act.focus();}
  }
  if(a==='ai'&&(kind==='text'||kind==='link')){window.parent.postMessage({type:'am-ai-req',id:act.getAttribute('data-am-id'),text:act.textContent,tag:act.tagName.toLowerCase()},'*');}
  if(a==='delete'){
    var did=act.getAttribute('data-am-id');
    act.remove();act=null;tb.style.display='none';
    window.parent.postMessage({type:'am-deleted',id:did},'*');
  }
  if(a==='done')desel();
});
document.addEventListener('input',function(){if(act)notifyUpd(act);});
window.addEventListener('message',function(ev){
  var d=ev.data;if(!d)return;
  if(d.type==='am-ai-result'&&d.id!=null){
    var el=document.querySelector('[data-am-id="'+d.id+'"]');
    if(el){setTextPreserve(el,d.text);notifyUpd(el);}
  }
  if(d.type==='am-bulk-update'&&d.updates){
    for(var k in d.updates){
      var el=document.querySelector('[data-am-id="'+k+'"]');
      if(el&&el.getAttribute('data-am-kind')==='text')setTextPreserve(el,d.updates[k]);
    }
    window.parent.postMessage({type:'am-bulk-done'},'*');
  }
  if(d.type==='am-image-update'&&d.id){
    var img=document.querySelector('[data-am-id="'+d.id+'"]');
    if(img&&img.tagName==='IMG'){if(d.src)img.src=d.src;if(d.alt!=null)img.alt=d.alt;notifyUpd(img);}
  }
  if(d.type==='am-link-update'&&d.id){
    var a=document.querySelector('[data-am-id="'+d.id+'"]');
    if(a&&a.tagName==='A'){if(d.href!=null)a.setAttribute('href',d.href);if(d.text!=null)a.textContent=d.text;notifyUpd(a);}
  }
  if(d.type==='am-code-update'&&d.id){
    var code=document.querySelector('[data-am-id="'+d.id+'"]');
    if(code){code.textContent=d.text;notifyUpd(code);}
  }
  if(d.type==='am-get-text'){
    var r={};
    document.querySelectorAll('[data-am-id][data-am-kind="text"],[data-am-id][data-am-kind="link"]').forEach(function(el){
      r[el.getAttribute('data-am-id')]={text:el.textContent,tag:el.tagName.toLowerCase(),kind:el.getAttribute('data-am-kind')};
    });
    window.parent.postMessage({type:'am-all-text',elements:r},'*');
  }
  if(d.type==='am-delete-external'&&d.id){
    var delEl=document.querySelector('[data-am-id="'+d.id+'"]');
    if(delEl){delEl.remove();window.parent.postMessage({type:'am-deleted',id:d.id},'*');}
  }
  if(d.type==='am-get-html'){
    var c=document.documentElement.cloneNode(true);
    c.querySelectorAll('#am-tb,[data-am-editor]').forEach(function(x){x.remove();});
    c.querySelectorAll('script').forEach(function(x){if((x.textContent||'').indexOf('data-am-id')>-1)x.remove();});
    c.querySelectorAll('[data-am-id]').forEach(function(x){
      x.removeAttribute('data-am-id');x.removeAttribute('data-am-kind');
      x.removeAttribute('contenteditable');x.classList.remove('am-active');
    });
    window.parent.postMessage({type:'am-clean-html',html:'<!DOCTYPE html>\\n'+c.outerHTML},'*');
  }
});
window.addEventListener('scroll',pos);window.addEventListener('resize',pos);
window.parent.postMessage({type:'am-ready',count:idx},'*');
})();`
