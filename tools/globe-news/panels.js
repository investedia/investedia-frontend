// Customisable panels (owner 15 Nov 2026, design A). PC only (≥1180 px).
// Every panel gets a pin and a minimise button. Unpinned panels can be dragged by their ⋮⋮ handle.
// A minimised panel becomes a chip ("Layers ＋") near its side; the chip reopens it.
// The bottom strips (News activity / Markets activity) get a handle: click or drag it down to crop the strip to its tab bar.
// The layout is saved on this device only ('inv-globe-layout').
(()=>{
 const KEY='inv-globe-layout',big=()=>matchMedia('(min-width:1180px)').matches;
 let L;try{L=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{L={}}
 L.min=L.min||{};L.free=L.free||{};L.pos=L.pos||{};L.crop=L.crop||{};L.h=L.h||{};L.hl=L.hl||{};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(L))}catch{}};
 const mode=()=>typeof PROJ!=='undefined'&&PROJ.on?'projects':typeof MARKET!=='undefined'&&MARKET.on?'markets':'news';
 // [id, label, side, mode, selector]
 const P=[['sec','Sector overview','l','news','#sideSec'],['views','Saved views','l','news','#presets'],['top','Top articles','r','news','#panel'],['imp','Market impact','r','news','#sideImp'],
  ['sess','Market sessions','l','markets','.mkd-l'],['mko','Markets overview','r','markets','.mkd-o'],
  ['pjl','Project list','l','projects','#pjList'],['pjs','Project stats','r','projects','#pjStats']];
 const STRIPS=[['act','#act','.act-h'],['mka','.mkd-a','.mkd-th']];
 const css=document.createElement('style');css.textContent=`
 .gp-hid{display:none!important}
 .gp-ctl{position:fixed;z-index:30;display:none;gap:4px}
 @media(min-width:1180px){#sideSec>:first-child,#presets>:first-child,#sideImp>:first-child,.mkd-l>:first-child,.mkd-o>:first-child,#pjList>:first-child,#pjStats>:first-child{padding-right:64px!important;box-sizing:border-box}#panel h2{padding-right:96px!important}}.gp-ctl.on{display:flex}
 .gp-ctl button{width:24px;height:24px;border-radius:7px;border:1px solid #2c2c31;background:#141417;color:#aaa;font:600 13px Inter,sans-serif;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
 .gp-ctl button:hover{color:#fff;border-color:#45454c}.gp-ctl .gp-pin[aria-pressed=true]{color:#ff9d5c;border-color:#5a3214;background:#1d130b}
 .gp-ctl .gp-drag{cursor:grab;letter-spacing:-2px;color:#777}.gp-ctl .gp-drag[hidden]{display:none}
 .gp-dock{position:fixed;z-index:29;display:none;gap:8px;flex-wrap:wrap;max-width:420px}.gp-dock.on{display:flex}
 .gp-chip{display:inline-flex;align-items:center;gap:8px;background:rgba(14,14,17,.95);border:1px solid #2a2a2f;border-radius:999px;padding:7px 12px;font:13px Inter,sans-serif;color:#ddd;cursor:pointer}
 .gp-chip i{width:7px;height:7px;border-radius:50%;background:#ff7a1a}.gp-chip:hover{border-color:#ff7a1a}

 .gp-grab{display:block;width:60px;height:16px;margin:-8px auto 0;border:0;background:none;cursor:ns-resize;position:relative;touch-action:none}.gp-grab:before{content:'';position:absolute;left:7px;right:7px;top:5px;height:5px;border-radius:3px;background:#3a3a40;transition:background .15s}.gp-grab:hover:before,.gp-drag-on .gp-grab:before{background:#ff7a1a}
 .gp-drag-on{user-select:none}
 [data-sz]{overflow:hidden!important;transition:height .12s ease-out}.gp-drag-on[data-sz]{transition:none}
 [data-sz]:not([data-sz=full]):after{content:'';position:absolute;left:0;right:0;bottom:0;height:22px;background:linear-gradient(transparent,rgba(10,10,12,.97));pointer-events:none;border-radius:0 0 14px 14px}
 [data-sz=compact] :is(.act-t,.mkd-c .t){-webkit-line-clamp:1!important;white-space:nowrap;text-overflow:ellipsis;display:block!important}
 [data-sz=compact] :is(.act-f,.mkd-c .f){display:none!important}
 [data-sz=row] :is(.act-k,.mkd-c){display:flex!important;gap:8px;align-items:center;padding:7px 10px!important}
 [data-sz=row] :is(.act-m,.mkd-c .m){flex:none;max-width:45%}[data-sz=row] :is(.act-t,.mkd-c .t){margin:0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block!important;-webkit-line-clamp:unset}
 [data-sz=row] :is(.act-f,.mkd-c .f){display:none!important}
 [data-sz=tabs]>*:not(.act-h):not(.mkd-th):not(.gp-grab){visibility:hidden}
 @media(max-width:1179px){.gp-ctl,.gp-dock{display:none!important}.gp-hid{display:revert!important}}`;
 document.head.append(css);
 const ctl={},dockL=document.createElement('div'),dockR=document.createElement('div');dockL.className='gp-dock';dockR.className='gp-dock';document.body.append(dockL,dockR);
 for(const [id,label] of P){const c=document.createElement('div');c.className='gp-ctl';c.innerHTML=`<button type="button" class="gp-drag" title="Drag to move" aria-label="Move ${label}">⋮⋮</button><button type="button" class="gp-pin" title="Pin" aria-label="Pin ${label}" aria-pressed="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 6 3 3H7l3-3z"/><path d="M12 16v5"/></svg></button><button type="button" class="gp-min" title="Minimise" aria-label="Minimise ${label}">−</button>`;document.body.append(c);ctl[id]=c;
  c.querySelector('.gp-min').onclick=()=>{L.min[id]=1;save();sync();};
  c.querySelector('.gp-pin').onclick=()=>{if(L.free[id]){delete L.free[id];delete L.pos[id];}else L.free[id]=1;save();sync();};
  const dr=c.querySelector('.gp-drag');dr.onpointerdown=e=>{const el=find(id);if(!el)return;e.preventDefault();dr.setPointerCapture(e.pointerId);const p0=L.pos[id]||[0,0],x0=e.clientX,y0=e.clientY;
   dr.onpointermove=ev=>{L.pos[id]=[p0[0]+ev.clientX-x0,p0[1]+ev.clientY-y0];el.style.translate=L.pos[id][0]+'px '+L.pos[id][1]+'px';place();};
   dr.onpointerup=()=>{dr.onpointermove=null;save();};};}
 const find=id=>{const p=P.find(x=>x[0]===id);return p&&document.querySelector(p[4]);};
 const shown=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';};
 function place(){for(const [id] of P){const el=find(id),c=ctl[id];if(!big()||!el||L.min[id]||!shown(el)){c.classList.remove('on');continue;}const r=el.getBoundingClientRect();c.classList.add('on');c.style.top=(r.top+12)+'px';c.style.left=(r.right-c.offsetWidth-(id==='top'?54:12))+'px';}
  const lc=document.getElementById('lcol')?.getBoundingClientRect();dockL.style.left=((lc&&lc.width?lc.left:24))+'px';dockL.style.bottom='16px';dockR.style.right='24px';dockR.style.bottom='16px';}
 function sync(){const m=mode();
  for(const [id,label,side,md] of P){const el=find(id);if(!el)continue;const hid=!!L.min[id]&&big();el.classList.toggle('gp-hid',hid);el.style.translate=L.free[id]&&L.pos[id]&&big()?L.pos[id][0]+'px '+L.pos[id][1]+'px':'';
   const c=ctl[id];c.querySelector('.gp-pin').setAttribute('aria-pressed',String(!L.free[id]));c.querySelector('.gp-drag').hidden=!L.free[id];}
  const chips=s=>P.filter(p=>p[2]===s&&p[3]===m&&L.min[p[0]]&&find(p[0])).map(([id,label])=>`<button type="button" class="gp-chip" data-gp="${id}"><i></i>${label} ＋</button>`).join('');
  dockL.innerHTML=chips('l');dockR.innerHTML=chips('r');dockL.classList.toggle('on',!!dockL.innerHTML&&big());dockR.classList.toggle('on',!!dockR.innerHTML&&big());
  for(const [id,sel] of STRIPS){const el=document.querySelector(sel);if(el)size(id,el);}
  place();}
 document.addEventListener('click',e=>{const ch=e.target.closest('[data-gp]');if(ch){delete L.min[ch.dataset.gp];save();sync();}});
 // bottom strips (owner 15 Nov 2026): drag the handle to any height. Content adapts in four steps: full, compact, row, tabs only.
 const MINH=58,MAXH=380,DEF=150,step=h=>h>=190?'full':h>=125?'compact':h>=80?'row':'tabs';
 function size(id,el,h){if(!big()){el.style.removeProperty('height');el.removeAttribute('data-sz');return;}h=h??L.h[id];if(h==null){el.style.removeProperty('height');el.dataset.sz=step(el.offsetHeight||DEF);return;}
  el.style.setProperty('height',h+'px','important');el.style.setProperty('max-height','none','important');el.dataset.sz=step(h);document.documentElement.style.setProperty('--acth',h+'px');}
 const grab=()=>{for(const [id,sel,head] of STRIPS){const el=document.querySelector(sel);if(!el)continue;if(L.crop[id]){L.h[id]=MINH;delete L.crop[id];save();}
  if(el.querySelector(':scope>.gp-grab')){if(L.h[id]!=null&&el.style.height!==L.h[id]+'px')size(id,el);continue;}if(!el.querySelector(head))continue;
  const g=document.createElement('button');g.type='button';g.className='gp-grab';g.title='Drag to resize · double-click to restore';g.setAttribute('aria-label','Resize this panel');el.prepend(g);size(id,el);
  let y0=null,h0=0;g.onpointerdown=e=>{e.preventDefault();y0=e.clientY;h0=el.offsetHeight;g.setPointerCapture(e.pointerId);el.classList.add('gp-drag-on');};
  g.onpointermove=e=>{if(y0==null)return;const h=Math.round(Math.max(MINH,Math.min(MAXH,h0-(e.clientY-y0))));L.h[id]=h;size(id,el,h);};
  g.onpointerup=()=>{if(y0==null)return;y0=null;el.classList.remove('gp-drag-on');if(L.h[id]>MINH)L.hl[id]=L.h[id];save();};
  g.ondblclick=()=>{L.h[id]=L.h[id]<=MINH?(L.hl[id]||DEF):MINH;size(id,el);save();};
  g.onkeydown=e=>{if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;e.preventDefault();L.h[id]=Math.max(MINH,Math.min(MAXH,(L.h[id]||el.offsetHeight)+(e.key==='ArrowUp'?20:-20)));size(id,el);save();};}};
 new MutationObserver(()=>{grab();}).observe(document.body,{childList:true,subtree:true});
 addEventListener('resize',sync);setInterval(()=>{if(big())sync();},700);grab();sync();
})();
