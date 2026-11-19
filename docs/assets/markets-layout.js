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
const orig=window.drawMarketsOverlay;
window.drawMarketsOverlay=function(t){orig&&orig(t);if(typeof MARKET==='undefined'||!MARKET.on||!MARKET.exchanges)return;const L=E();if(L.length<2)return;const T=performance.now()/1000;ctx.save();
 for(let i=0;i<L.length;i++){const a=L[i],b=L[(i+1)%L.length],wa=win(a),wb=win(b);
  const A=[a.coordinates.latitude*rad,a.coordinates.longitude*rad],B=[b.coordinates.latitude*rad,b.coordinates.longitude*rad];
  const v=([la,lo])=>[Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)],va=v(A),vb=v(B);const pts=[];
  for(let k=0;k<=40;k++){const f=k/40;let x=va[0]*(1-f)+vb[0]*f,y=va[1]*(1-f)+vb[1]*f,z=va[2]*(1-f)+vb[2]*f;const n=Math.hypot(x,y,z);x/=n;y/=n;z/=n;
   const lift=1+Math.sin(Math.PI*f)*.12;const q=proj(Math.asin(z),Math.atan2(y,x));pts.push([q[0],q[1],q[2],lift,f]);}
  const live=wa.open||wb.open;
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
@media(min-width:761px){html.mkd-on .mkd-l,html.mkd-on .mkd-o{visibility:hidden}}html:not(.mkd-on) .pv-l,html:not(.mkd-on) .pv-o,html.mk-detail .pv-o{display:none}@media(max-width:760px){.pv-l,.pv-o{display:none}}.pv-bar{background:#17171b!important;background-image:none!important}.pv-bar .seg{background:#4a4a54!important}.pv-bar .seg.o{background:#3ddc97!important}`;document.head.append(css);
function render(){if(typeof MARKET==='undefined'||!MARKET.exchanges||!desk())return;document.documentElement.classList.toggle('mk-detail',typeof marketPanel!=='undefined'&&!marketPanel.hidden);const now=new Date(),d0=new Date(now);d0.setHours(0,0,0,0);const day=d0.getTime(),pct=x=>Math.max(0,Math.min(100,(x-day)/864e3));
 const rows=E().map(e=>{const w=win(e);const segs=w.today.map(([a,b])=>`<span class="seg ${a<=Date.now()&&Date.now()<b?'o':''}" style="left:${pct(a)}%;width:${Math.max(.5,pct(b)-pct(a))}%"></span>`).join('');
  const lbl=w.open?`<small style="color:#3ddc97">open</small>`:w.next?`<small>${new Date(w.next[0]).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small>`:'<small>—</small>';
  return `<div class="pv-r"><b>${NAME[e.id]}</b><div class="pv-bar">${segs}<span class="pv-now" style="left:${pct(Date.now())}%"></span></div>${lbl}</div>`}).join('');
 let l=document.querySelector('.pv-l');if(!l){l=document.createElement('section');l.className='pv-l';document.body.append(l)}
 l.innerHTML=`<h3>Trading day</h3><div class="s">Today in your time · bars are regular sessions · orange line is now</div>${rows}<div class="pv-ax"><span></span><span><b>00</b><b>06</b><b>12</b><b>18</b><b>24</b></span><span></span></div><div class="s" style="margin:10px 0 0">Next to open shown on the right · exchange-calendars</div>`;
 // right: compact overview (real numbers read from the current panel)
 const kp=[...document.querySelectorAll('.mkd-kp div')].map(d=>[d.querySelector('b')?.textContent,d.querySelector('small')?.textContent]);
 const regs=[...document.querySelectorAll('.mkd-o')].length;
 const seen={},fxs=[...(document.querySelector('.mkd-o')?.textContent||'').matchAll(/([A-Z]{3})\s*([+−-][\d.]+)%/g)].map(m=>[m[1],parseFloat(m[2].replace('−','-'))]).filter(f=>!seen[f[0]]&&(seen[f[0]]=1)).slice(0,8);
 const mx=Math.max(.5,...fxs.map(f=>Math.abs(f[1])));
 const nx=[...document.querySelectorAll('.mkd-mc')].slice(0,3).map(m=>`<div class="pv-n"><span>${m.querySelector('span')?.textContent||''}</span><small>${m.querySelector('small')?.textContent||''}</small></div>`).join('');
 let o=document.querySelector('.pv-o');if(!o){o=document.createElement('section');o.className='pv-o';document.body.append(o)}
 o.innerHTML=`<h3>Markets overview</h3><div class="pv-k">${kp.slice(0,3).map(([b,s])=>`<div><b>${b}</b><small>${s}</small></div>`).join('')}</div>
 <div class="pv-h"><span>Currencies vs US dollar</span><span>1 day · ECB</span></div>${fxs.map(([c,d])=>`<div class="pv-fx"><b>${c}</b><div class="t"><i style="left:${d>=0?50:50-Math.abs(d)/mx*50}%;width:${Math.abs(d)/mx*50}%;background:${d>=0?'#3ddc97':'#ff5d5d'}"></i></div><em style="color:${d>=0?'#3ddc97':'#ff5d5d'}">${d>=0?'+':'−'}${Math.abs(d).toFixed(2)}%</em></div>`).join('')}
 ${nx?`<div class="pv-h" style="margin-top:14px"><span>Next releases</span><span>official</span></div>${nx}`:''}<div class="pv-src">Sources: ECB · exchange-calendars · our calendar. Not investment advice.</div>`;}
setInterval(render,1000*30);setInterval(()=>{if(!document.querySelector('.pv-l')||document.documentElement.classList.contains('mkd-on'))render()},1500);
})();
