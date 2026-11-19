// Markets globe layout (owner, 19 Nov 2026): left "Trading day" timeline, compact right overview, and lines showing the
// trading day passing from one exchange to the next (official regular sessions from exchange-calendars). Desktop only for the panels.
(()=>{
const desk=()=>innerWidth>760;
const ORDER=['XASX','XTKS','XHKG','XSHG','XNSE','XJSE','XETR','XLON','BVMF','XNYS','XTSE'];
const NAME={XASX:'Sydney',XTKS:'Tokyo',XHKG:'Hong Kong',XSHG:'Shanghai',XNSE:'Mumbai',XJSE:'Johannesburg',XETR:'Frankfurt',XLON:'London',BVMF:'São Paulo',XNYS:'New York',XTSE:'Toronto'};
const E=()=>ORDER.filter(m=>MARKET.exchanges[m]).map(m=>Object.assign({},MARKET.exchanges[m],{id:m}));
function win(e){const now=Date.now();const ds=(e.calendar?.dated_sessions||[]).map(s=>[Date.parse(s.open),Date.parse(s.close)]);
 const cur=ds.find(([a,b])=>a<=now&&now<b);const next=ds.find(([a])=>a>now);const today=ds.filter(([a,b])=>b>now-864e5&&a<now+864e5);return{open:!!cur,cur,next,today}}
// ---- connection lines: the trading day handing over from one exchange to the next (follow the sun) ----
const orig=window.drawMarketsOverlay;let HITS=[];

window.drawMarketsOverlay=function(t){if(LAYER!=='fx')orig&&orig(t);if(typeof MARKET==='undefined'||!MARKET.on||!MARKET.exchanges)return;if(LAYER==='fx'){drawFx();return;}const L=E();if(L.length<2)return;const T=performance.now()/1000;HITS=[];ctx.save();
 for(let i=0;i<L.length;i++){const a=L[i],b=L[(i+1)%L.length],wa=win(a),wb=win(b);
  const A=[a.coordinates.latitude*rad,a.coordinates.longitude*rad],B=[b.coordinates.latitude*rad,b.coordinates.longitude*rad];
  const v=([la,lo])=>[Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)],va=v(A),vb=v(B);const pts=[];
  for(let k=0;k<=40;k++){const f=k/40;let x=va[0]*(1-f)+vb[0]*f,y=va[1]*(1-f)+vb[1]*f,z=va[2]*(1-f)+vb[2]*f;const n=Math.hypot(x,y,z);x/=n;y/=n;z/=n;
   const lift=1+Math.sin(Math.PI*f)*.12;const q=proj(Math.asin(z),Math.atan2(y,x));pts.push([q[0],q[1],q[2],lift,f]);}
  const live=wa.open||wb.open;HITS.push({k:'day',a,b,wa,wb,pts:pts.filter(q=>q[2]>0)});
  // lift: push the arc away from the globe centre
  const c=proj(0,0);const cx=innerWidth/2;
  ctx.lineWidth=live?2.4:1.4;ctx.setLineDash(live?[]:[3,5]);ctx.strokeStyle=live?'rgba(255,140,60,.9)':'rgba(255,170,110,.45)';
  ctx.beginPath();let on=false;for(const p of pts){if(p[2]<=0){on=false;continue}on?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);on=true}ctx.stroke();
  if(live){const f=(T*.25)%1,p=pts[Math.round(f*40)];if(p[2]>0){const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],9);g.addColorStop(0,'rgba(255,190,120,1)');g.addColorStop(1,'rgba(255,140,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],9,0,7);ctx.fill();}}
 }
 ctx.setLineDash([]);const boxes=[];
 for(const e of [...L].sort((a,b)=>win(b).open-win(a).open)){const q=proj(e.coordinates.latitude*rad,e.coordinates.longitude*rad);if(q[2]<=0)continue;const w=win(e);
  ctx.fillStyle=w.open?'#3ddc97':'#55555c';ctx.beginPath();ctx.arc(q[0],q[1],w.open?5:3.5,0,7);ctx.fill();
  ctx.font='600 11px Inter,sans-serif';const nm_=NAME[e.id]||e.short,tw=ctx.measureText(nm_).width,bx={x:q[0]+8,y:q[1]-7,w:tw,h:14};if(boxes.some(o=>bx.x<o.x+o.w+4&&o.x<bx.x+bx.w+4&&bx.y<o.y+o.h&&o.y<bx.y+bx.h))continue;boxes.push(bx);ctx.fillStyle=w.open?'#eafff5':'#9a9aa3';ctx.fillText(nm_,q[0]+8,q[1]+4);}
 ctx.restore();};
// ---- layers (owner 19 Nov 2026, option A): pills switch between Trading day and Currencies; hover a line for a short explainer ----
let LAYER='day';try{LAYER=localStorage.getItem('inv-mk-layer')||'day'}catch{}
const CUR={USD:'US dollar',EUR:'euro',JPY:'Japanese yen',GBP:'British pound',CHF:'Swiss franc',CAD:'Canadian dollar',AUD:'Australian dollar',NZD:'New Zealand dollar',CNY:'Chinese yuan',HKD:'Hong Kong dollar',SGD:'Singapore dollar',INR:'Indian rupee',KRW:'South Korean won',IDR:'Indonesian rupiah',MYR:'Malaysian ringgit',THB:'Thai baht',PHP:'Philippine peso',ZAR:'South African rand',BRL:'Brazilian real',MXN:'Mexican peso',TRY:'Turkish lira',SEK:'Swedish krona',NOK:'Norwegian krone',DKK:'Danish krone',PLN:'Polish zloty',CZK:'Czech koruna',HUF:'Hungarian forint',ILS:'Israeli shekel',RON:'Romanian leu',ISK:'Icelandic krona',BGN:'Bulgarian lev'};
// ECB gives dollars → units of each currency (USD/XXX). A currency is STRONGER when one dollar buys fewer units: move = old/new − 1.
function fxMoves(){const H=MARKET.ecb?.usd_hist;if(!H)return[];const ds=Object.keys(H).sort(),d1=ds[ds.length-1],d0=ds[ds.length-2];if(!d0)return[];
 return Object.keys(H[d1]).filter(c=>c!=='USD'&&H[d0][c]).map(c=>({c,v:H[d1][c],d:(H[d0][c]/H[d1][c]-1)*100,d0,d1})).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));}
