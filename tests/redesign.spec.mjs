// Acceptance tests for the owner's chosen designs (2026-10-25): calendar A, Why it moved C (no 01/02/03), globe hover B with the pill mid-line.
// Criteria are numbered like design/CODEX-ACCEPTANCE-PROTOCOL.md. Real saved data is used; nothing is mocked except external providers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const markets=JSON.parse(fs.readFileSync('assets/globe/markets.json')).assets, news=JSON.parse(fs.readFileSync('assets/globe/news-live.json')).stories;
const iso=Object.values(JSON.parse(fs.readFileSync('assets/globe/iso.json')));
// same resolution rules as the globe page (assetForImpact / impactsOf)
const mk=t=>{if(!t)return null;const u=t.toUpperCase();return markets.find(a=>a.s===u||a.s===u+'-USD'||a.s===u.replace(/=X$/,''))||null;};
const usable=i=>i&&['country','company','asset','sector'].includes(i.kind)&&typeof i.name==='string'&&typeof i.why==='string'&&iso.includes(i.country);
const pctText=d=>`${d>0?'↑':d<0?'↓':'↔'} ${Math.abs(d).toFixed(2)}%`;
const priced=news.find(s=>(s.impacts||[]).slice(0,4).some(i=>usable(i)&&mk(i.ticker)&&Number.isFinite(mk(i.ticker).d)));
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n')[0]});}};
for(const w of widths){
 const ctx=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const p=await ctx.newPage();
 // ---- Calendar A ----
 await p.goto(base+'/calendar.html?date=month&impact=3&type=economic');await p.waitForSelector('.cal-row');
 try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:1500});}catch{}
 await check(w,'C1 header shows "Next high impact" line',async()=>assert.match(await p.locator('#cal-next').innerText(),/Next high impact: .+ · (in|now)/));
 await check(w,'C2 filter bar has date chips, High impact only, Earnings, Region and search',async()=>{for(const t of ['Today','Tomorrow','This week','Next week','30 days','Custom','High impact only','Earnings','Region'])assert(await p.locator('.cal-bar').getByRole('button',{name:new RegExp('^\\s*'+t)}).count()>=1,t);assert.equal(await p.locator('#cal-search').count(),1);});
 await check(w,'C3 agenda groups by day with a high-impact count and rows with time, event, impact bars, forecast/previous',async()=>{assert.match(await p.locator('.cal-day').first().innerText(),/high-impact/i);const r=p.locator('.cal-row').first();assert(await r.locator('.cal-time').innerText());assert(await r.locator('.cal-name').innerText());assert.equal(await r.locator('.cal-bars').count(),1);assert.equal(await r.locator('.cal-fc').count(),1);assert.equal(await r.locator('.cal-pv').count(),1);});
 await check(w,'C4 a row is preselected and the detail panel shows Forecast, Previous, Actual',async()=>{assert.equal(await p.locator('.cal-row[aria-pressed=true]').count(),1);if(w===390){await p.locator('.cal-row[aria-pressed=true]').click();await p.waitForTimeout(200);}const t=(await p.locator('#cal-detail').innerText()).toLowerCase();for(const x of ['forecast','previous','actual','selected'])assert(t.includes(x),x);});
 await check(w,'C5 detail panel lists watch-markets chips with real % moves from markets.json',async()=>{await p.goto(base+'/calendar.html?date=month&impact=3&type=economic&region=USD');await p.waitForSelector('.cal-row');if(w===390){await p.locator('.cal-row').first().click();await p.waitForTimeout(200);}const chips=p.locator('#cal-detail .cal-mk button');assert(await chips.count()>=1);const first=await chips.first().getAttribute('data-s'),shown=await chips.first().locator('.cal-pct').innerText();assert.equal(shown.replace(/\s+/g,' '),pctText(mk(first).d));});
 if(w===390)await check(w,'C6 phone: row tap opens a bottom sheet and Close dismisses it',async()=>{assert(await p.locator('#cal-detail.open').count()===1);await p.locator('#cal-close').click();assert.equal(await p.locator('#cal-detail.open').count(),0);});
 await check(w,'C7 no horizontal overflow',async()=>assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false));
 // ---- Why it moved C ----
 await p.goto(base+'/index.html');await p.waitForSelector('#hnWhy .hn-wf');
 await check(w,'W1 no 01/02/03 numbering',async()=>assert.equal(/(^|\n)\s*0[1-3]\s*($|\n)/.test(await p.locator('#hnWhy').innerText()),false));
 // W2-W5 (today / 7-day view) were replaced by the confirmed-articles section; see tests/confirmed.spec.mjs
 await check(w,'W6 no horizontal overflow',async()=>assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false));
 // ---- Globe hover B ----
 if(priced){
  await p.goto(base+'/assets/globe/news.html?story='+encodeURIComponent(priced.id));try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}await p.waitForTimeout(3000);
  const imp=priced.impacts.slice(0,4).find(i=>usable(i)&&mk(i.ticker)&&Number.isFinite(mk(i.ticker).d)),a=mk(imp.ticker);
  await check(w,'G1 a pill with the asset name and its real % sits on the line',async()=>{const pill=await p.evaluate(()=>pillRects.map(r=>({nm:r.nm,pt:r.pt,x:r.x,y:r.y,w:r.w,h:r.h})));assert(pill.length>=1,'pill drawn');const m=pill.find(r=>a.n.startsWith(r.nm.replace('…','')));assert(m,'pill for '+a.n);assert.equal(m.pt,pctText(a.d));assert(m.x>0&&m.x+m.w<await p.evaluate(()=>innerWidth),'pill is on screen');});
  if(w===1440){
   await check(w,'G2 hovering the pill opens the impact card with name, ticker, price, % today, 7-day %, implies line, sparkline',async()=>{const r=await p.evaluate(()=>{const q=pillRects[0];return {x:q.x+q.w/2,y:q.y+q.h/2};});await p.mouse.move(r.x,r.y);await p.waitForTimeout(500);const t=await p.locator('#hover').innerText(),tl=t.toLowerCase();assert.equal(await p.locator('#hover.on').count(),1);for(const x of ['affected assets','7 days','article implies','price today'])assert(tl.includes(x),x);assert(t.includes(pctText(a.d)),'% in card');assert.equal(await p.locator('#hover .hv-spark').count()>=1,true);});
   await check(w,'G3 the card does not cover the pill',async()=>{const o=await p.evaluate(()=>{const q=pillRects[0],h=document.getElementById('hover').getBoundingClientRect();const c=document.getElementById('cv').getBoundingClientRect();return !(h.left>=q.x+q.w+c.left-1||h.right<=q.x+c.left||h.top>=q.y+q.h+c.top||h.bottom<=q.y+c.top);});assert.equal(o,false);});
   await check(w,'G4 the article panel also lists the % next to each affected asset',async()=>{await p.waitForSelector('.impact-list .pct',{state:'attached',timeout:5000});assert(await p.locator('.impact-list .pct').count()>=1);});
  }
 } else results.push({width:w,id:'G* skipped: no story with a priced asset in saved news',pass:false});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/redesign-results.json',JSON.stringify(results,null,1));
for(const r of results)console.log(r.pass?'PASS':'FAIL',r.width,r.id,r.error||'');
process.exit(results.some(r=>!r.pass)?1:0);
