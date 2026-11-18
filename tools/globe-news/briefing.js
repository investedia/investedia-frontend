// Briefing (owner 16 Nov 2026): a short spoken market briefing on the globe. Button states: Briefing (waiting) → playing → Briefed.
// Text is built only from data already on the page: closing index moves (markets.json), the top articles, the next calendar release.
// Voice: the browser's built-in speech for now (no account, no cost). An Azure voice can replace speak() later without UI changes.
(()=>{
 const synth=window.speechSynthesis;if(!synth)return;
 if(document.documentElement.classList.contains('embed')||/[?&]embed=1/.test(location.search)||window.top!==window.self)return; // full Globe page only, never the homepage frame
 const st=document.createElement('style');st.textContent=`
 .bf-btn{position:fixed;z-index:31;display:inline-flex;align-items:center;gap:10px;background:rgba(12,12,15,.95);border:1px solid #5a3214;border-radius:999px;padding:5px 14px 5px 5px;color:#ececef;font:600 13.5px Inter,sans-serif;cursor:pointer}
 .bf-btn small{font:500 12.5px Inter,sans-serif;color:#8a8a92}.bf-btn.play small{color:#ff9d5c}
 .bf-ic{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1d130b;box-shadow:0 0 0 5px #ff7a1a1c,0 0 22px #ff7a1a44;flex:none}
 .bf-btn.done{border-color:#2a2a2f;color:#d4d4d8}.bf-btn.done .bf-ic{background:#18181b;box-shadow:none}
 .bf-card{position:fixed;z-index:32;width:min(500px,calc(100vw - 24px));background:rgba(12,12,15,.98);border:1px solid #3a2414;border-radius:22px;padding:16px 18px;box-shadow:0 30px 80px #000c;color:#ececef;font:14px/1.45 Inter,sans-serif}
 .bf-card[hidden],.bf-btn[hidden]{display:none!important}
 .bf-h{display:flex;align-items:center;gap:12px}.bf-h .bf-ic{width:50px;height:50px}.bf-h small{display:block;color:#8a8a92;font-size:11px;letter-spacing:.08em;text-transform:uppercase}.bf-h b{font-size:19px}
 .bf-pp{width:40px;height:40px;border-radius:50%;background:#fff;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-left:auto;flex:none}
 .bf-eq{display:inline-flex;gap:2px;align-items:flex-end;height:12px}.bf-eq b{width:2px;background:#ff9d5c;border-radius:1px;animation:bfq .9s ease-in-out infinite}.bf-eq b:nth-child(2){animation-delay:.2s}.bf-eq b:nth-child(3){animation-delay:.4s}@keyframes bfq{0%,100%{height:3px}50%{height:12px}}
 .bf-x{background:none;border:0;color:#8a8a92;font-size:18px;cursor:pointer;padding:4px 6px}
 .bf-list{max-height:min(46vh,340px);overflow:auto;margin-top:8px}
 .bf-b{background:#141417;border:1px solid #232327;border-radius:16px 16px 16px 4px;padding:10px 12px;margin:8px 0;cursor:pointer}.bf-b.on{border-color:#5a3214;background:#1a120b;color:#fff}.bf-b.past{opacity:.55}
 .bf-ctl{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.bf-ctl button{border:1px solid #232327;border-radius:999px;padding:5px 12px;font:13px Inter,sans-serif;color:#ddd;background:#141417;cursor:pointer}
 .bf-note{color:#77777f;font-size:11.5px;margin-top:10px}
 /* Owner 17 Nov 2026: slim bottom player so the globe stays visible while it briefs */
 .bf-card{left:50%!important;top:auto!important;transform:translateX(-50%);bottom:var(--bf-bottom,110px);width:min(620px,calc(100vw - 32px));padding:10px 12px 12px;border-radius:18px;background:rgba(12,12,15,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
 .bf-card:not([hidden]){animation:bfin .28s cubic-bezier(.2,.8,.2,1)}@keyframes bfinm{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes bfin{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
 .bf-row{display:flex;align-items:center;gap:10px}
 .bf-ib,.bf-pp,.bf-tr{transition:background .15s,transform .15s}.bf-pp:active,.bf-ib:active{transform:scale(.92)}
 .bf-row .bf-ic{width:30px;height:30px;flex:none}
 .bf-cap{flex:1;min-width:0}.bf-cap small{display:block;color:#8a8a92;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
 .bf-cap p{margin:0;color:#f4f4f5;font:500 14.5px/1.45 Inter,system-ui,sans-serif;letter-spacing:-.005em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
 .bf-ib{width:36px;height:36px;border-radius:50%;border:1px solid #2a2a2f;background:#141417;color:#d4d4d8;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;font-size:13px}
 .bf-ib:hover{background:#1f1f24;border-color:#3a3a40;color:#fff}.bf-card .bf-x.bf-ib{border-color:transparent;background:transparent;color:#8a8a92;font-size:0}.bf-row .bf-pp{width:42px;height:42px;margin-left:0;background:#ff7a1a;box-shadow:0 0 0 4px #ff7a1a22}.bf-row .bf-pp svg path,.bf-row .bf-pp svg rect{fill:#111}
 .bf-bar{height:2px;background:#232327;border-radius:2px;margin-top:9px;overflow:hidden}.bf-bar i{display:block;height:100%;background:#ff7a1a;transition:width .4s}
 .bf-tr{border:1px solid #2a2a2f;border-radius:999px;background:#141417;color:#d4d4d8;font:500 12.5px Inter,system-ui,sans-serif;padding:0 14px;height:36px;cursor:pointer;flex:none}.bf-tr.on{border-color:#5a3214;color:#ff9d5c}
 .bf-card .bf-list{max-height:min(34vh,260px);margin-top:8px}.bf-card .bf-b{font-size:13.5px;padding:8px 10px;margin:6px 0}
 .bf-card .bf-ctl{margin-top:6px}.bf-card .bf-note{font-size:11px;margin-top:6px}

 .bf-tc{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:4}
 .bf-stack{position:fixed;z-index:59;display:flex;flex-direction:column;gap:8px;width:min(420px,calc(100vw - 24px));opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .35s ease;pointer-events:none}
 .bf-stack.on{opacity:1;transform:none;pointer-events:auto}
 .bf-mvs{display:flex;gap:6px;flex-wrap:wrap}.bf-pl{display:inline-flex;gap:8px;align-items:center;background:rgba(12,12,15,.94);border:1px solid #2e2e33;border-radius:999px;padding:5px 11px;font:500 12.5px Inter,sans-serif;color:#ececef}
 .bf-mv{font:600 12px Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#b5b5bd}.bf-mv.u{color:#34d399}.bf-mv.d{color:#f87171}
 .bf-art{display:flex;gap:10px;align-items:center;background:rgba(12,12,15,.96);border:1px solid #2a2a2f;border-radius:16px;padding:9px;text-decoration:none;color:#ececef}
 .bf-art img{width:76px;height:56px;border-radius:10px;object-fit:cover;flex:none}.bf-art span{min-width:0;display:flex;flex-direction:column;gap:2px}
 .bf-art small{font-size:10.5px;letter-spacing:.06em;color:#ffb27a}.bf-art b{font:600 13px/1.3 Inter,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.bf-art i{font-style:normal;font-size:12px;color:#b5b5bd}
 @media(max-width:760px){html.bf-touring :is(#dock,.peek,#nav-grab,.zoom,.zloc,.m-filters,#tf-chip){opacity:0!important;pointer-events:none!important;transition:opacity .3s}html.bf-touring .bf-card{bottom:24px!important}}
 @media(prefers-reduced-motion:reduce){.bf-stack{transition:none}}
 @media(max-width:760px){.bf-card{left:8px!important;right:8px;transform:none;width:auto;bottom:calc(var(--dock-h,78px) + 10px);max-height:none;overflow:visible;z-index:60;border-radius:18px}.bf-card .bf-list{max-height:30vh}.bf-cap p{font-size:13.5px}.bf-row{flex-wrap:wrap;row-gap:6px}.bf-cap{flex:1 1 calc(100% - 44px)}.bf-row .bf-ib.prev{margin-left:auto}.bf-row .bf-x{margin-right:auto}.bf-card:not([hidden]){animation-name:bfinm}.bf-row .bf-pp{width:46px;height:46px}.bf-ib.prev,.bf-ib.next{width:30px}.bf-btn{padding:4px;gap:0}.bf-btn b,.bf-btn small{display:none}}
 .bf-bar{cursor:pointer;position:relative;touch-action:none}.bf-bar::before{content:'';position:absolute;left:0;right:0;top:-8px;bottom:-8px}.bf-card:hover .bf-bar,.bf-bar.drag{height:4px}
 .bfm{display:none}
 @media(max-width:760px){.bf-card.m{padding:18px 18px 16px;border-radius:24px;background:linear-gradient(180deg,rgba(28,28,33,.92),rgba(14,14,17,.96));-webkit-backdrop-filter:blur(28px);backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,.08)}
  .bf-card.m>.bf-row,.bf-card.m>.bf-bar{display:none}.bf-card.m .bfm{display:block}
  .bfm-h{display:flex;justify-content:space-between;gap:10px}.bfm-e{font:600 11px Inter,sans-serif;letter-spacing:.12em;color:#ff9d5c;text-transform:uppercase}.bfm-t{font:600 16.5px/1.3 Inter,sans-serif;margin-top:6px;color:#f4f4f5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .bfm-x{all:unset;cursor:pointer;width:32px;height:32px;display:grid;place-items:center;color:#8a8a93;margin:-6px -8px 0 0;flex:none}
  .bfm-s{position:relative;height:4px;border-radius:2px;background:rgba(255,255,255,.16);margin-top:18px;touch-action:none;cursor:pointer}.bfm-s::before{content:'';position:absolute;left:0;right:0;top:-12px;bottom:-12px}
  .bfm-s i{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:#fff}.bfm-s b{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;box-shadow:0 1px 6px #0008;transition:transform .15s}.bfm-s.drag b{transform:scale(1.3)}
  .bfm-s u{position:absolute;top:-3px;width:2px;height:10px;border-radius:1px;background:rgba(255,255,255,.35)}
  .bfm-tm{display:flex;justify-content:space-between;font:500 11.5px Inter,sans-serif;color:#8a8a93;margin-top:8px;font-variant-numeric:tabular-nums}
  .bfm-c{display:flex;align-items:center;justify-content:center;gap:26px;margin-top:8px}.bfm-c button{all:unset;cursor:pointer;color:#e4e4e7;display:grid;place-items:center;width:40px;height:40px;border-radius:50%}.bfm-c button:active{transform:scale(.9)}
  .bfm-c .bfm-p{width:58px;height:58px;background:#fff;color:#000}
  .bfm-ch{display:flex;gap:6px;margin-top:12px;overflow-x:auto;scrollbar-width:none}.bfm-ch::-webkit-scrollbar{display:none}.bfm-ch button{all:unset;cursor:pointer;flex:none;font:500 11.5px Inter,sans-serif;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.06);color:#a1a1aa}.bfm-ch button.on{background:rgba(255,122,26,.16);color:#ffb27a}
  .bfm-f{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.bfm-f button{all:unset;cursor:pointer;font:500 12px Inter,sans-serif;color:#a1a1aa}.bfm-f button.on{color:#ff9d5c}}`;
 document.head.append(st);
 const RING='<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="#ff7a1a" stroke-width="1.6"/></svg>';
 const DONE='<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="#8a8a92" stroke-width="1.6"/><path d="m8 12.2 2.6 2.6L16 9.4" fill="none" stroke="#ececef" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const PLAY='<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="#111"/></svg>',PAUSE='<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="#111"/></svg>';
 const store=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{return null}};
 const firstName=()=>{if(store('inv-brief-name')==='off')return '';try{const u=window.invUser||(()=>{for(const k of Object.keys(localStorage))if(/^sb-.*-auth-token$/.test(k)){const v=JSON.parse(localStorage.getItem(k));return v?.user||v?.currentSession?.user;}})();const md=u?.user_metadata||{};return String(md.first_name||md.given_name||md.name||md.full_name||'').trim().split(/\s+/)[0]||'';}catch{return ''}};
 const pct=v=>`${Math.abs(v).toFixed(Math.abs(v)>=1?1:2)} percent`;
 const mv=(n,v)=>!Number.isFinite(v)?'':Math.abs(v)<0.05?`${n} was flat`:`${n} ${v>0?'rose':'fell'} ${pct(v)}`;
 const join=a=>{a=a.filter(Boolean);return a.length<2?a[0]||'':a.slice(0,-1).join(', ')+' and '+a.at(-1)};
 let CH=[],day='',cur=0,playing=false,utt=null,REC=null,greeted=false;
 // Recorded Briefing (Azure voice, made by tools/briefing/make_briefing.py from an approved script). Falls back to the browser voice when absent.
 const AU=new Audio();AU.preload='none';const GR=new Audio();GR.preload='none';
 fetch('../briefing/index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{const d=j&&j.days&&j.days[0];if(d&&Date.now()-Date.parse(d.date)<4*864e5){REC=d;AU.src='../briefing/'+d.audio;if(!playing){build();paintBtn();}}}).catch(()=>{});
 const API=()=>((window.INV_CONFIG&&INV_CONFIG.apiBaseUrl)||'').replace(/\/$/,'');
 AU.addEventListener('timeupdate',()=>{if(!REC)return;let i=0;CH.forEach((c,k)=>{if(AU.currentTime>=c.s)i=k;});if(i!==cur){cur=i;tour(CH[i]);paintCard();}paintBtn();if(AU.duration&&AU.currentTime/AU.duration>.9)store('inv-briefed',day);});
 AU.addEventListener('ended',()=>{tour(null);playing=false;store('inv-briefed',day);cur=0;paintBtn();paintCard();});

 // ---- Briefing tour (owner 17 Nov 2026): while the voice reads, the globe moves to each region, draws a line from the event to the
 // asset it moved (company lines end at the headquarters), shows the move on the line, the article card, and zooms into a company HQ.
 // Cues come from the approved script (@move, @from, @to, @article, @hq), so every figure is the one written for that day.
 let HQS=null;fetch('company-hq.json').then(r=>r.ok?r.json():null).then(j=>{HQS=(j&&j.companies)||{};}).catch(()=>{});
 const tc=document.createElement('canvas');tc.className='bf-tc';document.body.append(tc);const tx=tc.getContext('2d');
 const stack=document.createElement('div');stack.className='bf-stack';document.body.append(stack);
 let T=null,tRaf=0;
 const locOf=sym=>{const h=HQS&&HQS[sym];if(h&&Number.isFinite(h.hq_lat))return {lat:h.hq_lat,lon:h.hq_lon,label:`${h.company_label||sym} · ${h.hq_city} HQ`};const a=MKT.by?.[sym];return a&&Number.isFinite(a.la)?{lat:a.la,lon:a.lo,label:a.n||sym}:null;};
 const pill=(v)=>`<span class="bf-mv ${v>0?'u':v<0?'d':''}">${v>0?'↑':v<0?'↓':'↔'} ${Math.abs(v).toFixed(2)}%</span>`;
 function tour(c){
  if(!c){T=null;stack.innerHTML='';stack.classList.remove('on');document.documentElement.classList.remove('bf-touring');if(tRaf)cancelAnimationFrame(tRaf);tRaf=0;tx.clearRect(0,0,tc.width,tc.height);return;}
  document.documentElement.classList.add('bf-touring');
  const hq=c.hq?locOf(c.hq):null;
  try{if(hq&&typeof flyTo==='function')flyTo(hq.lon,Math.max(-60,Math.min(60,hq.lat)),Math.min(typeof ZMAX!=='undefined'?ZMAX:4,3.2),1500);else if(c.f&&typeof flyTo==='function')flyTo(c.f[0],Math.max(-60,Math.min(60,c.f[1])),c.f[2]||1.6,1300);}catch{}
  const to=c.to?locOf(c.to):null,from=c.from||null;
  T={c,t0:performance.now(),line:from&&to?{a:{phi:from.lat*rad,lam:from.lon*rad},b:{phi:to.lat*rad,lam:to.lon*rad},la:from.label,lb:to.label,v:(c.moves||[]).find(m=>m[1]===c.to)?.[2]}:null,hq:hq&&!to?{p:{phi:hq.lat*rad,lam:hq.lon*rad},label:hq.label,v:(c.moves||[]).find(m=>m[1]===c.hq)?.[2]}:null};
  const mvAll=(c.moves||[]).filter(m=>m[1]!==c.to&&m[1]!==c.hq),art=c.art;
  // owner 17 Nov: show each move on the globe at its market (index exchange city, company HQ); only moves without a place stay above the player
  const seen={};T.pins=[];const mv=[];for(const m of mvAll){const L=locOf(m[1]);if(L){const k=L.lat.toFixed(1)+','+L.lon.toFixed(1),n=seen[k]=(seen[k]||0)+1;T.pins.push({p:{phi:L.lat*rad,lam:L.lon*rad},label:m[0],v:m[2],row:n-1});}else mv.push(m);}
  stack.innerHTML=(mv.length?`<div class=bf-mvs>${mv.map(([n,,v])=>`<span class=bf-pl><b>${n.replace(/</g,'&lt;')}</b>${pill(v)}</span>`).join('')}</div>`:'')+
   (art?`<a class=bf-art ${art.id?`data-st="${art.id}"`:''} href="${art.id?'#':''}">${art.img?`<img src="${art.img.startsWith('http')?art.img:'../globe/'+art.img}" alt="" loading="lazy">`:''}<span><small>${(art.cat||'').toUpperCase()}${art.src?' · '+art.src:''}</small><b>${art.h.replace(/</g,'&lt;')}</b>${art.sym&&Number.isFinite(art.v)?`<i>${art.sym} ${pill(art.v)}</i>`:''}</span></a>`:'');
  stack.classList.toggle('on',!!stack.innerHTML);place();
  stack.querySelector('[data-st]')?.addEventListener('click',e=>{e.preventDefault();const st=(stories||[]).find(x=>x.id===e.currentTarget.dataset.st);if(st&&typeof openStory==='function')openStory(st);});
  if(!tRaf)tRaf=requestAnimationFrame(draw);
 }
 function place(){const r=card.getBoundingClientRect();stack.style.left=(matchMedia('(max-width:760px)').matches?12:r.left)+'px';stack.style.bottom=(innerHeight-r.top+10)+'px';}
 function draw(){
  tRaf=0;if(!T)return;const dpr=Math.min(2,devicePixelRatio||1);if(tc.width!==innerWidth*dpr){tc.width=innerWidth*dpr;tc.height=innerHeight*dpr;}
  tx.setTransform(dpr,0,0,dpr,0,0);tx.clearRect(0,0,innerWidth,innerHeight);
  const k=Math.min(1,(performance.now()-T.t0-500)/1400),e=k<0?0:1-Math.pow(1-k,3);
  // Pill label: each part measured in the font it is drawn in; flips to the left of the point when it would leave the screen.
  const label=(x,y,t,v)=>{const vt=Number.isFinite(v)?`${v>0?'↑':v<0?'↓':'↔'} ${Math.abs(v).toFixed(2)}%`:'';
   tx.font='500 12.5px Inter,sans-serif';let tw=tx.measureText(t).width;tx.font='600 12.5px Inter,sans-serif';const vw=vt?tx.measureText(vt).width:0;
   const gap=vt?10:0,pad=12,maxW=innerWidth-24;if(tw+gap+vw+pad*2>maxW){tw=Math.max(40,maxW-gap-vw-pad*2);}
   const w=tw+gap+vw+pad*2;let L=x+10;if(L+w>innerWidth-12){if(x-10-w>=12)L=x-10-w;else{L=Math.max(12,Math.min(innerWidth-12-w,x-w/2));y-=30;}}  // neither side fits: above the point
   tx.fillStyle='rgba(12,12,15,.94)';tx.strokeStyle='#ff7a1a';tx.lineWidth=1;tx.beginPath();tx.roundRect(L,y-14,w,28,14);tx.fill();tx.stroke();
   tx.save();tx.beginPath();tx.rect(L+pad,y-14,tw,28);tx.clip();tx.font='500 12.5px Inter,sans-serif';tx.fillStyle='#ececef';tx.fillText(t,L+pad,y+4.5);tx.restore();
   if(vt){tx.font='600 12.5px Inter,sans-serif';tx.fillStyle=v>0?'#34d399':v<0?'#f87171':'#b5b5bd';tx.fillText(vt,L+pad+tw+gap,y+4.5);}};
  if(T.line&&typeof arcGeom==='function'&&typeof proj==='function'){const pts=arcGeom(T.line.a,T.line.b,64,.22),n=Math.max(1,Math.round(pts.length*e));
   tx.strokeStyle='#ff7a1a';tx.lineWidth=2.2;tx.shadowColor='#ff7a1a';tx.shadowBlur=10;tx.beginPath();let last=null;
   for(let i=0;i<n;i++){const [x,y,z]=proj(pts[i][0],pts[i][1],pts[i][2]);if(z<=0){last=null;continue;}last?tx.lineTo(x,y):tx.moveTo(x,y);last=[x,y];}tx.stroke();tx.shadowBlur=0;
   const A=proj(T.line.a.phi,T.line.a.lam);if(A[2]>0){tx.fillStyle='#ff7a1a';tx.beginPath();tx.arc(A[0],A[1],4.5,0,7);tx.fill();if(T.line.la)label(A[0],A[1],T.line.la);}
   if(last&&e>=1)label(last[0],last[1],T.line.lb,T.line.v);}
  if(T.pins&&T.pins.length&&typeof proj==='function'){const used=[];T.pins.forEach((q,i)=>{const kk=Math.min(1,Math.max(0,(performance.now()-T.t0-900-i*350)/500));if(kk<=0)return;const [x,y,z]=proj(q.p.phi,q.p.lam);if(z<=0)return;
   tx.globalAlpha=kk;if(!q.row){tx.fillStyle='#ff7a1a';tx.shadowColor='#ff7a1a';tx.shadowBlur=12;tx.beginPath();tx.arc(x,y,4.5,0,7);tx.fill();tx.shadowBlur=0;}let ly=y;while(used.some(u=>Math.abs(u[0]-x)<60&&Math.abs(u[1]-ly)<32))ly+=34;used.push([x,ly]);label(x,ly,q.label,q.v);tx.globalAlpha=1;});}
  if(T.hq&&typeof proj==='function'){const [x,y,z]=proj(T.hq.p.phi,T.hq.p.lam);if(z>0){tx.globalAlpha=Math.max(0,e);tx.fillStyle='#ff7a1a';tx.shadowColor='#ff7a1a';tx.shadowBlur=16;tx.beginPath();tx.arc(x,y,5.5,0,7);tx.fill();tx.shadowBlur=0;label(x,y,T.hq.label,T.hq.v);tx.globalAlpha=1;}}
  tRaf=requestAnimationFrame(draw);
 }
 addEventListener('resize',()=>{if(T)place();});
 function build(){
  if(REC){const nm=firstName(),hr=new Date().getHours(),hi=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';day=REC.date;CH=REC.chapters.map((c,i)=>({...c,h:i?undefined:(nm?`${hi}, ${nm}`:hi)}));return;}
  const by=MKT.by||{},q=s=>by[s]?.d,asof=Date.parse(MKT.asof||'');day=Number.isFinite(asof)?new Date(asof).toISOString().slice(0,10):'';
  const wd=Number.isFinite(asof)?new Date(asof).toLocaleDateString('en-GB',{weekday:'long'}):'the last session';
  const nm=firstName(),hr=new Date().getHours(),hi=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
  CH=[{t:`${nm?`Hey ${nm}. `:''}Here’s what moved markets.`,h:nm?`${hi}, ${nm}`:hi}];
  const us=join([mv('the S&P 500',q('^GSPC')),mv('the Nasdaq',q('^IXIC')),mv('the Dow',q('^DJI'))]);if(us)CH.push({t:`In the United States on ${wd}, ${us}.`,f:[-98,38]});
  const eu=join([mv('the DAX',q('^GDAXI')),mv('the FTSE 100',q('^FTSE')),mv('the Euro Stoxx 50',q('^STOXX50E'))]);if(eu)CH.push({t:`In Europe, ${eu}.`,f:[8,49]});
  const as=join([mv('the Nikkei',q('^N225')),mv('the Hang Seng',q('^HSI'))]);if(as)CH.push({t:`In Asia, ${as}.`,f:[125,30]});
  const cm=join([Number.isFinite(q('BZ=F'))?`Brent crude ${Math.abs(q('BZ=F'))<0.05?'was flat':(q('BZ=F')>0?'rose ':'fell ')+(Math.abs(q('BZ=F'))<0.05?'':pct(q('BZ=F')))}${by['BZ=F']?.p?` at ${by['BZ=F'].p.toFixed(2)} dollars`:''}`:'',mv('gold',q('GC=F'))]);if(cm)CH.push({t:`${cm[0].toUpperCase()+cm.slice(1)}.`});
  const top=(stories||[]).filter(s=>Date.now()-s.t<48*36e5).sort((a,b)=>(b.market_moving?1:0)-(a.market_moving?1:0)||(b.importance||0)-(a.importance||0)||b.t-a.t).slice(0,3);
  top.forEach((s,i)=>CH.push({t:`${i?'Also':'In the news'}${s.location?.country?`, ${nm2(s.location.country)}`:''}: ${s.headline.replace(/\.$/,'')}.`,f:Number.isFinite(s.location?.lon)?[s.location.lon,s.location.lat]:null,id:s.id}));
  const nx=(typeof CAL!=='undefined'?CAL:[]).filter(e=>Date.parse(e.at)>Date.now()).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0];
  if(nx)CH.push({t:`Coming up: ${nx.t}, ${new Date(nx.at).toLocaleDateString('en-GB',{weekday:'long'})}.`});
  CH.push({t:'That’s your Briefing. Not investment advice.'});
 }
 const nm2=c=>typeof nm==='function'?nm(c):c;
 const total=()=>REC?Math.round(REC.duration*14):CH.reduce((s,c)=>s+c.t.length,0),secs=n=>Math.round(n/14),fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
 const done=()=>store('inv-briefed')===day&&day;
 const btn=document.createElement('button');btn.type='button';btn.className='bf-btn';btn.setAttribute('aria-label','Briefing');document.body.append(btn);
 const card=document.createElement('div');card.className='bf-card';card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label','Briefing');document.body.append(card);
 // owner 17 Nov 2026: Briefing only in News and Markets, never in Projects
 setInterval(()=>{const pj=typeof PROJ!=='undefined'&&PROJ.on;btn.hidden=pj;if(pj&&!card.hidden){card.hidden=true;stop();}},400);
 function paintBtn(){const el=REC?Math.round(AU.currentTime*14):CH.slice(0,cur).reduce((s,c)=>s+c.t.length,0);
  if(playing){btn.className='bf-btn play';btn.innerHTML=`<span class=bf-ic>${RING}</span><b>Briefing</b>${card.hidden?'<i class=bf-eq><b></b><b></b><b></b></i>':`<small>${fmt(secs(el))} / ${fmt(secs(total()))}</small>`}`;}
  else if(done()){btn.className='bf-btn done';btn.innerHTML=`<span class=bf-ic>${DONE}</span><b>Briefed</b><small>${day?new Date(day).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):''}</small>`;}
  else{btn.className='bf-btn';btn.innerHTML=`<span class=bf-ic>${RING}</span><b>Briefing</b>`;}
  const b=document.querySelector('.brand')?.getBoundingClientRect(),phone=matchMedia('(max-width:760px)').matches;
  if(phone){const m=document.querySelector('.m-actions')?.getBoundingClientRect();btn.style.top=((m?.top||12))+'px';btn.style.left='';btn.style.right=((m?innerWidth-m.left:12)+8)+'px';}
  else{const q=(document.getElementById('sbox')||document.getElementById('q'))?.getBoundingClientRect();btn.style.right='';btn.style.top=((q&&q.top>0?q.top:(b?.bottom||60)+10))+'px';btn.style.left=((q&&q.right>0?q.right:(b?.right||400))+24)+'px';}
  card.style.top='';card.style.left='';if(!phone){const lb=[...document.querySelectorAll('button,a')].find(e=>/^Latest activity$/.test(e.textContent.trim()));const bar=lb&&lb.closest('div[class]')?.parentElement?.getBoundingClientRect();card.style.setProperty('--bf-bottom',((bar&&bar.top>innerHeight*.5?innerHeight-bar.top:96)+14)+'px');}}
 let tr=false;
 // ---- Player position and seeking (owner 17 Nov 2026): tap or drag the timeline to go back or forward; phone uses the player card (option C).
 const mPhone=()=>matchMedia('(max-width:760px)').matches;
 const dur=()=>REC?(Number.isFinite(AU.duration)&&AU.duration>0?AU.duration:REC.duration||0):0;
 const pos=()=>{if(REC){const d=dur();return d?Math.min(1,AU.currentTime/d):0;}const tot=total()||1;return Math.min(1,CH.slice(0,cur).reduce((a,c)=>a+c.t.length,0)/tot);};
 const chStart=i=>REC?(CH[i]?.s||0)/(dur()||1):CH.slice(0,i).reduce((a,c)=>a+c.t.length,0)/(total()||1);
 const chName=(c,i)=>{const m=c.moves&&c.moves[0]&&c.moves[0][0];if(m)return m;if(c.hq)return c.hq;if(i===0)return 'Intro';if(i===CH.length-1)return 'Close';return (c.t||'').split(/\s+/).slice(0,2).join(' ').replace(/[.,:;]$/,'');};
 function seekTo(f){f=Math.max(0,Math.min(1,f));
  if(REC){const d=dur();if(!d)return;AU.currentTime=f*d;let i=0;CH.forEach((c,k)=>{if(AU.currentTime>=(c.s||0))i=k;});if(i!==cur){cur=i;if(playing)tour(CH[i]);}paintCard();paintBtn();return;}
  let i=0;CH.forEach((c,k)=>{if(f>=chStart(k))i=k;});speak(i);}
 function resume(){if(REC&&AU.currentTime>0&&!AU.ended){playing=true;tour(CH[cur]);AU.play().catch(()=>{playing=false;paintBtn();paintCard();});paintBtn();paintCard();return true;}return false;}
 const IC={b15:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><text x="12" y="15.4" text-anchor="middle" font-size="7.5" fill="currentColor" stroke="none" font-family="Inter" font-weight="700">15</text></svg>',
  f15:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/><text x="12" y="15.4" text-anchor="middle" font-size="7.5" fill="currentColor" stroke="none" font-family="Inter" font-weight="700">15</text></svg>',
  pr:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',nx:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
  pl:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',pa:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>',
  x:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
 function mCard(h,esc){const p=pos(),d=REC?dur():secs(total()),el=REC?AU.currentTime:p*d,dl=new Date(day);
  return `<div class=bfm><div class=bfm-h><div style="min-width:0"><div class=bfm-e>Briefing${day&&!isNaN(dl)?' · '+dl.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):''}</div><div class=bfm-t>${esc(CH[cur]?.t||h)}</div></div><button type=button class="bfm-x bf-x" aria-label="Close">${IC.x}</button></div>
  <div class=bfm-s data-seek role=slider tabindex=0 aria-label="Briefing position" aria-valuemin=0 aria-valuemax=100 aria-valuenow="${Math.round(p*100)}">${CH.map((c,i)=>i?`<u style="left:${(chStart(i)*100).toFixed(1)}%"></u>`:'').join('')}<i style="width:${(p*100).toFixed(1)}%"></i><b style="left:${(p*100).toFixed(1)}%"></b></div>
  <div class=bfm-tm><span>${fmt(Math.round(el))}</span><span>−${fmt(Math.max(0,Math.round(d-el)))}</span></div>
  <div class=bfm-c><button type=button data-bf=b15 aria-label="Back 15 seconds">${IC.b15}</button><button type=button data-bf=prev aria-label="Previous">${IC.pr}</button><button type=button class="bfm-p bf-pp" aria-label="${playing?'Pause':'Play'}">${playing?IC.pa:IC.pl}</button><button type=button data-bf=next aria-label="Next">${IC.nx}</button><button type=button data-bf=f15 aria-label="Forward 15 seconds">${IC.f15}</button></div>
  <div class=bfm-ch>${CH.map((c,i)=>`<button type=button data-i="${i}" class="${i===cur?'on':''}">${esc(chName(c,i))}</button>`).join('')}</div>
  <div class=bfm-f><button type=button data-bf=tr class="${tr?'on':''}">${tr?'Hide transcript':'Transcript'}</button><span style="font-size:11px;color:#6f6f77">Not investment advice</span></div></div>`;}
 // drag or tap on a timeline (PC bar or phone scrubber); arrow keys step 5 s
 let drag=null;
 card.addEventListener('pointerdown',e=>{const s=e.target.closest('[data-seek]');if(!s)return;e.preventDefault();drag=s;s.classList.add('drag');try{s.setPointerCapture(e.pointerId);}catch{}const r=s.getBoundingClientRect();seekTo((e.clientX-r.left)/r.width);});
 card.addEventListener('pointermove',e=>{if(!drag||!REC)return;const s=card.querySelector('[data-seek]:not([hidden])');const el=card.querySelector(mPhone()?'.bfm-s':'.bf-bar')||s;const r=el.getBoundingClientRect();if(r.width)seekTo((e.clientX-r.left)/r.width);});
 addEventListener('pointerup',()=>{if(drag){drag=null;card.querySelectorAll('.drag').forEach(x=>x.classList.remove('drag'));}});
 card.addEventListener('keydown',e=>{if(!e.target.closest('[data-seek]'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(REC){const d=dur();if(d)seekTo((AU.currentTime+(e.key==='ArrowLeft'?-5:5))/d);}else seekTo(chStart(Math.max(0,cur+(e.key==='ArrowLeft'?-1:1))));}});
 AU.addEventListener('timeupdate',()=>{if(!card.hidden&&REC&&!drag){const p=pos(),pc=(p*100).toFixed(1)+'%';card.querySelectorAll('.bf-bar>i,.bfm-s>i').forEach(i=>i.style.width=pc);const b=card.querySelector('.bfm-s>b');if(b)b.style.left=pc;const t=card.querySelector('.bfm-tm');if(t){const d=dur();t.innerHTML=`<span>${fmt(Math.round(AU.currentTime))}</span><span>−${fmt(Math.max(0,Math.round(d-AU.currentTime)))}</span>`;}}});
 let wasPhone=null;addEventListener('resize',()=>{if(!card.hidden&&mPhone()!==wasPhone){wasPhone=mPhone();paintCard();}});
 function paintCard(){const h=CH[0]?.h||'Briefing';const at=REC?Math.round(AU.currentTime*14):CH.slice(0,cur).reduce((a,c)=>a+c.t.length,0),tot=total()||1;
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');const PP=playing?'<svg width="14" height="14" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill="#111"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#111"/></svg>':'<svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill="#111"/></svg>';
  card.innerHTML=`<div class=bf-row><span class=bf-ic>${playing?'<i class=bf-eq><b></b><b></b><b></b></i>':done()?DONE:RING}</span><div class=bf-cap><small>Briefing${day?' · '+new Date(day).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):''} · ${fmt(secs(at))} / ${fmt(secs(total()))}</small><p>${esc(CH[cur]?.t||h)}</p></div>
  <button type=button class="bf-ib prev" data-bf=prev aria-label="Previous"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="2.2" height="14" rx="1"/><path d="M19 5.8v12.4a.8.8 0 0 1-1.2.7L9 12.7a.8.8 0 0 1 0-1.4l8.8-6.2a.8.8 0 0 1 1.2.7z"/></svg></button><button type=button class=bf-pp aria-label="${playing?'Pause':'Play'}">${PP}</button><button type=button class="bf-ib next" data-bf=next aria-label="Next"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="16.8" y="5" width="2.2" height="14" rx="1"/><path d="M5 5.8v12.4a.8.8 0 0 0 1.2.7L15 12.7a.8.8 0 0 0 0-1.4L6.2 5.1A.8.8 0 0 0 5 5.8z"/></svg></button>
  <button type=button class="bf-tr${tr?' on':''}" data-bf=tr aria-expanded="${tr}">Transcript</button><button type=button class="bf-x bf-ib" aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <div class=bf-bar data-seek role=slider tabindex=0 aria-label="Briefing position" aria-valuemin=0 aria-valuemax=100 aria-valuenow="${Math.round(pos()*100)}"><i style="width:${Math.round(pos()*100)}%"></i></div>
  ${mPhone()?mCard(h,esc):''}
  ${tr?`<div class=bf-list>${CH.map((c,i)=>`<div class="bf-b ${i===cur&&(playing||cur)?'on':i<cur?'past':''}" data-i="${i}">${esc(c.t)}</div>`).join('')}</div>
  <div class=bf-ctl><button type=button data-bf=name>${store('inv-brief-name')==='off'?'Greet me by name':'Don’t use my name'}</button></div>
  <div class=bf-note>${REC?'Synthetic voice reading Investedia’s Briefing, written from our market data and articles.':'Read by your browser’s voice from Investedia’s market data and articles.'} Delayed prices. Not investment advice.</div>`:''}`;
  card.classList.toggle('m',mPhone());
  if(tr)card.querySelector('.bf-b.on')?.scrollIntoView({block:'nearest'});}
 // keep the pills and article card just above the player whenever the player changes size (phone card, transcript open/close)
 if(window.ResizeObserver)new ResizeObserver(()=>{if(T||stack.innerHTML)place();}).observe(card);
 function speak(i){
  if(REC){if(i>=CH.length){AU.pause();playing=false;store('inv-briefed',day);paintBtn();paintCard();return;}cur=i;playing=true;const go=()=>{AU.currentTime=CH[i].s||0;AU.play().catch(()=>{playing=false;paintBtn();paintCard();});};
   const nm=firstName();if(i===0&&nm&&!greeted&&API()){greeted=true;const tod=new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening';GR.src=`${API()}/v1/briefing/greeting?name=${encodeURIComponent(nm)}&tod=${tod}`;GR.onended=go;GR.onerror=go;GR.play().catch(go);}else go();
   tour(CH[i]);paintBtn();paintCard();return;}
  synth.cancel();if(i>=CH.length){playing=false;store('inv-briefed',day);paintBtn();paintCard();return;}
  cur=i;playing=true;const c=CH[i];if(c.f&&typeof flyTo==='function')try{flyTo(c.f[0],Math.max(-60,Math.min(60,c.f[1])),1.6,1200)}catch{}
  utt=new SpeechSynthesisUtterance(c.t);utt.lang='en-GB';const v=synth.getVoices().find(v=>/en-GB/i.test(v.lang)&&/natural|neural|google|daniel|serena|sonia/i.test(v.name))||synth.getVoices().find(v=>/^en/i.test(v.lang));if(v)utt.voice=v;utt.rate=1;
  utt.onend=()=>{if(playing&&utt&&utt.text===c.t){if(i>=Math.floor(CH.length*.9)-1)store('inv-briefed',day);speak(i+1);}};synth.speak(utt);paintBtn();paintCard();}
 function stop(){tour(null);playing=false;synth.cancel();AU.pause();GR.pause();paintBtn();paintCard();}
 // pause keeps the position (play resumes from here); the tour clears like before
 function pauseOnly(){if(!REC){stop();return;}tour(null);playing=false;AU.pause();GR.pause();paintBtn();paintCard();}
 btn.onclick=()=>{if(!CH.length)build();card.hidden=!card.hidden;if(!card.hidden){if(!playing)speak(done()?0:cur>=CH.length-1?0:cur);}paintCard();paintBtn();};
 card.addEventListener('click',e=>{const t=e.target;if(t.closest('.bf-x')){card.hidden=true;stop();return;}if(t.closest('.bf-pp')){if(playing){pauseOnly();}else if(!resume())speak(cur);return;}
  const b=t.closest('[data-i]');if(b){speak(+b.dataset.i);return;}const k=t.closest('[data-bf]')?.dataset.bf;
  if(k==='tr'){tr=!tr;paintCard();return;}if(k==='b15'||k==='f15'){if(REC){const d=dur();if(d)seekTo((AU.currentTime+(k==='b15'?-15:15))/d);}else speak(Math.max(0,cur+(k==='b15'?-1:1)));return;}if(k==='prev')speak(Math.max(0,cur-1));if(k==='next')speak(cur+1);if(k==='name'){store('inv-brief-name',store('inv-brief-name')==='off'?'on':'off');build();paintCard();}});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&!card.hidden){card.hidden=true;stop();}});
 addEventListener('resize',paintBtn);
 const ready=setInterval(()=>{if(typeof MKT!=='undefined'&&MKT.all&&MKT.all.length&&typeof stories!=='undefined'){clearInterval(ready);build();paintBtn();}},500);
 setInterval(()=>{if(!playing&&CH.length)paintBtn();},5000);
 setInterval(()=>{if(playing&&!card.hidden){const b=card.querySelector('.bf-bar i');if(b){const at=REC?Math.round(AU.currentTime*14):CH.slice(0,cur).reduce((x,c)=>x+c.t.length,0);b.style.width=Math.min(100,Math.round(at/(total()||1)*100))+'%';}}},1000);
})();