function fxPlace(c){if(c==='EUR')return MARKET.exchanges.XETR;const e=Object.values(MARKET.exchanges).filter(x=>x.currency===c&&x.coordinates);return e.find(x=>/^X/.test(x.id||''))||e[0];}
function arc(A,B,n=40){const v=([la,lo])=>[Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)],va=v(A),vb=v(B),out=[];
 for(let k=0;k<=n;k++){const f=k/n;let x=va[0]*(1-f)+vb[0]*f,y=va[1]*(1-f)+vb[1]*f,z=va[2]*(1-f)+vb[2]*f;const m=Math.hypot(x,y,z);const q=proj(Math.asin(z/m),Math.atan2(y/m,x/m));out.push(q);}return out;}
function drawFx(){const ny=MARKET.exchanges.XNYS;if(!ny)return;HITS=[];const B=[ny.coordinates.latitude*rad,ny.coordinates.longitude*rad],M=fxMoves(),mx=Math.max(.3,...M.map(f=>Math.abs(f.d))),LB=[];ctx.save();ctx.setLineDash([]);
 for(const f of M){const e=fxPlace(f.c);if(!e)continue;const pts=arc([e.coordinates.latitude*rad,e.coordinates.longitude*rad],B),up=f.d>=0,hot=HOV&&HOV.f===f;
  ctx.strokeStyle=up?`rgba(61,220,151,${hot?1:.75})`:`rgba(255,93,93,${hot?1:.75})`;ctx.lineWidth=(hot?1.5:0)+1+3*Math.abs(f.d)/mx;ctx.beginPath();let on=false;for(const q of pts){if(q[2]<=0){on=false;continue}on?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);on=true}ctx.stroke();
  const q=pts[0];if(q[2]>0){ctx.fillStyle=up?'#3ddc97':'#ff5d5d';ctx.beginPath();ctx.arc(q[0],q[1],4,0,7);ctx.fill();ctx.font='600 11px Inter,sans-serif';const w=ctx.measureText(f.c).width,bx={x:q[0]+7,y:q[1]-7,w,h:14};if(!LB.some(o=>bx.x<o.x+o.w+3&&o.x<bx.x+bx.w+3&&bx.y<o.y+o.h&&o.y<bx.y+bx.h)){LB.push(bx);ctx.fillStyle='#ececef';ctx.fillText(f.c,q[0]+7,q[1]+4);}}  // labels never overlap; the biggest moves get theirs first
  HITS.push({k:'fx',f,e,pts:pts.filter(q=>q[2]>0)});}
 const q=proj(B[0],B[1]);if(q[2]>0){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q[0],q[1],5,0,7);ctx.fill();ctx.font='600 11px Inter,sans-serif';ctx.fillText('US dollar',q[0]+8,q[1]+4);}
 ctx.restore();}
