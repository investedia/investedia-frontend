import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',n,e.message.slice(0,400));}};
const mk=(n,hits,miss)=>({schema:1,since:'2026-10-26',horizon_h:24,calls:Array.from({length:n},(_,i)=>{const h=i<hits,m=!h&&i<hits+miss;return {id:'n'+i,h:'Headline '+i,sym:'A'+i,name:'Asset '+i,dir:i%2?'down':'up',pub:29000000+i*60,move:h?1.2:m?-1.1:0.1,res:h?'hit':m?'miss':'flat'};})});
for(const w of [1440,390]){
  const c=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(c);
  await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
  let ledger={schema:1,since:'2026-10-26',calls:[]};
  await c.route('**/assets/globe/news-ledger.json',r=>r.fulfill({json:ledger}));
  const open=async()=>{const p=await c.newPage();await p.goto(base+'/track-record.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:1500});}catch{}await p.waitForSelector('#tr .tr-score,#tr .tr-wait');await p.waitForTimeout(400);return p;};
  let p=await open();
  await t(w+' R1 with no judged calls it says so and invents nothing',async()=>{assert.equal(await p.locator('.tr-big strong').innerText(),'Building');assert.match(await p.locator('#tr').innerText(),/0 of 50/);assert.equal(await p.locator('.tr-row').count(),0);assert.doesNotMatch(await p.locator('#tr').innerText(),/%/);});
  await p.close();
  ledger=mk(20,12,5);p=await open();
  await t(w+' R2 under 50 judged calls: raw counts, progress, no percentage hit rate',async()=>{assert.equal(await p.locator('.tr-big strong').innerText(),'Building');assert.match(await p.locator('.tr-big span').first().innerText(),/17 of 50/);assert.equal(await p.locator('.tr-stat.ok strong').innerText(),'12');assert.equal(await p.locator('.tr-stat.no strong').innerText(),'5');assert.equal(await p.locator('.tr-row').count(),20);assert.equal(await p.locator('[role=progressbar]').getAttribute('aria-valuenow'),'17');});
  await t(w+' R3 no horizontal overflow, rows link to the article',async()=>{assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.match(await p.locator('.tr-row').first().getAttribute('href'),/^story\.html\?id=n/);});
  await p.close();
  ledger=mk(60,36,20);p=await open();
  await t(w+' R4 from 50 judged calls the hit rate shows: hits / (hits + misses), no-move excluded',async()=>{assert.equal(await p.locator('.tr-big strong').innerText(),'64%');assert.match(await p.locator('.tr-big span').innerText(),/56 judged/);});
  await t(w+' R5 the News tabs include Track record as current',async()=>{assert.equal(await p.locator('#news-nav [aria-current=page]').innerText(),'Track record');});
  await p.close();await c.close();}
await b.close();console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
