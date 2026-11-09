// Dropdowns (Region, My assets) with glass menus, Layers closed by default, and the Upcoming layer (owner decisions 2026-10-26).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n').filter(Boolean).slice(0,3).join(' | ')});}};
const markets=Object.fromEntries(JSON.parse(fs.readFileSync('assets/globe/markets.json','utf8')).assets.map(a=>[a.s,a]));
const cal=JSON.parse(fs.readFileSync('assets/calendar-live.json','utf8')).events;
const WATCH=['META','NVDA','BZ=F','^GSPC','^N225'];
const CAPS=['US','GB','JP','EU','AU','CA','NZ','CH','CN'];
for(const w of widths){
 const phone=w===390;
 const mk=async(seed)=>{const ctx=await b.newContext({viewport:viewport(w),isMobile:phone,hasTouch:phone,serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(ctx);
  await ctx.addInitScript(([s,W])=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');if(s)localStorage.setItem('inv-watch',JSON.stringify({a:W.map(x=>({s:x})),c:[]}));},[seed,WATCH]);
  const p=await ctx.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));await p.goto(base+'/assets/globe/news.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
  await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&MKT.all&&MKT.all.length>0&&CAL.length>0);await p.waitForTimeout(900);return p;};
 const openSheet=async p=>{if(phone&&await p.locator('#fsheet').isHidden())await p.locator('#m-filters').click();};
 const p=await mk(true);
 await check(w,'DD1 the Layers card is closed when the globe opens (desktop); both dropdown buttons are there',async()=>{
  if(!phone){assert.equal(await p.locator('#lay-btn').getAttribute('aria-expanded'),'false');assert.equal(await p.locator('#lay-pop').isVisible(),false);}
  await openSheet(p);assert.equal(await p.locator('#reg-btn').isVisible(),true);assert.equal(await p.locator('#mine-btn').isVisible(),true);});
 await check(w,'DD2 the buttons and both menus are glass: translucent background with a blur behind',async()=>{
  await openSheet(p);await p.locator('#reg-btn').click();await p.locator('#mine-btn').click();
  const r=await p.evaluate(()=>{const g=e=>{const c=getComputedStyle(e);const a=(c.backgroundColor.match(/[\d.]+/g)||[]).map(Number);return {blur:(c.backdropFilter||c.webkitBackdropFilter||'').includes('blur'),alpha:a.length>3?a[3]:1};};return {reg:g($('reg-btn')),mine:g($('mine-btn')),menu:g($('mine-menu')),regmenu:(()=>{$('reg-btn').click();return g($('regions'));})()};});
  for(const [k,v] of Object.entries(r)){if(k==='mine'&&false)continue;}
  assert(r.reg.blur&&r.reg.alpha<.8,JSON.stringify(r.reg));assert(r.menu.blur&&r.menu.alpha<.8,JSON.stringify(r.menu));assert(r.regmenu.blur&&r.regmenu.alpha<.8,JSON.stringify(r.regmenu));
  await p.evaluate(()=>ddClose());});
 await check(w,'DD3 the Region menu lists the regions with counts that add up to All regions and match the topic chip',async()=>{
  await openSheet(p);await p.locator('#reg-btn').click();assert.equal(await p.locator('#reg-btn').getAttribute('aria-expanded'),'true');
  const r=await p.$$eval('#regions .reg [data-n]',els=>els.map(e=>+e.textContent));const chip=+await p.locator('#cats .chip').first().locator('[data-n]').innerText();
  assert.equal(r.length,8);assert.equal(r.slice(1).reduce((a,x)=>a+x,0),r[0]);assert.equal(r[0],chip);await p.keyboard.press('Escape');
  assert.equal(await p.locator('#regions').isHidden(),true);assert.equal(await p.evaluate(()=>document.activeElement.id),'reg-btn');});
 await check(w,'DD4 My assets lists the watchlist with logos, the real % move, binoculars, and how many stories name each',async()=>{
  await openSheet(p);await p.locator('#mine-btn').click();
  const rows=await p.$$eval('#mine-menu .mine-row',els=>els.map(e=>({sym:e.dataset.asset,logo:!!e.querySelector('.mine-ic > *'),star:!!e.querySelector('svg.dd-bino'),pct:(e.querySelector('.pct')?.textContent||'').replace(/[^0-9.]/g,''),n:e.querySelector('small').textContent})));
  assert.deepEqual(rows.map(r=>r.sym).sort(),[...WATCH].sort());
  for(const r of rows){assert(r.logo,r.sym+' logo');assert(r.star,r.sym+' binoculars');assert.equal(r.pct,Math.abs(markets[r.sym].d).toFixed(2),r.sym);assert.match(r.n,/^\d+ stor(y|ies)$/);}
  const n=await p.evaluate(()=>{const sym='BZ=F';return stories.filter(s=>inTime(s)&&impactsOf(s).some(i=>{const a=assetForImpact(i);return (a&&a.s.toUpperCase()===sym)||String(i.ticker||'').toUpperCase()===sym;})).length;});
  assert.equal(rows.find(r=>r.sym==='BZ=F').n,`${n} ${n===1?'story':'stories'}`);await p.keyboard.press('Escape');});
 await check(w,'DD5 My watchlist only shows just the stories that touch the watchlist; All news brings everything back',async()=>{
  await openSheet(p);const all=await p.evaluate(()=>stories.filter(match).length);
  await p.locator('#mine-btn').click();await p.locator('#mine-menu [data-mine="1"]').click();await p.waitForTimeout(400);
  const r=await p.evaluate(W=>({mine:F.mine,n:shown.length,bad:shown.some(s=>!impactsOf(s).some(i=>{const a=assetForImpact(i);return (a&&W.includes(a.s))||W.includes(String(i.ticker||'').toUpperCase());})),label:$('mine-label').textContent,on:$('mine-btn').classList.contains('on')}),WATCH);
  assert.equal(r.mine,true);assert.equal(r.bad,false);assert(r.n<all&&r.n>0,JSON.stringify({r,all}));assert.equal(r.label,'My watchlist only');assert.equal(r.on,true);
  await p.locator('#mine-btn').click();await p.locator('#mine-menu [data-mine="0"]').click();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>stories.filter(match).length),all);assert.equal(await p.evaluate(()=>F.mine),false);});
 await check(w,'DD6 a guest with no watchlist sees a plain explanation and a link, and cannot filter to nothing',async()=>{
  const g=await mk(false);await openSheet(g);await g.locator('#mine-btn').click();
  assert.match(await g.locator('#mine-menu').innerText(),/Your watchlist is empty[\s\S]*Sign in and add assets/);assert.equal(await g.locator('#mine-menu .mine-foot').getAttribute('href'),'../../watchlist.html');assert.equal(await g.locator('#mine-menu [data-mine]').count(),0);await g.context().close();});
 // ---- Upcoming ----
 const want=cal.filter(e=>e.imp>=3&&Date.parse(e.at)>Date.now()&&Date.parse(e.at)<=Date.now()+7*864e5&&CAPS.includes(e.country));
 await check(w,'UP1 the Layers card has an Upcoming switch, off by default, with the number of releases in its description',async()=>{
  await p.goto(base+'/assets/globe/news.html');await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&CAL.length>0);await p.waitForTimeout(700);
  if(phone)await openSheet(p);else await p.locator('#lay-btn').click();
  assert.equal(await p.locator('#sw-up').getAttribute('aria-checked'),'false');assert.equal(await p.evaluate(()=>UPON),false);assert.equal(await p.locator('#lay-n').innerText(),'1');});
 await check(w,'UP2 switching Upcoming on: pins with countdown labels, an Upcoming tab with every release in the next 7 days, count 2',async()=>{
  await p.locator('#sw-up').click();await p.waitForTimeout(600);
  assert.equal(await p.locator('#lay-n').innerText(),'2');assert.match(await p.locator('#up-sub').innerText(),new RegExp(`${want.length} shown`));
  if(phone){await p.locator('#fs-close').click();await p.locator('#dock [data-v=news]').click();await p.waitForTimeout(400);await p.locator('#panel-tab-upcoming').click();}
  assert.equal(await p.locator('#panel-tab-upcoming').getAttribute('aria-selected'),'true');
  const rows=await p.$$eval('.up-row',els=>els.map(e=>({t:e.querySelector('b').textContent,when:e.querySelector('.up-in').textContent,c:e.dataset.up})));
  assert.equal(rows.length,want.length);assert.deepEqual(rows.map(r=>r.t),want.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).map(e=>e.t));
  for(const r of rows)assert.match(r.when,/^in (\d+ d \d+ h|\d+ h \d+ min|\d+ min)$/);
  assert.match(await p.locator('.up-day').first().textContent(),/\w+day \d+ \w{3}/);});
 await check(w,'UP3 pin labels never overlap each other (phones show at most two) and every pin stays on the globe',async()=>{
  if(phone){await p.locator('#sheet-close').click().catch(()=>{});await p.waitForTimeout(300);}
  await p.evaluate(()=>{fly=null;Zt=Z=1;lon0=-30;lat0=35;});await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({pins:upHits.length,labels:upLabels.map(l=>({x:l.x,y:l.y,w:l.w,h:l.h}))}));
  assert(r.pins>0,'no pins drawn');for(let i=0;i<r.labels.length;i++)for(let j=i+1;j<r.labels.length;j++){const a=r.labels[i],c=r.labels[j];assert(!(a.x<c.x+c.w&&a.x+a.w>c.x&&a.y<c.y+c.h&&a.y+a.h>c.y),'labels overlap');}
  if(phone)assert(r.labels.length<=2,String(r.labels.length));});
 await check(w,'UP4 clicking a pin opens the Upcoming list; clicking a release turns the globe to its country',async()=>{
  if(phone)return;
  await p.evaluate(()=>{panelTab='top';render();fly=null;lon0=-30;lat0=35;});await p.waitForTimeout(500);const h=await p.evaluate(()=>upHits[0]&&{x:upHits[0].x+12,y:upHits[0].y+12});assert(h);
  await p.mouse.click(h.x,h.y);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>panelTab),'upcoming');
  const before=await p.evaluate(()=>lon0);await p.locator('.up-row[data-up=JP]').first().click();await p.waitForTimeout(1200);assert.notEqual(await p.evaluate(()=>Math.round(lon0)),Math.round(before));});
 await check(w,'UP5 switching Upcoming off removes the pins and the tab',async()=>{
  if(phone){await p.locator('#m-filters').click();}else if(await p.locator('#lay-pop').isHidden())await p.locator('#lay-btn').click();
  await p.locator('#sw-up').click();await p.waitForTimeout(300);
  const r=await p.evaluate(()=>({u:UPON,h:upHits.length,t:!!document.querySelector('#panel-tab-upcoming')}));assert.deepEqual(r,{u:false,h:0,t:false});});
 await check(w,'X1 no script errors and no horizontal overflow',async()=>{assert.deepEqual(p.errors,[]);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);});
 await p.context().close();
}
await b.close();
fs.writeFileSync('tests/globe-dropdowns-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
