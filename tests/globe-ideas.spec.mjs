// Acceptance tests for the three globe features the owner chose on 2026-10-26: A topic lenses, A country briefing, A markets open (night shade).
// Criteria are numbered in design/options-7/ACCEPTANCE.md. Data comes from the real files in assets/, never from fixtures written for the test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n')[0]});}};
const news=JSON.parse(fs.readFileSync('assets/globe/news-live.json','utf8')).stories;
const markets=Object.fromEntries(JSON.parse(fs.readFileSync('assets/globe/markets.json','utf8')).assets.map(a=>[a.s,a]));
const cal=JSON.parse(fs.readFileSync('assets/calendar-live.json','utf8')).events;
const LENS={energy:/\b(oil|crude|opec|brent|wti|natural gas|lng|gasoline|petrol|refiner\w*|energy)\b/,central:/(central bank|federal reserve|\bfed\b|fomc|\becb\b|bank of england|\bboe\b|bank of japan|\bboj\b|rate cuts?|rate hikes?|interest rates?|powell|lagarde|inflation)/,trade:/(tariffs?|trade deals?|trade wars?|trade talks|trade agreements?|export controls?|sanctions?|import dut(?:y|ies))/,earnings:/(earnings|quarterly results|\bprofits?\b|\brevenues?\b|guidance|\beps\b)/};
const inLens=(s,k)=>LENS[k].test((s.headline+' '+(s.summary||'')).toLowerCase());
const fmt=v=>Math.abs(v).toFixed(2)+'%';
const lens=async(p,name,phone)=>{if(phone){await p.locator('#m-filters').click();await p.locator('#fsheet .chip',{hasText:name}).click();await p.locator('#fs-close').click();if(name!=='All')await p.locator('#dock [data-v=news]').click();}else await p.locator('#cats .chip',{hasText:name}).click();};
const mktSwitch=async p=>{if(await p.locator('#lay-pop').isHidden())await p.locator('#lay-btn').click();await p.locator('#sw-mkt').click();};
const open=async(p,q='')=>{await p.goto(base+'/assets/globe/news.html'+q);try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&MKT.all&&MKT.all.length>0);await p.waitForTimeout(800);};
for(const w of widths){
 const ctx=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const errors=[];const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await open(p);
const countryPoint=()=>p.evaluate(()=>{for(let y=globeBox.top+40;y<globeBox.bottom-40;y+=6)for(let x=globeBox.left+20;x<globeBox.right-20;x+=6){const g=inv(x,y),c=g&&countryAt(g[0],g[1]);if(c&&c.name==='United States of America'&&!pick(x,y,40)&&!arcPick(x,y)&&!exPick(x,y))return {x,y};}return null;});
 const phone=w===390;
 await check(w,'M0 market hours are off by default: no shade, no exchange dots, no Markets tab on the desktop panel; the button is not pressed',async()=>{
  const r=await p.evaluate(()=>({on:MKTON,hits:exHits.length,tab:!!document.querySelector('#panel-tab-markets'),pressed:$('sw-mkt').getAttribute('aria-checked')}));
  assert.equal(r.on,false);assert.equal(r.hits,0);assert.equal(r.pressed,'false');if(!phone)assert.equal(r.tab,false);});
 // ---- lenses ----
 await check(w,'L1 the topic bar is All + Energy + Central banks + Trade & tariffs + Earnings, each with the number of articles in the current window',async()=>{
  const got=await p.$$eval('#cats .chip',els=>els.map(e=>[e.textContent.replace(/\s+\d+$/,'').trim(),+e.querySelector('[data-n]').textContent]));
  assert.deepEqual(got.map(g=>g[0]),['All','Energy','Central banks','Trade & tariffs','Earnings']);
  const inWin=await p.evaluate(()=>stories.filter(matchNoLens).map(s=>s.id));const ids=new Set(inWin);
  assert.equal(got[0][1],inWin.length);
  const keys=['energy','central','trade','earnings'];
  keys.forEach((k,i)=>assert.equal(got[i+1][1],news.filter(s=>ids.has(s.id)&&inLens(s,k)).length,k));});
 await check(w,'L2 choosing Energy marks the chip, shows "Energy lens", the same count as the chip, and only energy stories',async()=>{
  await lens(p,'Energy',phone);await p.waitForTimeout(400);
  assert.equal(await p.locator('#cats .chip[aria-pressed=true]').count(),1);
  const n=+await p.locator('#cats .chip',{hasText:'Energy'}).locator('[data-n]').innerText();
  assert.match(await p.locator('.lens-eyebrow').innerText(),/energy lens/i);
  assert.match(await p.locator('.lens-count').innerText(),new RegExp(`^${n}\\s+articles?\\s+·\\s+\\d+\\s+countries`));
  const ids=await p.$$eval('.lens-item',e=>e.map(x=>x.dataset.story));assert(ids.length>0&&ids.length<=Math.min(n,20));
  for(const id of ids)assert(inLens(news.find(s=>s.id===id),'energy'),id);});
 await check(w,'L3 each lens row shows the real % move of the asset the story names, or no pill when none is priced',async()=>{
  const rows=await p.$$eval('.lens-item',els=>els.map(e=>({id:e.dataset.story,asset:e.querySelector('.lens-asset span')?.textContent||'',pct:e.querySelector('.pct')?.textContent.replace(/[^0-9.]/g,'')||'',cls:e.querySelector('.pct')?.className||''})));
  let priced=0;for(const r of rows){const s=news.find(x=>x.id===r.id);const a=(s.impacts||[]).map(i=>i.ticker&&(markets[i.ticker.toUpperCase()]||markets[i.ticker.toUpperCase()+'-USD'])).find(a=>a&&Number.isFinite(a.d));
   if(!a){assert.equal(r.pct,'',r.id);continue;}priced++;assert.equal(r.asset,a.n);assert.equal(r.pct,fmt(a.d).replace('%',''));assert(r.cls.includes(a.d>0?'up':a.d<0?'down':'flat'));}
  assert(priced>0,'no priced row to check');});
 await check(w,'L4 shown pins are the lens stories; every other story in the window stays on the map as a dimmed dot',async()=>{
  const r=await p.evaluate(()=>({shown:shown.length,dim:dimmed.length,all:stories.filter(matchNoLens).length,bad:shown.some(s=>!s.lens.includes('energy'))||dimmed.some(s=>s.lens.includes('energy'))}));
  assert.equal(r.shown+r.dim,r.all);assert(r.dim>0);assert.equal(r.bad,false);});
 await check(w,'L5 All brings back the normal panel and clears the dimming; ?lens=energy opens with the lens set',async()=>{
  await lens(p,'All',phone);await p.waitForTimeout(400);
  assert.equal(await p.locator('.lens-count').count(),0);assert.equal(await p.evaluate(()=>dimmed.length),0);
  await open(p,'?lens=energy');if(phone)await p.locator('#dock [data-v=news]').click();assert.equal(await p.evaluate(()=>F.lens),'energy');assert.match(await p.locator('.lens-eyebrow').innerText(),/energy/i);await open(p);});
 await check(w,'L6 the Crypto label still exists for crypto stories (no "undefined")',async()=>{
  assert.equal(await p.evaluate(()=>CAT.crypto),'Crypto');
  const id=news.find(s=>s.category==='crypto')?.id;assert(id,'no crypto story in the data');
  assert.equal(await p.evaluate(i=>CAT[byId[i].category],id),'Crypto');});
 // ---- country briefing ----
 await check(w,'B1 the briefing text for a country has flag, name, article count, up to 3 different headlines, main index move and next high-impact release',async()=>{
  const r=await p.evaluate(()=>{const c=byName['United States of America'];return {html:briefHTML(c),n:stories.filter(s=>s.location.country===c.name&&match(s)).length,top:stories.filter(s=>s.location.country===c.name&&match(s)).sort(sortTop).map(s=>s.headline).filter((h,i,all)=>all.indexOf(h)===i).slice(0,3)};});
  const d=await p.evaluate(h=>{const e=document.createElement('div');e.innerHTML=h;return {flag:!!e.querySelector('img.flag'),name:e.querySelector('h3').textContent,count:e.querySelector('.brief-head span').textContent,lines:[...e.querySelectorAll('.brief-line')].map(x=>x.textContent),ix:e.querySelector('.brief-index')?.textContent||'',next:e.querySelector('.brief-next')?.textContent||''};},r.html);
  assert(d.flag);assert.equal(d.name,'United States');assert.equal(d.count,`${r.n} ${r.n===1?'article':'articles'}`);assert.deepEqual(d.lines,r.top);assert(d.lines.length<=3);
  const sp=markets['^GSPC'];assert(d.ix.includes('S&P 500')&&d.ix.includes(fmt(sp.d)),d.ix);
  const nx=cal.filter(e=>e.country==='US'&&e.imp>=3&&Date.parse(e.at)>Date.now()).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0];
  assert(nx,'no upcoming US high-impact event in calendar-live.json');assert(d.next.includes(nx.t),d.next);assert.match(d.next,/^Next: .+ in (\d+ d \d+ h|\d+ h \d+ min|\d+ min)$/);});
 await check(w,'B2 a country with no index or no scheduled release leaves those rows out and never prints undefined or NaN',async()=>{
  const t=await p.evaluate(()=>{const c=countries.find(c=>!ISO[c.name]||!mainIndex(c.name))||countries[0];const e=document.createElement('div');e.innerHTML=briefHTML(c);return {text:e.textContent,ix:!!e.querySelector('.brief-index'),mi:!!mainIndex(c.name)};});
  assert(!/undefined|NaN|null/.test(t.text),t.text);assert.equal(t.ix,t.mi);});
 if(!phone){
  await check(w,'B3 hovering a country on the globe shows the briefing card; clicking opens the full country panel',async()=>{
   await p.evaluate(()=>{lon0=-98;lat0=39;Zt=Z=1;});await p.waitForTimeout(700);const pt2=await countryPoint();assert(pt2,'no free point inside the United States');
   await p.mouse.move(pt2.x-30,pt2.y+60);await p.mouse.move(pt2.x,pt2.y);await p.waitForTimeout(1200);
   assert(await p.locator('#hover.brief.on').count()===1,'no card');assert.match(await p.locator('#hover.brief').innerText(),/United States/);
   await p.mouse.click(pt2.x,pt2.y);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>view.k),'country');});
 }else{
  await check(w,'B3 tapping a country on a phone shows the briefing card above the sheet; tapping the card opens the full country panel',async()=>{
   await p.evaluate(()=>{hist=[];view={k:'top'};sel=null;selCountry=null;render();lon0=-98;lat0=39;Zt=Z=1;});await p.waitForTimeout(600);
   const pt=await countryPoint();assert(pt,'no free point inside the United States');
   await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(500);
   assert.equal(await p.locator('#hover.brief.on').count(),1,'no card');assert.match(await p.locator('#hover.brief').innerText(),/United States/);
   await p.locator('#hover.brief').tap();await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>view.k),'country');});
 }
 // ---- markets open ----
 await check(w,'M1 open/closed state follows each exchange\'s own hours and time zone (Sunday 23:22 UTC on 25 Oct 2026)',async()=>{
  const r=await p.evaluate(()=>{const now=Date.UTC(2026,9,25,23,22);return EXCH.map(e=>({n:e.n,...exchangeState(e,now)}));});
  const by=Object.fromEntries(r.map(x=>[x.n,x]));
  assert(by.Sydney.open&&by.Sydney.since===Date.UTC(2026,9,25,23,0));
  assert.equal(Math.round(by.Tokyo.in/60000),38);assert.equal(Math.round(by['Hong Kong'].in/60000),128);
  assert.equal(Math.round(by.London.in/60000),8*60+38,'London is on GMT after 25 Oct');assert.equal(Math.round(by['New York'].in/60000),14*60+8,'New York is still on EDT until 1 Nov');});
 await check(w,'M2 weekends are closed: New York on Friday evening opens on Monday',async()=>{
  const r=await p.evaluate(()=>exchangeState(EXCH[4],Date.UTC(2026,9,23,21,0)));assert.equal(r.open,false);assert.equal(r.at,Date.UTC(2026,9,26,13,30));});
 await check(w,'M3 the sun is over the right place: noon UTC at about 0° longitude and the late-October declination',async()=>{
  const r=await p.evaluate(()=>sunPoint(Date.UTC(2026,9,25,12,0)));assert(Math.abs(r.lo*180/Math.PI)<5,String(r.lo));assert(Math.abs(r.la*180/Math.PI+12.2)<1.5,String(r.la));});
 await check(w,'M4 the night side is darker than the day side on the canvas (same land, only the sun moves)',async()=>{
  const r=await p.evaluate(async()=>{setMarketsLayer(true);const real=Date.now;fly=null;Zt=Z=1;lat0=0;lon0=0;const out={};
   const at=lo=>{const h=12-lo/15;Date.now=()=>Date.UTC(2026,2,20,0,0)+h*3600e3;};
   const lum=x=>{const k=Math.min(2,devicePixelRatio||1),d=cv.getContext('2d').getImageData(Math.round(x*k)-6,Math.round(cy*k)-6,12,12).data;let t=0;for(let i=0;i<d.length;i+=4)t+=d[i]+d[i+1]+d[i+2];return t/(d.length/4);};
   const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   for(const [k,sunLon,x] of [['leftDay',-60,cx-R*.45],['leftNight',120,cx-R*.45],['rightDay',60,cx+R*.45],['rightNight',-120,cx+R*.45]]){at(sunLon);lon0=0;await frames();out[k]=lum(x);}
   Date.now=real;return out;});
  assert(r.leftDay>r.leftNight,JSON.stringify(r));assert(r.rightDay>r.rightNight,JSON.stringify(r));});
 await check(w,'M5 the Markets tab lists Sydney, Tokyo, Hong Kong, London, New York with the right wording and a link to each main index',async()=>{
  await p.evaluate(()=>{hist=[];view={k:'top'};sel=null;selCountry=null;render();});
  if(phone)await p.locator('#dock [data-v=markets]').click();else{await p.evaluate(()=>setMarketsLayer(false));await mktSwitch(p);}await p.waitForTimeout(400);
  const rows=await p.$$eval('.mk-row',e=>e.map(x=>({name:x.querySelector('b').textContent,when:x.querySelector('.mk-st').textContent,ix:x.dataset.asset})));
  assert.deepEqual(rows.map(r=>r.name),['Sydney','Tokyo','Hong Kong','London','New York'],JSON.stringify(rows));assert.deepEqual(rows.map(r=>r.ix),['^AXJO','^N225','^HSI','^FTSE','^GSPC']);
  for(const r of rows)assert(/^(Open · closes in .+|Opens in .+)$/.test(r.when),r.when);
  assert.match(await p.locator('.mk-eyebrow').innerText(),/MARKETS NOW · \d{4}-\d\d-\d\d \d\d:\d\d UTC/i);});
 await check(w,'M7 every row states the exchange hours in local time and UTC, and open markets say when they close',async()=>{
  const h=await p.evaluate(()=>{const n=Date.UTC(2026,9,25,23,22);return [hoursText(EXCH[0],n),hoursText(EXCH[3],n),hoursText(EXCH[4],n),exchangeState(EXCH[0],n).left];});
  assert.deepEqual(h.slice(0,3),['10:00–16:00 local · 23:00–05:00 UTC','08:00–16:30 local · 08:00–16:30 UTC','09:30–16:00 local · 13:30–20:00 UTC']);assert.equal(Math.round(h[3]/60000),5*60+38);
  if(phone)await p.locator('#dock [data-v=markets]').click();else if(await p.locator('.mk-row').count()===0)await mktSwitch(p);await p.waitForTimeout(300);
  for(const t of await p.locator('.mk-main small').allInnerTexts())assert.match(t,/^\d\d:\d\d–\d\d:\d\d local\s+\d\d:\d\d–\d\d:\d\d UTC$/);});
 if(!phone)await check(w,'M8 pressing the button again turns the layer off: the Markets tab goes, no dots, panel back to Top',async()=>{
  await mktSwitch(p);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>({on:MKTON,tab:!!document.querySelector('#panel-tab-markets'),cur:panelTab,hits:exHits.length}));assert.equal(r.on,false);assert.equal(r.tab,false);assert.equal(r.cur,'top');assert.equal(r.hits,0);
  await mktSwitch(p);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>MKTON),true);});
 await check(w,'M6 clicking a market row and a dot on the globe asks the asset viewer for that index',async()=>{
  await p.evaluate(()=>{window.__peek=[];InvPeek.open=s=>window.__peek.push(s);});
  await p.locator('.mk-row').nth(4).click();assert.equal(await p.evaluate(()=>__peek.at(-1)),'^GSPC');
  if(!phone){const pt=await p.evaluate(()=>{lon0=-60;lat0=30;Zt=Z=1;return null;});await p.waitForTimeout(500);
   const h=await p.evaluate(()=>exHits.find(x=>x.e.n==='New York'));assert(h,'New York not on screen');await p.mouse.click(h.x+12,h.y+12);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>__peek.at(-1)),'^GSPC');}});
 await check(w,'X1 no script errors, no horizontal overflow, no undefined/NaN in the panel',async()=>{
  assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert(!/undefined|NaN/.test(await p.locator('#pbody').innerText()));});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/globe-ideas-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
