/** Injected into iframe for ProjectVisualEditor — enhanced builder mode */
export const VISUAL_EDITOR_SCRIPT = `(function(){
var SKIP_SEL='style,script,noscript,svg,path,iframe,#am-tb,#am-guides,#am-palette';
function skip(n){return n&&n.closest?n.closest(SKIP_SEL):null;}
var BLOCK_TAGS=['div','section','article','header','footer','nav','main','ul','ol','table','form','figure','aside'];
function isBlockTag(t){return BLOCK_TAGS.indexOf(t)>-1;}
function isEditableText(el){
  var tag=el.tagName.toLowerCase();
  if(['style','script','noscript','svg','path','iframe'].indexOf(tag)>-1)return false;
  var ch=el.childNodes,i,hasBlock=false;
  for(i=0;i<ch.length;i++){
    if(ch[i].nodeType===1&&isBlockTag(ch[i].tagName.toLowerCase())){hasBlock=true;break;}
  }
  if(hasBlock)return false;
  return (el.textContent||'').trim().length>0;
}
var idx=0;
function nextId(){return String(idx++);}
function tagEl(el,kind){
  if(skip(el)||el.closest('[data-am-id]'))return;
  el.setAttribute('data-am-id',nextId());
  el.setAttribute('data-am-kind',kind);
}
function scanEditable(){
  var tags='h1,h2,h3,h4,h5,h6,p,button,li,td,th,blockquote,label,figcaption,span,small,strong,em,b,i,a,footer,dt,dd,cite,mark,sub,sup,figcaption';
  document.querySelectorAll(tags).forEach(function(e){
    if(isEditableText(e))tagEl(e,'text');
  });
  document.querySelectorAll('a[href]').forEach(function(e){if(!e.getAttribute('data-am-id'))tagEl(e,'link');});
  document.querySelectorAll('img').forEach(function(e){tagEl(e,'image');});
  document.querySelectorAll('pre,code').forEach(function(e){
    if((e.textContent||'').trim())tagEl(e,'code');
  });
  document.querySelectorAll('section,article,header,footer,nav,main,figure,aside').forEach(function(e){
    if(!e.getAttribute('data-am-id'))tagEl(e,'container');
  });
  document.querySelectorAll('div,ul,ol,table,form').forEach(function(e){
    if(!e.getAttribute('data-am-id')&&!e.closest('[data-am-id]'))tagEl(e,'container');
  });
}
scanEditable();

var undoStack=[],redoStack=[],MAX_UNDO=80;
function pushUndo(entry){
  undoStack.push(entry);
  if(undoStack.length>MAX_UNDO)undoStack.shift();
  redoStack=[];
  postHistory();
}
function postHistory(){
  window.parent.postMessage({type:'am-history',canUndo:undoStack.length>0,canRedo:redoStack.length>0},'*');
}
function snapshotEl(el){
  if(!el||!el.getAttribute('data-am-id'))return;
  pushUndo({kind:'inner',id:el.getAttribute('data-am-id'),html:el.innerHTML,outer:el.outerHTML});
}
function undo(){
  var entry=undoStack.pop();
  if(!entry){postHistory();return;}
  if(entry.kind==='inner'){
    var el=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el){redoStack.push({kind:'inner',id:entry.id,html:el.innerHTML,outer:el.outerHTML});el.innerHTML=entry.html;notifyUpd(el);}
  }else if(entry.kind==='outer'){
    var el2=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el2){redoStack.push({kind:'outer',id:entry.id,html:el2.outerHTML});el2.outerHTML=entry.html;}
  }else if(entry.kind==='delete'){
    var parent=entry.parent;
    if(parent){
      var tmp=document.createElement('div');tmp.innerHTML=entry.html;
      var node=tmp.firstElementChild;
      if(node){
        if(entry.nextSibling&&entry.nextSibling.parentNode===parent)parent.insertBefore(node,entry.nextSibling);
        else parent.appendChild(node);
        scanEditable();
      }
    }
  }else if(entry.kind==='insert'){
    var rm=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(rm){redoStack.push({kind:'insert',id:entry.id,html:entry.html,parent:entry.parent,nextSibling:entry.nextSibling});rm.remove();}
  }
  postHistory();
}
function redo(){
  var entry=redoStack.pop();
  if(!entry){postHistory();return;}
  if(entry.kind==='inner'){
    var el=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el){undoStack.push({kind:'inner',id:entry.id,html:el.innerHTML,outer:el.outerHTML});el.innerHTML=entry.html;notifyUpd(el);}
  }else if(entry.kind==='outer'){
    var el2=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el2){undoStack.push({kind:'outer',id:entry.id,html:el2.outerHTML});el2.outerHTML=entry.html;}
  }else if(entry.kind==='delete'){
    var el3=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el3){undoStack.push({kind:'delete',id:entry.id,html:el3.outerHTML,parent:el3.parentNode,nextSibling:el3.nextSibling});el3.remove();}
  }else if(entry.kind==='insert'){
    var parent=entry.parent;
    if(parent){
      var tmp2=document.createElement('div');tmp2.innerHTML=entry.html;
      var node2=tmp2.firstElementChild;
      if(node2){
        undoStack.push({kind:'insert',id:entry.id,html:entry.html,parent:parent,nextSibling:entry.nextSibling});
        if(entry.nextSibling&&entry.nextSibling.parentNode===parent)parent.insertBefore(node2,entry.nextSibling);
        else parent.appendChild(node2);
        scanEditable();
      }
    }
  }
  postHistory();
}

var guides=document.createElement('div');guides.id='am-guides';
guides.innerHTML='<div id="am-gv" style="position:fixed;top:0;bottom:0;width:1px;background:#3b82f6;opacity:0.45;pointer-events:none;z-index:999998;display:none"></div><div id="am-gh" style="position:fixed;left:0;right:0;height:1px;background:#3b82f6;opacity:0.45;pointer-events:none;z-index:999998;display:none"></div>';
document.body.appendChild(guides);
document.addEventListener('mousemove',function(ev){
  var v=document.getElementById('am-gv'),h=document.getElementById('am-gh');
  if(!v||!h)return;
  v.style.display='block';h.style.display='block';
  v.style.left=ev.clientX+'px';h.style.top=ev.clientY+'px';
});

var tb=document.createElement('div');tb.id='am-tb';
tb.innerHTML='<div id="am-tb-inner">'+
  '<button class="am-ai" data-a="ai">\\u2728 AI</button>'+
  '<button data-a="edit">\\u270F Edit</button>'+
  '<button data-a="dup">\\u2398 Dup</button>'+
  '<button data-a="undo">\\u21B6</button>'+
  '<button data-a="redo">\\u21B7</button>'+
  '<button class="am-del" data-a="delete">\\u2715</button>'+
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
function inlineStructure(el){
  var tags=[];el.querySelectorAll('*').forEach(function(c){tags.push(c.tagName.toLowerCase());});
  return tags.length?tags.join(','):'';
}
function payloadFor(el){
  var kind=el.getAttribute('data-am-kind')||'text';
  var p={type:'am-updated',id:el.getAttribute('data-am-id'),tag:el.tagName.toLowerCase(),kind:kind};
  if(kind==='image'){p.src=el.src;p.alt=el.alt||'';}
  else if(kind==='link'){p.href=el.getAttribute('href')||'';p.text=el.textContent;p.innerHtml=el.innerHTML;}
  else if(kind==='code'){p.text=el.textContent;}
  else{p.text=el.textContent;p.innerHtml=el.innerHTML;p.inlineTags=inlineStructure(el);}
  return p;
}
function notifyUpd(el){window.parent.postMessage(payloadFor(el),'*');window.parent.postMessage({type:'am-changed'},'*');}
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
  else if(kind==='link'){msg.href=el.getAttribute('href')||'';msg.text=el.textContent;msg.innerHtml=el.innerHTML;}
  else if(kind==='code'){msg.text=el.textContent;}
  else{msg.text=el.textContent;msg.innerHtml=el.innerHTML;msg.inlineTags=inlineStructure(el);}
  window.parent.postMessage(msg,'*');
}
function sel(el){
  if(act&&act!==el)desel();
  act=el;el.classList.add('am-active');pos();focusElement(el);
}
function distributeText(innerHtml,newText){
  var segs=[],rx=/>([^<]+)</g,m;
  while((m=rx.exec(innerHtml))!==null){if(m[1].trim())segs.push({s:m.index+1,e:m.index+1+m[1].length,t:m[1]});}
  var lead=innerHtml.match(/^([^<]+)/);
  if(lead&&lead[1].trim())segs.unshift({s:0,e:lead[1].length,t:lead[1]});
  if(!segs.length)return newText;
  var words=newText.trim().split(/\\s+/).filter(Boolean);
  if(!words.length)return innerHtml;
  var weights=segs.map(function(s){return Math.max(1,s.t.trim().split(/\\s+/).length);});
  var total=weights.reduce(function(a,b){return a+b;},0);
  var out=innerHtml,wi=0,allocs=[];
  for(var i=0;i<segs.length;i++){
    var isLast=i===segs.length-1;
    var cnt=isLast?words.length-wi:Math.max(1,Math.round(weights[i]/total*words.length));
    cnt=Math.min(cnt,words.length-wi-(segs.length-i-1));
    allocs.push(words.slice(wi,wi+cnt).join(' '));
    wi+=cnt;
  }
  for(var j=segs.length-1;j>=0;j--){
    var sg=segs[j];out=out.slice(0,sg.s)+allocs[j]+out.slice(sg.e);
  }
  return out;
}
function setTextPreserve(el,text){
  if(!el.querySelector(':scope > *')){el.textContent=text;return;}
  el.innerHTML=distributeText(el.innerHTML,text);
}
function duplicateEl(el){
  if(!el)return;
  snapshotEl(el);
  var clone=el.cloneNode(true);
  var newId=nextId();
  clone.setAttribute('data-am-id',newId);
  clone.querySelectorAll('[data-am-id]').forEach(function(c){c.setAttribute('data-am-id',nextId());});
  el.parentNode.insertBefore(clone,el.nextSibling);
  pushUndo({kind:'insert',id:newId,html:clone.outerHTML,parent:el.parentNode,nextSibling:clone.nextSibling});
  sel(clone);
  window.parent.postMessage({type:'am-changed'},'*');
}
function insertHtml(html,target){
  var parent=target&&target.parentNode?target.parentNode:document.body.querySelector('main')||document.body;
  var ref=target?target.nextSibling:null;
  var tmp=document.createElement('div');tmp.innerHTML=html.trim();
  var node=tmp.firstElementChild;
  if(!node)return;
  var nid=nextId();node.setAttribute('data-am-id',nid);node.setAttribute('data-am-kind','container');
  node.querySelectorAll('*').forEach(function(c){
    if(!c.getAttribute('data-am-id')&&c.tagName&&!skip(c)){
      if(isEditableText(c))tagEl(c,'text');
      else if(c.tagName==='IMG')tagEl(c,'image');
      else if(c.tagName==='A')tagEl(c,'link');
    }
  });
  if(ref)parent.insertBefore(node,ref);else parent.appendChild(node);
  pushUndo({kind:'insert',id:nid,html:node.outerHTML,parent:parent,nextSibling:node.nextSibling});
  sel(node);
  window.parent.postMessage({type:'am-changed'},'*');
}

document.addEventListener('click',function(ev){
  if(ev.target.closest('#am-tb'))return;
  var t=ev.target.closest('[data-am-id]');
  if(t){ev.preventDefault();ev.stopPropagation();sel(t);}
  else desel();
});
document.addEventListener('keydown',function(ev){
  if((ev.metaKey||ev.ctrlKey)&&ev.key==='z'&&!ev.shiftKey){ev.preventDefault();undo();}
  if((ev.metaKey||ev.ctrlKey)&&(ev.key==='y'||(ev.shiftKey&&ev.key==='z'))){ev.preventDefault();redo();}
  if((ev.metaKey||ev.ctrlKey)&&ev.key==='d'&&act){ev.preventDefault();duplicateEl(act);}
});
tb.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b||!act)return;
  var a=b.getAttribute('data-a');
  var kind=act.getAttribute('data-am-kind')||'text';
  if(a==='undo'){undo();return;}
  if(a==='redo'){redo();return;}
  if(a==='dup'){duplicateEl(act);return;}
  if(a==='edit'){
    if(kind==='image'){window.parent.postMessage({type:'am-image-req',id:act.getAttribute('data-am-id'),src:act.src,alt:act.alt||''},'*');}
    else if(kind==='link'){window.parent.postMessage({type:'am-link-req',id:act.getAttribute('data-am-id'),href:act.getAttribute('href')||'',text:act.textContent,innerHtml:act.innerHTML},'*');}
    else if(kind==='code'){window.parent.postMessage({type:'am-code-req',id:act.getAttribute('data-am-id'),text:act.textContent,tag:act.tagName.toLowerCase()},'*');}
    else if(kind==='container'){window.parent.postMessage({type:'am-container-req',id:act.getAttribute('data-am-id'),tag:act.tagName.toLowerCase()},'*');}
    else{snapshotEl(act);act.contentEditable='true';act.focus();}
  }
  if(a==='ai'&&(kind==='text'||kind==='link')){
    window.parent.postMessage({type:'am-ai-req',id:act.getAttribute('data-am-id'),text:act.textContent,tag:act.tagName.toLowerCase(),innerHtml:act.innerHTML,inlineTags:inlineStructure(act)},'*');
  }
  if(a==='delete'){
    var did=act.getAttribute('data-am-id');
    var parent=act.parentNode;var next=act.nextSibling;var outer=act.outerHTML;
    pushUndo({kind:'delete',id:did,html:outer,parent:parent,nextSibling:next});
    act.remove();act=null;tb.style.display='none';
    window.parent.postMessage({type:'am-deleted',id:did},'*');
  }
  if(a==='done')desel();
});
document.addEventListener('input',function(){if(act)notifyUpd(act);});
document.addEventListener('focusout',function(ev){if(act&&ev.target===act)snapshotEl(act);},true);

window.addEventListener('message',function(ev){
  var d=ev.data;if(!d)return;
  if(d.type==='am-ai-result'&&d.id!=null){
    var el=document.querySelector('[data-am-id="'+d.id+'"]');
    if(el){snapshotEl(el);setTextPreserve(el,d.text);notifyUpd(el);}
  }
  if(d.type==='am-undo')undo();
  if(d.type==='am-redo')redo();
  if(d.type==='am-duplicate'&&act)duplicateEl(act);
  if(d.type==='am-insert-widget'&&d.html)insertHtml(d.html,act||document.body.querySelector('[data-am-id]'));
  if(d.type==='am-apply-theme'&&d.css){
    var sid='automaio-editor-theme';
    var st=document.getElementById(sid);
    if(!st){st=document.createElement('style');st.id=sid;document.head.appendChild(st);}
    st.textContent=d.css;
    window.parent.postMessage({type:'am-changed'},'*');
  }
  if(d.type==='am-bulk-update'&&d.updates){
    for(var k in d.updates){
      var el=document.querySelector('[data-am-id="'+k+'"]');
      if(el&&el.getAttribute('data-am-kind')==='text'){snapshotEl(el);setTextPreserve(el,d.updates[k]);}
    }
    window.parent.postMessage({type:'am-bulk-done'},'*');
  }
  if(d.type==='am-image-update'&&d.id){
    var img=document.querySelector('[data-am-id="'+d.id+'"]');
    if(img&&img.tagName==='IMG'){snapshotEl(img);if(d.src)img.src=d.src;if(d.alt!=null)img.alt=d.alt;notifyUpd(img);}
  }
  if(d.type==='am-link-update'&&d.id){
    var a=document.querySelector('[data-am-id="'+d.id+'"]');
    if(a&&a.tagName==='A'){snapshotEl(a);if(d.href!=null)a.setAttribute('href',d.href);if(d.text!=null)setTextPreserve(a,d.text);notifyUpd(a);}
  }
  if(d.type==='am-code-update'&&d.id){
    var code=document.querySelector('[data-am-id="'+d.id+'"]');
    if(code){snapshotEl(code);code.textContent=d.text;notifyUpd(code);}
  }
  if(d.type==='am-get-text'){
    var r={};
    document.querySelectorAll('[data-am-id][data-am-kind="text"],[data-am-id][data-am-kind="link"]').forEach(function(el){
      r[el.getAttribute('data-am-id')]={text:el.textContent,tag:el.tagName.toLowerCase(),kind:el.getAttribute('data-am-kind'),innerHtml:el.innerHTML};
    });
    window.parent.postMessage({type:'am-all-text',elements:r},'*');
  }
  if(d.type==='am-delete-external'&&d.id){
    var delEl=document.querySelector('[data-am-id="'+d.id+'"]');
    if(delEl){snapshotEl(delEl);delEl.remove();window.parent.postMessage({type:'am-deleted',id:d.id},'*');}
  }
  if(d.type==='am-get-html'){
    var c=document.documentElement.cloneNode(true);
    c.querySelectorAll('#am-tb,#am-guides,[data-am-editor]').forEach(function(x){x.remove();});
    c.querySelectorAll('script').forEach(function(x){if((x.textContent||'').indexOf('data-am-id')>-1)x.remove();});
    c.querySelectorAll('[data-am-id]').forEach(function(x){
      x.removeAttribute('data-am-id');x.removeAttribute('data-am-kind');x.removeAttribute('data-am-widget');
      x.removeAttribute('contenteditable');x.classList.remove('am-active');
    });
    window.parent.postMessage({type:'am-clean-html',html:'<!DOCTYPE html>\\n'+c.outerHTML},'*');
  }
});
window.addEventListener('scroll',pos);window.addEventListener('resize',pos);
window.parent.postMessage({type:'am-ready',count:idx},'*');
postHistory();
})();`
