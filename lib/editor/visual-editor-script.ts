/** Injected into iframe — Elementor-style builder with drag-and-drop */
import { CAROUSEL_CSS, CAROUSEL_JS } from '@/lib/editor/carousel-runtime'

const CAROUSEL_CSS_INLINE = CAROUSEL_CSS.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '')
const CAROUSEL_JS_INLINE = CAROUSEL_JS.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '')

export const VISUAL_EDITOR_SCRIPT = `(function(){
var SKIP_SEL='style,script,noscript,svg,path,iframe,#am-tb,#am-guides,#am-palette,#am-drop-line,#am-block-labels';
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
var previewMode=false;
function nextId(){return String(idx++);}
function tagEl(el,kind){
  if(skip(el))return;
  if(el.getAttribute('data-am-id')){
    if(kind)el.setAttribute('data-am-kind',kind);
    ensureUid(el);
    return;
  }
  el.setAttribute('data-am-id',nextId());
  el.setAttribute('data-am-kind',kind);
  ensureUid(el);
}
function ensureUid(el){
  if(!el||skip(el))return '';
  if(!el.getAttribute('data-am-uid')){
    el.setAttribute('data-am-uid','u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  }
  return el.getAttribute('data-am-uid');
}
function markBlocks(){
  document.querySelectorAll('[data-am-block],[data-am-widget]').forEach(function(el){
    if(!el.getAttribute('data-am-id'))tagEl(el,'container');
    el.setAttribute('data-am-block','true');
    if(!el.getAttribute('draggable'))el.setAttribute('draggable','true');
  });
  document.querySelectorAll('[data-am-drop-zone]').forEach(function(z){
    if(!z.getAttribute('data-am-id'))tagEl(z,'container');
  });
}
function scanEditable(){
  markBlocks();
  var tags='h1,h2,h3,h4,h5,h6,p,button,li,td,th,blockquote,label,figcaption,span,small,strong,em,b,i,a,footer,dt,dd,cite,mark,sub,sup';
  document.querySelectorAll(tags).forEach(function(e){
    if(skip(e))return;
    if(isEditableText(e))tagEl(e,'text');
  });
  document.querySelectorAll('a[href]').forEach(function(e){
    if(skip(e))return;
    if(!e.getAttribute('data-am-id'))tagEl(e,'link');
    else e.setAttribute('data-am-kind','link');
  });
  document.querySelectorAll('button').forEach(function(e){
    if(skip(e))return;
    if(!e.getAttribute('data-am-id'))tagEl(e,'text');
    else if(!e.getAttribute('data-am-kind'))e.setAttribute('data-am-kind','text');
  });
  document.querySelectorAll('img').forEach(function(e){if(!skip(e))tagEl(e,'image');});
  document.querySelectorAll('pre,code').forEach(function(e){
    if(!skip(e)&&(e.textContent||'').trim())tagEl(e,'code');
  });
  document.querySelectorAll('[data-am-widget="leadForm"]').forEach(function(s){
    if(!s.getAttribute('data-am-id'))tagEl(s,'container');
    renderLeadForm(s);
  });
  initCarousels();
}
function initCarousels(){
  document.querySelectorAll('[data-am-carousel="true"]').forEach(function(section){
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
    if(prev)prev.onclick=function(e){e.preventDefault();step(-1);};
    if(next)next.onclick=function(e){e.preventDefault();step(1);};
    if(dotsWrap)dotsWrap.onclick=function(ev){
      var btn=ev.target.closest('[data-am-carousel-dot]');
      if(!btn)return;
      goTo(parseInt(btn.getAttribute('data-am-carousel-dot')||'0',10)||0);
    };
    slides.forEach(function(slide){
      if(!slide.querySelector('[data-am-carousel-overlay]')){
        var ov=document.createElement('div');
        ov.setAttribute('data-am-carousel-overlay','true');
        ov.className='am-carousel-overlay';
        ov.style.cssText='pointer-events:none;position:absolute;inset:0;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,0) 40%,rgba(15,23,42,0.55) 100%)';
        if(slide.style.position!=='relative')slide.style.position='relative';
        slide.appendChild(ov);
      }
    });
    var resizeFn=function(){goTo(idx);};
    window.addEventListener('resize',resizeFn);
    goTo(0);
    if(section.getAttribute('data-am-carousel-autoplay')!=='0'){
      timer=setInterval(function(){goTo(idx>=slides.length-1?0:idx+1);},5000);
      section.addEventListener('mouseenter',function(){if(timer){clearInterval(timer);timer=null;}});
      section.addEventListener('mouseleave',function(){if(!timer)timer=setInterval(function(){goTo(idx>=slides.length-1?0:idx+1);},5000);});
    }
  });
}
function buildOutline(){
  var items=[];
  document.querySelectorAll('[data-am-block]').forEach(function(el){
    items.push({
      id:el.getAttribute('data-am-id'),
      label:blockLabel(el),
      tag:el.tagName.toLowerCase(),
      widget:el.getAttribute('data-am-widget')||'',
      section:el.getAttribute('data-am-section')||''
    });
  });
  return items;
}
function editorSound(s){window.parent.postMessage({type:'am-sound',sound:s},'*');}
function pickSelectable(target){
  var el=target.nodeType===3?target.parentElement:target;
  if(!el)return null;
  var best=null,cur=el;
  while(cur&&cur!==document.body){
    if(cur.getAttribute&&cur.getAttribute('data-am-id')){
      var kind=cur.getAttribute('data-am-kind')||'';
      if(kind==='text'||kind==='link'||kind==='image'||kind==='code')return cur;
      if(!best)best=cur;
    }
    cur=cur.parentElement;
  }
  return best;
}
scanEditable();

var editBreakpoint='desktop';
var RESP_ID='automaio-responsive';
var respRules={};
function getRespSheet(){
  var st=document.getElementById(RESP_ID);
  if(!st){
    st=document.createElement('style');
    st.id=RESP_ID;
    st.setAttribute('data-am-responsive','true');
    document.head.appendChild(st);
  }
  return st;
}
function loadRespRules(){
  var st=getRespSheet();
  try{respRules=JSON.parse(st.getAttribute('data-am-rules')||'{}');}catch(e){respRules={};}
}
function saveRespRules(){
  var st=getRespSheet();
  st.setAttribute('data-am-rules',JSON.stringify(respRules));
  var css='',tab=[],mob=[],uid,r;
  for(uid in respRules){
    r=respRules[uid];
    if(r.tablet&&Object.keys(r.tablet).length){
      tab.push('[data-am-uid="'+uid+'"]{'+propsToCss(r.tablet)+'}');
    }
    if(r.mobile&&Object.keys(r.mobile).length){
      mob.push('[data-am-uid="'+uid+'"]{'+propsToCss(r.mobile)+'}');
    }
  }
  if(tab.length)css+='@media (max-width:991px){'+tab.join('')+'}';
  if(mob.length)css+='@media (max-width:767px){'+mob.join('')+'}';
  st.textContent=css;
}
function propsToCss(obj){
  var k,out=[];
  for(k in obj){if(obj[k])out.push(k+':'+obj[k]+' !important');}
  return out.join(';');
}
function rgbToHex(rgb){
  if(!rgb||rgb==='transparent'||rgb==='rgba(0, 0, 0, 0)')return '';
  if(rgb.indexOf('#')===0)return rgb;
  var m=rgb.match(/\\d+/g);
  if(!m||m.length<3)return rgb;
  return '#'+((1<<24)+(+m[0]<<16)+(+m[1]<<8)+ +m[2]).toString(16).slice(1);
}
function setRespProp(el,bp,cssKey,val){
  var uid=ensureUid(el);
  loadRespRules();
  if(!respRules[uid])respRules[uid]={};
  if(!respRules[uid][bp])respRules[uid][bp]={};
  if(val==null||val==='')delete respRules[uid][bp][cssKey];
  else respRules[uid][bp][cssKey]=val;
  if(!Object.keys(respRules[uid][bp]).length)delete respRules[uid][bp];
  if(!Object.keys(respRules[uid]).length)delete respRules[uid];
  saveRespRules();
}
function setRespProps(el,bp,props){
  var k;for(k in props)setRespProp(el,bp,k,props[k]);
}
function getRespProp(el,bp,cssKey){
  var uid=el.getAttribute('data-am-uid');
  if(!uid)return null;
  loadRespRules();
  if(respRules[uid]&&respRules[uid][bp]&&respRules[uid][bp][cssKey])return respRules[uid][bp][cssKey];
  return null;
}
function isEditingResponsive(){return editBreakpoint!=='desktop';}
function parseHexColor(c){
  if(!c)return null;
  if(c.indexOf('#')===0&&c.length>=7)return c.slice(0,7);
  var m=c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
  if(!m)return null;
  return '#'+((1<<24)+(+m[1]<<16)+(+m[2]<<8)+ +m[3]).toString(16).slice(1);
}
function isLightHex(hex){
  if(!hex||hex.indexOf('#')!==0||hex.length<7)return false;
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return (0.299*r+0.587*g+0.114*b)/255>0.72;
}
function contrastTextForBg(bg){
  var hex=parseHexColor(bg);
  if(!hex)return '#ffffff';
  return isLightHex(hex)?'#0f172a':'#ffffff';
}
function stylePayload(el){
  var cs=window.getComputedStyle(el);
  if(isEditingResponsive()){
    var bp=editBreakpoint;
    var bgImg=getRespProp(el,bp,'background-image')||'';
    var bgCol=getRespProp(el,bp,'background-color')||'';
    return {
      backgroundColor:bgImg&&bgImg!=='none'? '': (bgCol||''),
      backgroundImage:bgImg&&bgImg!=='none'? bgImg: '',
      color:getRespProp(el,bp,'color')||'',
      borderColor:getRespProp(el,bp,'border-color')||'',
      borderRadius:getRespProp(el,bp,'border-radius')||'',
      boxShadow:(getRespProp(el,bp,'box-shadow')||'').replace(/^none$/,''),
      transform:(getRespProp(el,bp,'transform')||'').replace(/^none$/,''),
      animation:(getRespProp(el,bp,'animation')||'').replace(/^none$/,''),
      fontFamily:(getRespProp(el,bp,'font-family')||'').replace(/^inherit$/,''),
      fontSize:getRespProp(el,bp,'font-size')||'',
      fontWeight:getRespProp(el,bp,'font-weight')||''
    };
  }
  var bgImg=el.style.backgroundImage||(cs.backgroundImage&&cs.backgroundImage!=='none'?cs.backgroundImage:'');
  var bg=getRespProp(el,'desktop','background-color')||el.style.backgroundColor||rgbToHex(cs.backgroundColor);
  if(bgImg&&bgImg!=='none')bg='';
  var col=el.style.color||rgbToHex(cs.color);
  var bc=el.style.borderColor||rgbToHex(cs.borderColor);
  var br=el.style.borderRadius||cs.borderRadius;
  var sh=el.style.boxShadow||(cs.boxShadow&&cs.boxShadow!=='none'?cs.boxShadow:'');
  var tf=el.style.transform||(cs.transform&&cs.transform!=='none'?cs.transform:'');
  var anim=el.style.animation||(cs.animationName&&cs.animationName!=='none'?cs.animation:'');
  var ff=el.style.fontFamily||cs.fontFamily||'';
  var fs=el.style.fontSize||cs.fontSize||'';
  var fw=el.style.fontWeight||cs.fontWeight||'';
  if(br==='0px')br='';
  if(sh==='none')sh='';
  if(tf==='none')tf='';
  if(anim==='none'||anim==='normal')anim='';
  if(ff==='inherit'||!ff)ff='';
  if(fs==='0px')fs='';
  return {backgroundColor:bg||'',backgroundImage:bgImg&&bgImg!=='none'?bgImg:'',color:col||'',borderColor:bc||'',borderRadius:br||'',boxShadow:sh||'',transform:tf||'',animation:anim||'',fontFamily:ff||'',fontSize:fs||'',fontWeight:fw||''};
}
function applyStyleProps(el,styles,props,isResponsive){
  if(styles.backgroundImage!=null){
    var gi=styles.backgroundImage;
    if(isResponsive){
      if(gi){props['background-image']=gi;props['background-color']='transparent';}
      else{props['background-image']='';props['background-color']=styles.backgroundColor||'';}
    }else{
      if(gi){el.style.backgroundImage=gi;el.style.backgroundColor='transparent';}
      else{el.style.backgroundImage='';if(styles.backgroundColor!=null)el.style.backgroundColor=styles.backgroundColor;}
    }
  }else if(styles.backgroundColor!=null){
    if(isResponsive){
      props['background-color']=styles.backgroundColor;
      props['background-image']='';
    }else{
      el.style.background=styles.backgroundColor;
      el.style.backgroundColor=styles.backgroundColor;
      el.style.backgroundImage='none';
    }
  }
  if(styles.color!=null){
    if(isResponsive)props['color']=styles.color;
    else el.style.color=styles.color;
  }else if(styles.backgroundColor!=null||styles.backgroundImage){
    var src=styles.backgroundColor||(styles.backgroundImage?'#6366f1':'');
    var auto=contrastTextForBg(src||el.style.backgroundColor);
    if(isResponsive)props['color']=auto;
    else el.style.color=auto;
  }
  if(styles.borderColor!=null){
    if(isResponsive){props['border-color']=styles.borderColor;props['border-width']='1px';props['border-style']='solid';}
    else{el.style.borderColor=styles.borderColor;el.style.borderWidth=el.style.borderWidth||'1px';el.style.borderStyle=el.style.borderStyle||'solid';}
  }
  if(styles.borderRadius!=null){
    if(isResponsive)props['border-radius']=styles.borderRadius;
    else el.style.borderRadius=styles.borderRadius;
  }
  if(styles.boxShadow!=null){
    if(isResponsive)props['box-shadow']=styles.boxShadow;
    else el.style.boxShadow=styles.boxShadow;
  }
  if(styles.transform!=null){
    if(isResponsive)props['transform']=styles.transform;
    else el.style.transform=styles.transform;
  }
  if(styles.animation!=null){
    ensureAnimKeyframes();
    if(isResponsive)props['animation']=styles.animation;
    else el.style.animation=styles.animation;
  }
  applyFontStyles(el,styles,props,isResponsive);
}
function ensureGoogleFont(family){
  if(!family||family==='inherit')return;
  var clean=String(family).split(',')[0].replace(/['"]/g,'').trim();
  if(!clean)return;
  var id='am-font-'+clean.replace(/[^a-z0-9]+/gi,'-').toLowerCase();
  if(document.getElementById(id))return;
  var link=document.createElement('link');
  link.id=id;
  link.rel='stylesheet';
  link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(clean).replace(/%20/g,'+')+':wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}
function applyFontStyles(el,styles,props,isResponsive){
  if(styles.fontFamily!=null){
    var fam=styles.fontFamily?'"'+String(styles.fontFamily).replace(/"/g,'')+'", sans-serif':'';
    if(fam)ensureGoogleFont(styles.fontFamily);
    if(isResponsive){props['font-family']=fam||'';}
    else{el.style.fontFamily=fam||'';}
  }
  if(styles.fontSize!=null){
    if(isResponsive)props['font-size']=styles.fontSize;
    else el.style.fontSize=styles.fontSize;
  }
  if(styles.fontWeight!=null){
    if(isResponsive)props['font-weight']=styles.fontWeight;
    else el.style.fontWeight=styles.fontWeight;
  }
}
function ensureAnimKeyframes(){
  if(document.getElementById('am-keyframes'))return;
  var st=document.createElement('style');
  st.id='am-keyframes';
  st.textContent='@keyframes am-fade-in{from{opacity:0}to{opacity:1}}@keyframes am-slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes am-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes am-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}';
  document.head.appendChild(st);
}
function snapshotStyles(el){
  if(!el||!el.getAttribute('data-am-id'))return;
  if(isEditingResponsive()){
    var uid=el.getAttribute('data-am-uid')||ensureUid(el);
    loadRespRules();
    var bp=editBreakpoint;
    var prev=respRules[uid]&&respRules[uid][bp]?JSON.parse(JSON.stringify(respRules[uid][bp])):{};
    pushUndo({kind:'resp-styles',id:el.getAttribute('data-am-id'),uid:uid,bp:bp,rules:prev,outer:el.outerHTML});
  }else{
    pushUndo({kind:'outer',id:el.getAttribute('data-am-id'),html:el.outerHTML});
  }
}
function applyStyles(el,styles){
  if(!el||!styles)return;
  snapshotStyles(el);
  if(isEditingResponsive()){
    var props={};
    applyStyleProps(el,styles,props,true);
    setRespProps(el,editBreakpoint,props);
  }else{
    applyStyleProps(el,styles,{},false);
  }
  window.parent.postMessage({type:'am-styles-updated',id:el.getAttribute('data-am-id'),tag:el.tagName.toLowerCase(),widget:el.getAttribute('data-am-widget')||'',styles:stylePayload(el),editBreakpoint:editBreakpoint},'*');
  editorSound('change');
  window.parent.postMessage({type:'am-changed'},'*');
}
loadRespRules();

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
  }else if(entry.kind==='move'){
    var el3=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el3&&entry.fromParent){
      redoStack.push({kind:'move',id:entry.id,fromParent:el3.parentNode,fromNext:el3.nextSibling,toParent:entry.toParent,toNext:entry.toNext});
      if(entry.fromNext&&entry.fromNext.parentNode===entry.fromParent)entry.fromParent.insertBefore(el3,entry.fromNext);
      else entry.fromParent.appendChild(el3);
    }
  }else if(entry.kind==='resp-styles'){
    var el5=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el5&&entry.uid){
      loadRespRules();
      var cur=respRules[entry.uid]&&respRules[entry.uid][entry.bp]?JSON.parse(JSON.stringify(respRules[entry.uid][entry.bp])):{};
      redoStack.push({kind:'resp-styles',id:entry.id,uid:entry.uid,bp:entry.bp,rules:cur,outer:el5.outerHTML});
      if(!respRules[entry.uid])respRules[entry.uid]={};
      if(entry.rules&&Object.keys(entry.rules).length)respRules[entry.uid][entry.bp]=entry.rules;
      else{delete respRules[entry.uid][entry.bp];if(!Object.keys(respRules[entry.uid]).length)delete respRules[entry.uid];}
      saveRespRules();
    }
  }
  postHistory();scanEditable();
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
  }else if(entry.kind==='move'){
    var el4=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el4&&entry.toParent){
      undoStack.push({kind:'move',id:entry.id,fromParent:el4.parentNode,fromNext:el4.nextSibling,toParent:entry.toParent,toNext:entry.toNext});
      if(entry.toNext&&entry.toNext.parentNode===entry.toParent)entry.toParent.insertBefore(el4,entry.toNext);
      else entry.toParent.appendChild(el4);
    }
  }else if(entry.kind==='resp-styles'){
    var el6=document.querySelector('[data-am-id="'+entry.id+'"]');
    if(el6&&entry.uid){
      loadRespRules();
      var cur2=respRules[entry.uid]&&respRules[entry.uid][entry.bp]?JSON.parse(JSON.stringify(respRules[entry.uid][entry.bp])):{};
      undoStack.push({kind:'resp-styles',id:entry.id,uid:entry.uid,bp:entry.bp,rules:cur2,outer:el6.outerHTML});
      if(!respRules[entry.uid])respRules[entry.uid]={};
      if(entry.rules&&Object.keys(entry.rules).length)respRules[entry.uid][entry.bp]=entry.rules;
      else{delete respRules[entry.uid][entry.bp];if(!Object.keys(respRules[entry.uid]).length)delete respRules[entry.uid];}
      saveRespRules();
    }
  }
  postHistory();scanEditable();
}

var guides=document.createElement('div');guides.id='am-guides';
guides.innerHTML='<div id="am-gv" style="position:fixed;top:0;bottom:0;width:1px;background:#a855f7;opacity:0.35;pointer-events:none;z-index:999998;display:none"></div><div id="am-gh" style="position:fixed;left:0;right:0;height:1px;background:#a855f7;opacity:0.35;pointer-events:none;z-index:999998;display:none"></div>';
document.body.appendChild(guides);
var dropLine=document.createElement('div');dropLine.id='am-drop-line';
dropLine.style.cssText='position:fixed;height:4px;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:4px;z-index:999997;display:none;pointer-events:none;box-shadow:0 0 12px rgba(124,58,237,0.6);';
document.body.appendChild(dropLine);

document.addEventListener('mousemove',function(ev){
  var v=document.getElementById('am-gv'),h=document.getElementById('am-gh');
  if(!v||!h)return;
  if(dragState.active||dragState.widgetHtml){
    v.style.display='none';h.style.display='none';return;
  }
  v.style.display='block';h.style.display='block';
  v.style.left=ev.clientX+'px';h.style.top=ev.clientY+'px';
});

var tb=document.createElement('div');tb.id='am-tb';
tb.innerHTML='<div id="am-tb-inner">'+
  '<span id="am-tb-label" style="font:600 10px system-ui;color:#c4b5fd;padding:0 8px;border-right:1px solid #334155;margin-right:2px;"></span>'+
  '<button class="am-drag" data-a="drag" title="Drag to move">\\u2630</button>'+
  '<button class="am-ai" data-a="ai">\\u2728 AI</button>'+
  '<button data-a="edit">\\u270F Edit</button>'+
  '<button data-a="dup">\\u2398 Dup</button>'+
  '<button data-a="undo">\\u21B6</button>'+
  '<button data-a="redo">\\u21B7</button>'+
  '<button class="am-del" data-a="delete">\\u2715</button>'+
  '<button class="am-done" data-a="done">\\u2713</button></div>';
document.body.appendChild(tb);
var act=null;
function blockLabel(el){
  var w=el.getAttribute('data-am-widget');
  if(w)return w.charAt(0).toUpperCase()+w.slice(1);
  var sec=el.getAttribute('data-am-section');
  if(sec)return sec.charAt(0).toUpperCase()+sec.slice(1);
  return el.tagName.toLowerCase();
}
function pos(){
  if(!act){tb.style.display='none';return;}
  var r=act.getBoundingClientRect();
  tb.style.display='block';
  var t=r.top-48;if(t<4)t=r.bottom+8;
  tb.style.top=t+'px';tb.style.left=Math.max(4,Math.min(r.left,window.innerWidth-320))+'px';
  var lbl=document.getElementById('am-tb-label');
  if(lbl)lbl.textContent=blockLabel(act);
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
function getCollectionBody(el){
  return el.querySelector('[data-am-collection-body]')||el;
}
function countCollectionItems(el){
  var body=getCollectionBody(el);
  return body?body.querySelectorAll('[data-am-item]').length:0;
}
function collectionHasImages(type){
  return ['team','gallery','carousel','testimonials'].indexOf(type)>-1;
}
function collectCollectionImages(el){
  var body=getCollectionBody(el);
  if(!body)return [];
  var type=el.getAttribute('data-am-collection')||'';
  if(!collectionHasImages(type))return [];
  var out=[], items=body.querySelectorAll('[data-am-item]');
  items.forEach(function(item,idx){
    var img=null;
    if(type==='gallery'&&item.tagName==='IMG')img=item;
    else img=item.querySelector('img[data-am-team-photo], img');
    if(!img)return;
    if(!img.getAttribute('data-am-id'))tagEl(img,'image');
    var label='Item '+(idx+1);
    if(type==='team'){
      var nameEl=item.querySelector('h3');
      if(nameEl&&(nameEl.textContent||'').trim())label=(nameEl.textContent||'').trim();
    }else if(type==='carousel'){
      var cap=item.querySelector('figcaption');
      if(cap&&(cap.textContent||'').trim())label=(cap.textContent||'').trim();
    }
    out.push({index:idx,imageId:img.getAttribute('data-am-id'),src:img.src||img.getAttribute('src')||'',label:label});
  });
  return out;
}
function applyCollectionColumns(el,cols){
  if(!el)return;
  var body=getCollectionBody(el);
  var type=el.getAttribute('data-am-collection')||el.getAttribute('data-am-widget')||'';
  cols=Math.max(1,Math.min(4,parseInt(cols,10)||1));
  el.setAttribute('data-am-columns',String(cols));
  if(body){
    body.setAttribute('data-am-columns',String(cols));
    if(type==='faq'||cols<=1){
      body.style.display='flex';body.style.flexDirection='column';body.style.gridTemplateColumns='';
    }else if(type==='logos'){
      body.style.display='flex';body.style.flexWrap='wrap';body.style.justifyContent='center';body.style.gap='20px';body.style.gridTemplateColumns='';
    }else if(type==='tabs'){
      body.style.display='flex';body.style.flexWrap='wrap';body.style.gap='8px';body.style.gridTemplateColumns='';
    }else if(type==='carousel'){
      body.style.display='flex';body.style.flexDirection='';body.style.gridTemplateColumns='';body.style.gap='0';
    }else{
      body.style.display='grid';body.style.flexDirection='';body.style.gridTemplateColumns='repeat('+cols+', minmax(0, 1fr))';body.style.gap='24px';
    }
  }
}
function retagCollectionItem(node){
  node.setAttribute('data-am-item','true');
  node.querySelectorAll('*').forEach(function(c){
    if(!c.getAttribute('data-am-id')&&c.tagName&&!skip(c)){
      if(isEditableText(c))tagEl(c,'text');
      else if(c.tagName==='IMG')tagEl(c,'image');
      else if(c.tagName==='A')tagEl(c,'link');
    }
  });
}
function addCollectionItem(el){
  if(!el)return;
  var body=getCollectionBody(el);
  if(!body)return;
  var items=body.querySelectorAll('[data-am-item]');
  if(!items.length)return;
  snapshotEl(el);
  var clone=items[items.length-1].cloneNode(true);
  clone.setAttribute('data-am-id',nextId());
  clone.setAttribute('data-am-uid','u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  clone.querySelectorAll('[data-am-id]').forEach(function(c){
    c.setAttribute('data-am-id',nextId());
    c.setAttribute('data-am-uid','u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  });
  retagCollectionItem(clone);
  body.appendChild(clone);
  var carouselSec=el.closest('[data-am-carousel="true"]');
  if(carouselSec)carouselSec.removeAttribute('data-am-carousel-ready');
  scanEditable();
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}
function removeCollectionItem(el){
  if(!el)return;
  var body=getCollectionBody(el);
  if(!body)return;
  var items=body.querySelectorAll('[data-am-item]');
  if(items.length<=1)return;
  snapshotEl(el);
  items[items.length-1].remove();
  scanEditable();
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}
function apiBase(){
  return window.__AUTOMAIO_API_BASE__||window.location.origin||'';
}
function renderLeadForm(section){
  if(!section)return;
  var root=section.querySelector('[data-am-lead-form-root]');
  if(!root)return;
  var token=section.getAttribute('data-form-token')||root.getAttribute('data-form-token')||'';
  var radius=section.getAttribute('data-form-radius')||root.getAttribute('data-form-radius')||'10';
  if(!token){
    root.innerHTML='<div data-am-lead-form-placeholder style="padding:24px;border:2px dashed #e2e8f0;border-radius:12px;text-align:center;color:#94a3b8;font-size:14px;">Select a lead form in the inspector</div>';
    return;
  }
  root.setAttribute('data-form-token',token);
  var embedUrl=apiBase()+'/webflow/embed/form/'+encodeURIComponent(token);
  root.innerHTML='<iframe data-am-lead-form-iframe="true" src="'+embedUrl+'" title="Lead form" style="width:100%;min-height:420px;border:0;display:block;border-radius:'+radius+'px;background:#fff;" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>';
}
function sectionPayload(el){
  var pad=parsePadding(el);
  var colW=parseColumnWidths(el);
  var gap=parseGap(el);
  var collection=el.getAttribute('data-am-collection')||'';
  var payload={
    type:'am-section-selected',
    id:el.getAttribute('data-am-id'),
    tag:el.tagName.toLowerCase(),
    widget:el.getAttribute('data-am-widget')||'',
    layout:el.getAttribute('data-am-layout')||'',
    isDropZone:el.hasAttribute('data-am-drop-zone'),
    isBlock:el.hasAttribute('data-am-block'),
    padding:pad,
    columnWidths:colW,
    gap:gap,
    styles:stylePayload(el),
    editBreakpoint:editBreakpoint,
    collection:collection||undefined,
    collectionItemCount:collection?countCollectionItems(el):undefined,
    collectionColumns:parseInt(el.getAttribute('data-am-columns')||'1',10)||1,
    collectionImages:collection&&collectionHasImages(collection)?collectCollectionImages(el):undefined,
    formToken:el.getAttribute('data-form-token')||'',
    formInputWidth:el.getAttribute('data-form-input-width')||'100',
    formInputPadding:el.getAttribute('data-form-input-padding')||'12',
    formRadius:el.getAttribute('data-form-radius')||'10',
    formPrimary:el.getAttribute('data-form-primary')||'#6366f1'
  };
  return payload;
}
function parsePadding(el){
  if(isEditingResponsive()){
    var t=getRespProp(el,editBreakpoint,'padding-top');
    if(t){
      return {
        top:parseInt(getRespProp(el,editBreakpoint,'padding-top')||'0',10)||0,
        right:parseInt(getRespProp(el,editBreakpoint,'padding-right')||'0',10)||0,
        bottom:parseInt(getRespProp(el,editBreakpoint,'padding-bottom')||'0',10)||0,
        left:parseInt(getRespProp(el,editBreakpoint,'padding-left')||'0',10)||0
      };
    }
  }
  var attr=el.getAttribute('data-am-padding');
  if(attr){
    var p=attr.split(',').map(function(v){return parseInt(v,10)||0;});
    if(p.length===4)return {top:p[0],right:p[1],bottom:p[2],left:p[3]};
    if(p.length===2)return {top:p[0],right:p[1],bottom:p[0],left:p[1]};
  }
  var cs=window.getComputedStyle(el);
  return {
    top:parseInt(cs.paddingTop,10)||0,
    right:parseInt(cs.paddingRight,10)||0,
    bottom:parseInt(cs.paddingBottom,10)||0,
    left:parseInt(cs.paddingLeft,10)||0
  };
}
function parseColumnWidths(el){
  if(isEditingResponsive()){
    var gt=getRespProp(el,editBreakpoint,'grid-template-columns');
    if(gt){
      var frs=gt.split(/\\s+/).filter(function(x){return x.indexOf('fr')>-1;});
      if(frs.length)return frs.map(function(f){return parseInt(f,10)||1;});
    }
  }
  var attr=el.getAttribute('data-am-col-widths');
  if(attr)return attr.split(',').map(function(v){return parseInt(v,10)||0;});
  var layout=el.getAttribute('data-am-layout');
  if(layout==='2col')return [50,50];
  if(layout==='3col')return [33,34,33];
  return [];
}
function parseGap(el){
  if(isEditingResponsive()){
    var g=getRespProp(el,editBreakpoint,'gap');
    if(g)return parseInt(g,10)||32;
  }
  var attr=el.getAttribute('data-am-col-gap');
  if(attr)return parseInt(attr,10)||32;
  var cs=window.getComputedStyle(el);
  return parseInt(cs.gap,10)||32;
}
function applyPadding(el,pad){
  if(!el||!pad)return;
  snapshotEl(el);
  if(isEditingResponsive()){
    setRespProps(el,editBreakpoint,{
      'padding-top':pad.top+'px',
      'padding-right':pad.right+'px',
      'padding-bottom':pad.bottom+'px',
      'padding-left':pad.left+'px'
    });
  }else{
    el.style.paddingTop=pad.top+'px';
    el.style.paddingRight=pad.right+'px';
    el.style.paddingBottom=pad.bottom+'px';
    el.style.paddingLeft=pad.left+'px';
    el.setAttribute('data-am-padding',pad.top+','+pad.right+','+pad.bottom+','+pad.left);
  }
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}
function applyColumnWidths(el,widths){
  if(!el||!widths||!widths.length)return;
  snapshotEl(el);
  var cols=widths.map(function(w){return w+'fr';}).join(' ');
  if(isEditingResponsive()){
    setRespProp(el,editBreakpoint,'grid-template-columns',cols);
    setRespProp(el,editBreakpoint,'display','grid');
  }else{
    el.setAttribute('data-am-col-widths',widths.join(','));
    el.style.display='grid';
    el.style.gridTemplateColumns=cols;
  }
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}
function applyGap(el,gap){
  if(!el)return;
  snapshotEl(el);
  if(isEditingResponsive()){
    setRespProp(el,editBreakpoint,'gap',gap+'px');
  }else{
    el.setAttribute('data-am-col-gap',String(gap));
    el.style.gap=gap+'px';
  }
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}
function notifyUpd(el){window.parent.postMessage(payloadFor(el),'*');window.parent.postMessage({type:'am-changed'},'*');}
function desel(){
  if(!act)return;
  act.contentEditable='false';
  act.classList.remove('am-active','am-block-active');
  document.querySelectorAll('.am-block-hover').forEach(function(x){x.classList.remove('am-block-hover');});
  notifyUpd(act);act=null;tb.style.display='none';
  window.parent.postMessage({type:'am-section-selected',id:null},'*');
}
function focusElement(el){
  try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});}catch(e){}
  var r=el.getBoundingClientRect();
  var kind=el.getAttribute('data-am-kind')||'text';
  var isBlock=el.hasAttribute('data-am-block');
  var msg={type:'am-selected',id:el.getAttribute('data-am-id'),tag:el.tagName.toLowerCase(),kind:kind,
    rect:{top:r.top,left:r.left,width:r.width,height:r.height},isBlock:isBlock,
    widget:el.getAttribute('data-am-widget')||'',styles:stylePayload(el),editBreakpoint:editBreakpoint};
  if(kind==='image'){msg.src=el.src;msg.alt=el.alt||'';msg.text=el.alt||'';}
  else if(kind==='link'){msg.href=el.getAttribute('href')||'';msg.text=el.textContent;msg.innerHtml=el.innerHTML;}
  else if(kind==='code'){msg.text=el.textContent;}
  else{msg.text=el.textContent;msg.innerHtml=el.innerHTML;msg.inlineTags=inlineStructure(el);}
  window.parent.postMessage(msg,'*');
  if(isBlock||el.hasAttribute('data-am-drop-zone')||kind==='container'){
    window.parent.postMessage(sectionPayload(el),'*');
  }else{
    window.parent.postMessage({type:'am-section-selected',id:null},'*');
  }
}
function sel(el){
  if(act&&act!==el)desel();
  act=el;
  el.classList.add('am-active');
  if(el.hasAttribute('data-am-block'))el.classList.add('am-block-active');
  pos();focusElement(el);
  editorSound('select');
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
function prepNode(node){
  var nid=nextId();
  node.setAttribute('data-am-id',nid);
  ensureUid(node);
  if(!node.getAttribute('data-am-kind'))node.setAttribute('data-am-kind','container');
  if(node.hasAttribute('data-am-block')||node.hasAttribute('data-am-widget')){
    node.setAttribute('draggable','true');
  }
  node.querySelectorAll('*').forEach(function(c){
    if(!c.getAttribute('data-am-id')&&c.tagName&&!skip(c)){
      if(isEditableText(c))tagEl(c,'text');
      else if(c.tagName==='IMG')tagEl(c,'image');
      else if(c.tagName==='A')tagEl(c,'link');
    }
  });
  return nid;
}
function duplicateEl(el){
  if(!el)return;
  snapshotEl(el.parentNode);
  var clone=el.cloneNode(true);
  var newId=nextId();
  clone.setAttribute('data-am-id',newId);
  clone.setAttribute('data-am-uid','u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  clone.querySelectorAll('[data-am-id]').forEach(function(c){
    c.setAttribute('data-am-id',nextId());
    c.setAttribute('data-am-uid','u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  });
  el.parentNode.insertBefore(clone,el.nextSibling);
  pushUndo({kind:'insert',id:newId,html:clone.outerHTML,parent:el.parentNode,nextSibling:clone.nextSibling});
  scanEditable();sel(clone);
  window.parent.postMessage({type:'am-changed'},'*');
}
function insertHtmlAt(html,target,position){
  var parent,ref;
  if(position==='inside'&&target){
    parent=target;
    ref=null;
  }else if(target&&target.parentNode){
    parent=target.parentNode;
    ref=position==='before'?target:(target.nextSibling||null);
  }else{
    parent=document.body.querySelector('main')||document.body;
    ref=null;
  }
  var tmp=document.createElement('div');tmp.innerHTML=html.trim();
  var node=tmp.firstElementChild;
  if(!node)return null;
  var nid=prepNode(node);
  if(ref)parent.insertBefore(node,ref);else parent.appendChild(node);
  pushUndo({kind:'insert',id:nid,html:node.outerHTML,parent:parent,nextSibling:node.nextSibling});
  scanEditable();sel(node);
  editorSound('insert');
  window.parent.postMessage({type:'am-changed'},'*');
  return node;
}
function insertHtml(html,target){return insertHtmlAt(html,target||document.body.querySelector('[data-am-block]')||document.body,'after');}

function getDropTargets(){
  var targets=[];
  document.querySelectorAll('[data-am-block]').forEach(function(b){
    if(b.offsetParent!==null||b===document.body)targets.push(b);
  });
  if(!targets.length){
    document.querySelectorAll('body > *, main > *').forEach(function(c){
      if(c.tagName&&!skip(c))targets.push(c);
    });
  }
  return targets;
}
function findDropPosition(clientY){
  var targets=getDropTargets(),best=null,bestDist=Infinity,bestPos='after';
  for(var i=0;i<targets.length;i++){
    var el=targets[i],r=el.getBoundingClientRect();
    var mid=r.top+r.height/2;
    var dist=Math.abs(clientY-mid);
    if(dist<bestDist){
      bestDist=dist;best=el;
      bestPos=clientY<mid?'before':'after';
    }
  }
  return {target:best,position:bestPos};
}
function showDropLine(clientY){
  var pos=findDropPosition(clientY);
  if(!pos.target){dropLine.style.display='none';return pos;}
  var r=pos.target.getBoundingClientRect();
  var top=pos.position==='before'?r.top-2:r.bottom-2;
  dropLine.style.display='block';
  dropLine.style.top=top+'px';
  dropLine.style.left=Math.max(8,r.left)+'px';
  dropLine.style.width=Math.min(r.width,window.innerWidth-16)+'px';
  dragState.dropTarget=pos.target;
  dragState.dropPosition=pos.position;
  return pos;
}
function hideDropLine(){dropLine.style.display='none';dragState.dropTarget=null;}

var dragState={active:false,el:null,widgetHtml:null,dropTarget:null,dropPosition:'after'};
function moveBlock(el,target,position){
  if(!el||!target||el===target||target.contains(el))return;
  var fromParent=el.parentNode,fromNext=el.nextSibling;
  var parent,ref;
  if(position==='inside'){
    parent=target;ref=null;
  }else{
    parent=target.parentNode;
    ref=position==='before'?target:target.nextSibling;
  }
  if(!parent)return;
  pushUndo({kind:'move',id:el.getAttribute('data-am-id'),fromParent:fromParent,fromNext:fromNext,toParent:parent,toNext:ref});
  if(ref)parent.insertBefore(el,ref);else parent.appendChild(el);
  scanEditable();sel(el);
  window.parent.postMessage({type:'am-changed'},'*');
}

document.addEventListener('dragstart',function(ev){
  if(previewMode){ev.preventDefault();return;}
  if(ev.target.closest('#am-tb'))return;
  var innerEdit=ev.target.closest('[data-am-kind="text"],[data-am-kind="link"],[data-am-kind="image"]');
  if(innerEdit&&!innerEdit.hasAttribute('data-am-block'))return;
  var block=ev.target.closest('[data-am-block]');
  if(block&&!ev.target.closest('#am-tb')){
    dragState.active=true;dragState.el=block;
    ev.dataTransfer.setData('text/am-block-id',block.getAttribute('data-am-id'));
    ev.dataTransfer.effectAllowed='move';
    block.classList.add('am-dragging');
    setTimeout(function(){block.style.opacity='0.45';},0);
  }
});
document.addEventListener('dragend',function(ev){
  var block=ev.target.closest('[data-am-block]');
  if(block){block.classList.remove('am-dragging');block.style.opacity='';}
  dragState.active=false;dragState.el=null;dragState.widgetHtml=null;
  hideDropLine();
  document.querySelectorAll('.am-drop-active').forEach(function(z){z.classList.remove('am-drop-active');});
});
document.addEventListener('dragover',function(ev){
  ev.preventDefault();
  var widgetHtml=ev.dataTransfer.types.indexOf('application/x-am-widget-html')>-1;
  if(dragState.active||widgetHtml||ev.dataTransfer.types.indexOf('text/am-block-id')>-1){
    ev.dataTransfer.dropEffect=dragState.active?'move':'copy';
    showDropLine(ev.clientY);
    var zone=ev.target.closest('[data-am-drop-zone]');
    document.querySelectorAll('.am-drop-active').forEach(function(z){z.classList.remove('am-drop-active');});
    if(zone)zone.classList.add('am-drop-active');
  }
});
document.addEventListener('dragleave',function(ev){
  if(!ev.relatedTarget||!document.body.contains(ev.relatedTarget))hideDropLine();
});
document.addEventListener('drop',function(ev){
  ev.preventDefault();
  hideDropLine();
  document.querySelectorAll('.am-drop-active').forEach(function(z){z.classList.remove('am-drop-active');});
  var zone=ev.target.closest('[data-am-drop-zone]');
  var widgetHtml=ev.dataTransfer.getData('application/x-am-widget-html');
  var blockId=ev.dataTransfer.getData('text/am-block-id');
  if(widgetHtml){
    if(zone)insertHtmlAt(widgetHtml,zone,'inside');
    else if(dragState.dropTarget)insertHtmlAt(widgetHtml,dragState.dropTarget,dragState.dropPosition||'after');
    else insertHtml(widgetHtml,null);
    return;
  }
  if(blockId&&dragState.el){
    var moving=document.querySelector('[data-am-id="'+blockId+'"]');
    if(!moving)return;
    if(zone&&!zone.contains(moving))moveBlock(moving,zone,'inside');
    else if(dragState.dropTarget)moveBlock(moving,dragState.dropTarget,dragState.dropPosition||'after');
  }
});

document.addEventListener('mouseover',function(ev){
  var b=ev.target.closest('[data-am-block]');
  if(!b||b===act)return;
  document.querySelectorAll('.am-block-hover').forEach(function(x){if(x!==b)x.classList.remove('am-block-hover');});
  b.classList.add('am-block-hover');
});
document.addEventListener('mouseout',function(ev){
  var b=ev.target.closest('[data-am-block]');
  if(b&&!b.contains(ev.relatedTarget))b.classList.remove('am-block-hover');
});

document.addEventListener('click',function(ev){
  if(previewMode)return;
  if(ev.target.closest('#am-tb'))return;
  var t=pickSelectable(ev.target);
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
  if(a==='drag')return;
  if(a==='undo'){undo();return;}
  if(a==='redo'){redo();return;}
  if(a==='dup'){duplicateEl(act);return;}
  if(a==='edit'){
    if(kind==='image'){window.parent.postMessage({type:'am-image-req',id:act.getAttribute('data-am-id'),src:act.src,alt:act.alt||''},'*');}
    else if(kind==='link'){window.parent.postMessage({type:'am-link-req',id:act.getAttribute('data-am-id'),href:act.getAttribute('href')||'',text:act.textContent,innerHtml:act.innerHTML},'*');}
    else if(kind==='code'){window.parent.postMessage({type:'am-code-req',id:act.getAttribute('data-am-id'),text:act.textContent,tag:act.tagName.toLowerCase()},'*');}
    else if(kind==='container'||act.hasAttribute('data-am-block')){window.parent.postMessage(sectionPayload(act),'*');}
    else{snapshotEl(act);act.contentEditable='true';act.focus();}
  }
  if(a==='ai'&&(kind==='text'||kind==='link'||act.tagName==='BUTTON'||act.tagName==='A')){
    window.parent.postMessage({type:'am-ai-req',id:act.getAttribute('data-am-id'),text:act.textContent,tag:act.tagName.toLowerCase(),innerHtml:act.innerHTML,inlineTags:inlineStructure(act),kind:kind},'*');
  }
  if(a==='delete'){
    var did=act.getAttribute('data-am-id');
    var parent=act.parentNode;var next=act.nextSibling;var outer=act.outerHTML;
    pushUndo({kind:'delete',id:did,html:outer,parent:parent,nextSibling:next});
    act.remove();act=null;tb.style.display='none';
    editorSound('delete');
    window.parent.postMessage({type:'am-deleted',id:did},'*');
    window.parent.postMessage({type:'am-section-selected',id:null},'*');
  }
  if(a==='done')desel();
});
var dragBtn=tb.querySelector('[data-a="drag"]');
if(dragBtn){
  dragBtn.setAttribute('draggable','true');
  dragBtn.addEventListener('dragstart',function(ev){
    if(!act)return;
    ev.stopPropagation();
    dragState.active=true;dragState.el=act;
    ev.dataTransfer.setData('text/am-block-id',act.getAttribute('data-am-id'));
    ev.dataTransfer.effectAllowed='move';
    act.classList.add('am-dragging');
  });
}

function applyLayout(el,layout){
  if(!el)return;
  snapshotEl(el);
  el.setAttribute('data-am-layout',layout);
  if(layout==='2col'){
    el.style.display='grid';el.style.gridTemplateColumns='1fr 1fr';el.style.gap='32px';
    el.setAttribute('data-am-col-widths','50,50');
    el.setAttribute('data-am-col-gap','32');
    if(!el.querySelector('[data-am-column]')){
      var h=el.innerHTML;
      el.innerHTML='<div data-am-column="1" data-am-drop-zone="true">'+h+'</div><div data-am-column="2" data-am-drop-zone="true"><p style="color:#64748b;">Column 2</p></div>';
    }
  }else if(layout==='3col'){
    el.style.display='grid';el.style.gridTemplateColumns='1fr 1fr 1fr';el.style.gap='24px';
    el.setAttribute('data-am-col-widths','33,34,33');
    el.setAttribute('data-am-col-gap','24');
    if(!el.querySelector('[data-am-column]')){
      var h2=el.innerHTML;
      el.innerHTML='<div data-am-column="1" data-am-drop-zone="true">'+h2+'</div><div data-am-column="2" data-am-drop-zone="true"><p style="color:#64748b;">Col 2</p></div><div data-am-column="3" data-am-drop-zone="true"><p style="color:#64748b;">Col 3</p></div>';
    }
  }else{
    el.style.display='';el.style.gridTemplateColumns='';el.style.gap='';
    el.removeAttribute('data-am-layout');
    el.removeAttribute('data-am-col-widths');
    el.removeAttribute('data-am-col-gap');
  }
  scanEditable();
  window.parent.postMessage(sectionPayload(el),'*');
  window.parent.postMessage({type:'am-changed'},'*');
}

document.addEventListener('input',function(){if(act)notifyUpd(act);});
document.addEventListener('focusout',function(ev){if(act&&ev.target===act)snapshotEl(act);},true);

window.addEventListener('message',function(ev){
  var d=ev.data;if(!d)return;
  if(d.type==='am-set-preview-mode'){
    previewMode=!!d.enabled;
    document.documentElement.setAttribute('data-am-preview', previewMode?'1':'0');
    if(previewMode){desel();tb.style.display='none';}
    return;
  }
  if(d.type==='am-ai-result'&&d.id!=null){
    var el=document.querySelector('[data-am-id="'+d.id+'"]');
    if(el){snapshotEl(el);setTextPreserve(el,d.text);notifyUpd(el);}
  }
  if(d.type==='am-undo')undo();
  if(d.type==='am-redo')redo();
  if(d.type==='am-duplicate'&&act)duplicateEl(act);
  if(d.type==='am-insert-widget'&&d.html){
    var t=d.targetId?document.querySelector('[data-am-id="'+d.targetId+'"]'):act;
    insertHtmlAt(d.html,t,d.position||'after');
  }
  if(d.type==='am-insert-inside'&&d.html&&d.targetId){
    var inside=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(inside)insertHtmlAt(d.html,inside,'inside');
  }
  if(d.type==='am-set-layout'&&d.targetId&&d.layout){
    var layEl=document.querySelector('[data-am-id="'+d.targetId+'"]');
    applyLayout(layEl,d.layout);
  }
  if(d.type==='am-set-padding'&&d.targetId&&d.padding){
    var padEl=document.querySelector('[data-am-id="'+d.targetId+'"]');
    applyPadding(padEl,d.padding);
  }
  if(d.type==='am-set-column-widths'&&d.targetId&&d.widths){
    var colEl=document.querySelector('[data-am-id="'+d.targetId+'"]');
    applyColumnWidths(colEl,d.widths);
  }
  if(d.type==='am-set-gap'&&d.targetId&&d.gap!=null){
    var gapEl=document.querySelector('[data-am-id="'+d.targetId+'"]');
    applyGap(gapEl,d.gap);
  }
  if(d.type==='am-set-viewport'&&d.viewport){
    editBreakpoint=d.viewport;
    document.documentElement.setAttribute('data-am-edit-viewport',d.viewport);
    if(act){focusElement(act);}
    else window.parent.postMessage({type:'am-viewport-changed',viewport:d.viewport},'*');
  }
  if(d.type==='am-get-outline'){
    window.parent.postMessage({type:'am-outline',items:buildOutline()},'*');
  }
  if(d.type==='am-select-by-id'&&d.id){
    var pick=document.querySelector('[data-am-id="'+d.id+'"]');
    if(pick)sel(pick);
  }
  if(d.type==='am-nav-move'&&d.id&&d.targetId){
    var navEl=document.querySelector('[data-am-id="'+d.id+'"]');
    var navTgt=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(navEl&&navTgt)moveBlock(navEl,navTgt,d.position||'after');
  }
  if(d.type==='am-set-styles'&&d.targetId&&d.styles){
    var styEl=document.querySelector('[data-am-id="'+d.targetId+'"]');
    applyStyles(styEl,d.styles);
  }
  if(d.type==='am-stack-columns'&&d.targetId){
    var stackEl=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(stackEl){
      snapshotEl(stackEl);
      setRespProp(stackEl,'mobile','grid-template-columns','1fr');
      setRespProp(stackEl,'mobile','display','grid');
      window.parent.postMessage(sectionPayload(stackEl),'*');
      window.parent.postMessage({type:'am-changed'},'*');
    }
  }
  if(d.type==='am-move-block'&&d.id&&d.targetId){
    var mv=document.querySelector('[data-am-id="'+d.id+'"]');
    var tgt=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(mv&&tgt)moveBlock(mv,tgt,d.position||'after');
  }
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
  if(d.type==='am-collection-add'&&d.targetId){
    var colAdd=document.querySelector('[data-am-id="'+d.targetId+'"]');
    addCollectionItem(colAdd);
  }
  if(d.type==='am-collection-remove'&&d.targetId){
    var colRm=document.querySelector('[data-am-id="'+d.targetId+'"]');
    removeCollectionItem(colRm);
  }
  if(d.type==='am-collection-set-columns'&&d.targetId&&d.columns!=null){
    var colEl2=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(colEl2){snapshotEl(colEl2);applyCollectionColumns(colEl2,d.columns);window.parent.postMessage(sectionPayload(colEl2),'*');window.parent.postMessage({type:'am-changed'},'*');}
  }
  if(d.type==='am-collection-image-update'&&d.targetId&&d.imageId&&d.src){
    var colSec=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(colSec){
      var colImg=colSec.querySelector('[data-am-id="'+d.imageId+'"]');
      if(colImg&&colImg.tagName==='IMG'){
        snapshotEl(colSec);
        colImg.src=d.src;
        if(d.alt!=null)colImg.alt=d.alt;
        scanEditable();
        window.parent.postMessage(sectionPayload(colSec),'*');
        window.parent.postMessage({type:'am-changed'},'*');
      }
    }
  }
  if(d.type==='am-lead-form-update'&&d.targetId){
    var formSec=document.querySelector('[data-am-id="'+d.targetId+'"]');
    if(formSec){
      snapshotEl(formSec);
      if(d.formToken!=null)formSec.setAttribute('data-form-token',d.formToken);
      if(d.formInputWidth!=null)formSec.setAttribute('data-form-input-width',String(d.formInputWidth));
      if(d.formInputPadding!=null)formSec.setAttribute('data-form-input-padding',String(d.formInputPadding));
      if(d.formRadius!=null)formSec.setAttribute('data-form-radius',String(d.formRadius));
      if(d.formPrimary!=null)formSec.setAttribute('data-form-primary',d.formPrimary);
      var formRoot=formSec.querySelector('[data-am-lead-form-root]');
      if(formRoot){
        if(d.formToken!=null)formRoot.setAttribute('data-form-token',d.formToken);
        if(d.formInputWidth!=null)formRoot.setAttribute('data-form-input-width',String(d.formInputWidth));
        if(d.formInputPadding!=null)formRoot.setAttribute('data-form-input-padding',String(d.formInputPadding));
        if(d.formRadius!=null)formRoot.setAttribute('data-form-radius',String(d.formRadius));
        if(d.formPrimary!=null)formRoot.setAttribute('data-form-primary',d.formPrimary);
      }
      renderLeadForm(formSec);
      window.parent.postMessage(sectionPayload(formSec),'*');
      window.parent.postMessage({type:'am-changed'},'*');
    }
  }
  if(d.type==='am-get-html'){
    try{
      var c=document.documentElement.cloneNode(true);
      c.querySelectorAll('#am-tb,#am-guides,#am-drop-line,[data-am-editor]').forEach(function(x){x.remove();});
      c.querySelectorAll('script').forEach(function(x){if((x.textContent||'').indexOf('data-am-id')>-1)x.remove();});
      c.removeAttribute('data-am-edit-viewport');
      c.querySelectorAll('[data-am-id]').forEach(function(x){
        x.removeAttribute('data-am-id');x.removeAttribute('data-am-kind');x.removeAttribute('data-am-widget');
        x.removeAttribute('data-am-block');x.removeAttribute('data-am-layout');x.removeAttribute('data-am-column');
        x.removeAttribute('data-am-drop-zone');x.removeAttribute('data-am-section');x.removeAttribute('data-am-padding');
        x.removeAttribute('data-am-col-widths');x.removeAttribute('data-am-col-gap');x.removeAttribute('draggable');
        x.removeAttribute('contenteditable');
        if(x.classList){
          x.classList.remove('am-active','am-block-active','am-block-hover','am-dragging','am-drop-active');
        }
      });
      var resp=c.querySelector('#automaio-responsive');
      if(resp&&!resp.getAttribute('data-am-rules'))resp.removeAttribute('id');
      var base=apiBase();
      c.querySelectorAll('[data-am-widget="leadForm"]').forEach(function(sec){
        var token=sec.getAttribute('data-form-token')||'';
        var root=sec.querySelector('[data-am-lead-form-root]');
        if(!token||!root)return;
        var cid='automaio-form-'+token.slice(0,8);
        root.setAttribute('id',cid);
        root.setAttribute('data-automaio-form-root','true');
        root.removeAttribute('data-am-lead-form-root');
        var preview=root.querySelector('[data-am-lead-form-preview]');
        if(preview)root.innerHTML='';
        var scr=document.createElement('script');
        scr.src=base+'/webflow/form-embed.js';
        scr.setAttribute('data-form-token',token);
        scr.async=true;
        root.parentNode.insertBefore(scr,root.nextSibling);
      });
      c.querySelectorAll('[data-am-lead-form-placeholder]').forEach(function(p){p.remove();});
      c.querySelectorAll('[data-am-carousel-ready]').forEach(function(x){x.removeAttribute('data-am-carousel-ready');});
      if(c.querySelector('[data-am-carousel="true"]')){
        var carSt=document.createElement('style');
        carSt.textContent='${CAROUSEL_CSS_INLINE}';
        c.querySelector('head').appendChild(carSt);
        var carSc=document.createElement('script');
        carSc.textContent='${CAROUSEL_JS_INLINE}';
        c.querySelector('body').appendChild(carSc);
      }
      window.parent.postMessage({type:'am-clean-html',html:'<!DOCTYPE html>\\n'+c.outerHTML},'*');
    }catch(err){
      window.parent.postMessage({type:'am-clean-html-error',error:err&&err.message?err.message:String(err)},'*');
    }
  }
});
window.addEventListener('scroll',pos);window.addEventListener('resize',pos);
window.parent.postMessage({type:'am-ready',count:idx},'*');
postHistory();
})();`