let HOV=null;const card=document.createElement('div');card.className='pv-card';card.hidden=true;document.body.append(card);
const pills=document.createElement('div');pills.className='pv-pills';pills.setAttribute('role','tablist');pills.setAttribute('aria-label','Lines on the globe');document.body.append(pills);
function pillsRender(){pills.innerHTML=[['day','Trading day'],['fx','Currencies']].map(([k,l])=>`<button type="button" role="tab" data-ly="${k}" aria-selected="${LAYER===k}">${l}</button>`).join('');}
pills.onclick=e=>{const b=e.target.closest('[data-ly]');if(!b)return;LAYER=b.dataset.ly;try{localStorage.setItem('inv-mk-layer',LAYER)}catch{}HOV=null;card.hidden=true;pillsRender();};pillsRender();
const hm=s=>String(s||'').slice(0,5),pct=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2)+'%';
function explain(h){if(h.k==='fx'){const f=h.f,n=CUR[f.c]||f.c,up=f.d>=0,dt=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  return `<div class="k">Currency · against the US dollar</div><h4>${esc(n[0].toUpperCase()+n.slice(1))} ${up?'strengthened':'weakened'} ${Math.abs(f.d).toFixed(2)}%</h4><div class="g"><div><b>${f.v.toLocaleString('en-US',{maximumFractionDigits:f.v<10?4:2})}</b><small>${esc(f.c)} per 1 US dollar</small></div><div><b class="${up?'u':'d'}">${pct(f.d)}</b><small>${dt(f.d0)} → ${dt(f.d1)}</small></div></div>
  <p>${up?`One dollar now buys fewer ${esc(f.c)} than the day before.`:`One dollar now buys more ${esc(f.c)} than the day before.`}</p><div class="why">${up?'A stronger currency makes imports cheaper at home and dollar debts easier to repay, but exports cost more for buyers abroad.':'A weaker currency makes imports dearer at home and dollar debts harder to repay, but exports get cheaper for buyers abroad.'}</div><div class="src">ECB euro reference rates, converted to US dollars · daily, not live · not investment advice</div>`;}
 const a=h.a,b=h.b,sa=a.sessions?.[0],sb=b.sessions?.[0];
 return `<div class="k">Trading day · handover</div><h4>${esc(NAME[a.id]||a.short)} → ${esc(NAME[b.id]||b.short)}</h4><div class="g"><div><b>${hm(sa?.open)}–${hm(sa?.close)}</b><small>${esc(NAME[a.id]||a.short)} · ${h.wa.open?'open now':'closed'}</small></div><div><b>${hm(sb?.open)}–${hm(sb?.close)}</b><small>${esc(NAME[b.id]||b.short)} · ${h.wb.open?'open now':'closed'}</small></div></div>
  <p>Trading moves around the world with the sun: as one market winds down, the next one opens. Hours are local time, regular sessions.</p><div class="why">News that breaks while one market is closed usually shows up first in the next one to open.</div><div class="src">Regular hours · exchange-calendars · holidays not shown</div>`;}
addEventListener('mousemove',e=>{if(typeof MARKET==='undefined'||!MARKET.on||!desk()||e.target.tagName!=='CANVAS'){if(HOV){HOV=null;card.hidden=true;}return;}
 let best=null,bd=10;for(const h of HITS)for(const q of h.pts){const d=Math.hypot(q[0]-e.clientX,q[1]-e.clientY);if(d<bd){bd=d;best=h;}}
 HOV=best;if(!best){card.hidden=true;return;}card.innerHTML=explain(best);card.hidden=false;const w=300,x=e.clientX+18+w>innerWidth?e.clientX-18-w:e.clientX+18;card.style.left=x+'px';card.style.top=Math.max(90,Math.min(innerHeight-card.offsetHeight-12,e.clientY-40))+'px';});
setInterval(()=>{pills.style.display=typeof MARKET!=='undefined'&&MARKET.on?'flex':'none';},300);
// ---- left: the trading day as a timeline (24 hours, your time) ----
const css=document.createElement('style');css.textContent=`
.pv-l{position:fixed;left:16px;top:112px;width:340px;z-index:5;background:rgba(10,10,12,.96);border:1px solid #1f1f23;border-radius:14px;padding:14px 16px;font:13px Inter,sans-serif;color:#ececef}
.pv-l h3{margin:0 0 2px;font-size:15px}.pv-l .s{color:#77777f;font-size:11.5px;margin-bottom:12px}
.pv-r{display:grid;grid-template-columns:92px 1fr 62px;gap:8px;align-items:center;height:30px}
.pv-r b{font-weight:500}.pv-r small{white-space:nowrap}.pv-r small{color:#77777f;font-size:11px;text-align:right}
.pv-bar{position:relative;height:8px;border-radius:4px;background:#17171b}.pv-bar .seg{position:absolute;top:0;bottom:0;border-radius:4px;background:#3a3a42}.pv-bar .seg.o{background:linear-gradient(90deg,#1f9e6b,#3ddc97)}
.pv-now{position:absolute;top:-4px;bottom:-4px;width:2px;background:#FF7A1A;border-radius:1px}
.pv-ax{display:grid;grid-template-columns:92px 1fr 62px;gap:8px;color:#5c5c64;font-size:10.5px;margin-top:6px}.pv-ax b{font-weight:400}.pv-ax span{display:flex;justify-content:space-between}
.pv-o{position:fixed;right:16px;top:112px;width:330px;z-index:5;background:rgba(10,10,12,.96);border:1px solid #1f1f23;border-radius:14px;padding:14px 16px;font:13px Inter,sans-serif;color:#ececef}
.pv-o h3{margin:0 0 12px;font-size:15px}.pv-k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}.pv-k div{background:#111114;border:1px solid #1d1d21;border-radius:10px;padding:8px 10px}.pv-k b{display:block;font-size:18px}.pv-k small{color:#77777f;font-size:11px}
.pv-h{display:flex;justify-content:space-between;color:#8a8a92;font-size:11.5px;margin:10px 0 6px}
.pv-fx{display:grid;grid-template-columns:44px 1fr 62px;gap:8px;align-items:center;height:24px}.pv-fx .t{position:relative;height:6px;background:#17171b;border-radius:3px}.pv-fx .t i{position:absolute;top:0;bottom:0;border-radius:3px}.pv-fx em{font-style:normal;text-align:right;font-family:'Geist Mono',ui-monospace,monospace;font-size:12px}
.pv-n{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid #1a1a1e}.pv-n small{color:#77777f;white-space:nowrap}
.pv-src{color:#5c5c64;font-size:11px;margin-top:10px}
@media(min-width:761px){html.mkd-on .mkd-l,html.mkd-on .mkd-o{visibility:hidden}}html:not(.mkd-on) .pv-l,html:not(.mkd-on) .pv-o,html.mk-detail .pv-o{display:none}@media(max-width:760px){.pv-l,.pv-o{display:none}}
.pv-pills{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:8;display:none;gap:2px;background:rgba(12,12,15,.95);border:1px solid #232328;border-radius:99px;padding:3px}.pv-pills button{border:0;background:none;color:#9a9aa3;font:500 12.5px Inter,sans-serif;padding:6px 14px;border-radius:99px;cursor:pointer}.pv-pills button[aria-selected=true]{background:#1f1f24;color:#fff}
.pv-card{position:fixed;z-index:60;width:300px;pointer-events:none;background:rgba(14,14,17,.97);border:1px solid #2c2c31;border-radius:14px;padding:12px 14px;font:13px/1.45 Inter,sans-serif;color:#ececef;box-shadow:0 18px 50px rgba(0,0,0,.6)}.pv-card[hidden]{display:none}.pv-card .k{font:600 10.5px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#ff9d5c}.pv-card h4{margin:3px 0 6px;font-size:15px}.pv-card p{margin:0 0 8px;color:#c9c9cf}.pv-card .why{background:#16110c;border:1px solid #3a240f;border-radius:9px;padding:7px 9px;color:#ffd2ad;font-size:12.5px}.pv-card .src{color:#6e6e76;font-size:11px;margin-top:8px}.pv-card .g{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 8px}.pv-card .g div{background:#111114;border-radius:8px;padding:6px 8px}.pv-card .g b{display:block;font-size:14px}.pv-card .g small{color:#77777f;font-size:11px}.pv-card .u{color:#3ddc97}.pv-card .d{color:#ff5d5d}.pv-bar{background:#17171b!important;background-image:none!important}.pv-bar .seg{background:#4a4a54!important}.pv-bar .seg.o{background:#3ddc97!important}`;document.head.append(css);
function render(){if(typeof MARKET==='undefined'||!MARKET.exchanges||!desk())return;document.documentElement.classList.toggle('mk-detail',typeof marketPanel!=='undefined'&&!marketPanel.hidden);const now=new Date(),d0=new Date(now);d0.setHours(0,0,0,0);const day=d0.getTime(),pct=x=>Math.max(0,Math.min(100,(x-day)/864e3));
 const rows=E().map(e=>{const w=win(e);const segs=w.today.map(([a,b])=>`<span class="seg ${a<=Date.now()&&Date.now()<b?'o':''}" style="left:${pct(a)}%;width:${Math.max(.5,pct(b)-pct(a))}%"></span>`).join('');
  const lbl=w.open?`<small style="color:#3ddc97">open</small>`:w.next?`<small>${new Date(w.next[0]).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small>`:'<small>—</small>';
  return `<div class="pv-r"><b>${NAME[e.id]}</b><div class="pv-bar">${segs}<span class="pv-now" style="left:${pct(Date.now())}%"></span></div>${lbl}</div>`}).join('');
 let l=document.querySelector('.pv-l');if(!l){l=document.createElement('section');l.className='pv-l';document.body.append(l)}
 l.innerHTML=`<h3>Trading day</h3><div class="s">Today in your time · bars are regular sessions · orange line is now</div>${rows}<div class="pv-ax"><span></span><span><b>00</b><b>06</b><b>12</b><b>18</b><b>24</b></span><span></span></div><div class="s" style="margin:10px 0 0">Next to open shown on the right · exchange-calendars</div>`;
 // right: compact overview (real numbers read from the current panel)
 const kp=[...document.querySelectorAll('.mkd-kp div')].map(d=>[d.querySelector('b')?.textContent,d.querySelector('small')?.textContent]);
 const regs=[...document.querySelectorAll('.mkd-o')].length;
 const fxs=fxMoves().slice(0,8).map(f=>[f.c,f.d]);
 const mx=Math.max(.5,...fxs.map(f=>Math.abs(f[1])));
 const nx=[...document.querySelectorAll('.mkd-mc')].slice(0,3).map(m=>`<div class="pv-n"><span>${m.querySelector('span')?.textContent||''}</span><small>${m.querySelector('small')?.textContent||''}</small></div>`).join('');
 let o=document.querySelector('.pv-o');if(!o){o=document.createElement('section');o.className='pv-o';document.body.append(o)}
 o.innerHTML=`<h3>Markets overview</h3><div class="pv-k">${kp.slice(0,3).map(([b,s])=>`<div><b>${b}</b><small>${s}</small></div>`).join('')}</div>
 <div class="pv-h"><span>Currency vs US dollar</span><span>1 day · ECB · green = stronger</span></div>${fxs.map(([c,d])=>`<div class="pv-fx"><b>${c}</b><div class="t"><i style="left:${d>=0?50:50-Math.abs(d)/mx*50}%;width:${Math.abs(d)/mx*50}%;background:${d>=0?'#3ddc97':'#ff5d5d'}"></i></div><em style="color:${d>=0?'#3ddc97':'#ff5d5d'}">${d>=0?'+':'−'}${Math.abs(d).toFixed(2)}%</em></div>`).join('')}
 ${nx?`<div class="pv-h" style="margin-top:14px"><span>Next releases</span><span>official</span></div>${nx}`:''}<div class="pv-src">Sources: ECB · exchange-calendars · our calendar. Not investment advice.</div>`;}
setInterval(render,1000*30);setInterval(()=>{if(!document.querySelector('.pv-l')||document.documentElement.classList.contains('mkd-on'))render()},1500);
})();
