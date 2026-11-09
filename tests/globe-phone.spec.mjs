// Acceptance tests for the phone globe redesign (owner picked option A, 2026-10-26): slim top bar, Filters sheet, peek card, bottom dock.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(id,fn)=>{try{await fn();results.push({id,pass:true});}catch(e){results.push({id,pass:false,error:e.message.split('\n')[0]});}};
const markets=Object.fromEntries(JSON.parse(fs.readFileSync('assets/globe/markets.json','utf8')).assets.map(a=>[a.s,a]));
const news=JSON.parse(fs.readFileSync('assets/globe/news-live.json','utf8')).stories;
const mk=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:w<=500,hasTouch:w<=500,serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const p=await ctx.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
 await p.goto(base+'/assets/globe/news.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
 await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&MKT.all&&MKT.all.length>0);await p.waitForTimeout(900);return p;};
const p=await mk(390,844);
const rect=(sel)=>p.evaluate(s=>{const e=document.querySelector(s),r=e&&e.getBoundingClientRect();return r&&{x:r.x,y:r.y,w:r.width,h:r.height,vis:!!(e.offsetParent||getComputedStyle(e).position==='fixed')&&r.width>0};},sel);
await check('P1 the top bar holds only the logo, a Search button and a Filters button; chips, region row, time bar and search box are not on the globe screen',async()=>{
 const t=await rect('.top');assert(t.h<=72,'top bar height '+t.h);
 for(const s of ['#m-search','#m-filters','.wm'])assert((await rect(s)).vis,s);
 for(const s of ['#sbox','#fs-cats #cats .chip','#badge'])assert(!(await p.locator(s).first().isVisible().catch(()=>false)),s+' visible');
 assert.equal(await p.locator('#tl').isVisible(),false);});
await check('P2 every control on the globe screen is at least 44 px tall and wide',async()=>{
 const small=await p.evaluate(()=>[...document.querySelectorAll('#m-search,#m-filters,#dock button,#peek,.zoom button,.wm')].map(e=>{const r=e.getBoundingClientRect();return [e.id||e.className||e.dataset.v,Math.round(r.width),Math.round(r.height)];}).filter(x=>x[1]<44||x[2]<44));
 assert.deepEqual(small,[],JSON.stringify(small));});
await check('P3 text on the globe screen is at least 14 px',async()=>{
 const small=await p.evaluate(()=>[...document.querySelectorAll('#peek *,#dock button,#m-filters,.wm')].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e.className||e.tagName,parseFloat(getComputedStyle(e).fontSize)]).filter(x=>x[1]<14));
 assert.deepEqual(small,[],JSON.stringify(small));});
await check('P4 the peek card shows the top story (importance, then newest) with its real asset move and opens the story',async()=>{
 const r=await p.evaluate(()=>{const s=[...shown].sort(sortTop)[0];return {id:s.id,h:s.headline};});
 assert.equal(await p.evaluate(()=>$('peek').dataset.story),r.id);assert.match(await p.locator('#peek .pk-h').innerText(),new RegExp(r.h.slice(0,25).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const a=await p.evaluate(id=>{const x=lensAsset(byId[id]);return x&&{n:x.n,d:x.d};},r.id);
 if(a){assert.equal(await p.locator('#peek .pct').innerText().then(t=>t.replace(/[^0-9.]/g,'')),Math.abs(a.d).toFixed(2));}else assert.equal(await p.locator('#peek .pct').count(),0);
 await p.locator('#peek').click();await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>view.k),'article');
 await p.evaluate(()=>{$('sheet-close').click();});await p.waitForTimeout(300);});
await check('P5 Filters opens a dialog with Topic, Region and Time (44 px controls), focus moves in, Escape closes and returns focus',async()=>{
 await p.locator('#m-filters').click();await p.waitForTimeout(300);
 assert.equal(await p.locator('#fsheet[role=dialog]').isVisible(),true);assert.equal(await p.evaluate(()=>document.activeElement.id),'fs-title');
 const labels=await p.locator('.fs-lbl').allInnerTexts();assert.deepEqual(labels.map(x=>x.toLowerCase()),['topic','region','time','layers']);
 const small=await p.evaluate(()=>[...document.querySelectorAll('#fsheet .chip,#fsheet .dd-btn,#fsheet .win,#fsheet .fs-btn,#fsheet .tl-play,#fs-show')].map(e=>[e.textContent.trim(),Math.round(e.getBoundingClientRect().height)]).filter(x=>x[1]<44));
 assert.deepEqual(small,[],JSON.stringify(small));
 await p.keyboard.press('Escape');await p.waitForTimeout(200);assert.equal(await p.locator('#fsheet').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'m-filters');});
await check('P6 choosing Energy and Asia shows a badge of 2, the button states the real article count, and the peek card follows; Reset undoes it',async()=>{
 await p.locator('#m-filters').click();await p.locator('#fsheet .chip',{hasText:'Energy'}).click();await p.locator('#reg-btn').click();await p.locator('#regions .reg',{hasText:'Asia'}).click();await p.waitForTimeout(500);
 assert.equal(await p.locator('#m-fcount').innerText(),'2');
 const n=await p.evaluate(()=>shown.length);assert.equal(await p.locator('#fs-show').innerText(),`Show ${n} ${n===1?'article':'articles'}`);
 await p.locator('#fs-show').click();await p.waitForTimeout(300);
 if(n)assert.equal(await p.evaluate(()=>$('peek').dataset.story),await p.evaluate(()=>[...shown].sort(sortTop)[0].id));else assert.match(await p.locator('#peek').innerText(),/No articles match/);
 await p.locator('#m-filters').click();await p.locator('#fs-reset').click();await p.waitForTimeout(400);assert.equal(await p.locator('#m-fcount').isVisible(),false);await p.locator('#fs-close').click();});
await check('P7 the dock switches Globe, News and Markets and marks the current one',async()=>{
 assert.equal(await p.locator('#dock [aria-current=page]').innerText(),'Globe');
 await p.locator('#dock [data-v=news]').click();await p.waitForTimeout(500);
 assert.equal(await p.locator('#dock [aria-current=page]').innerText(),'News');
 assert.match(await p.locator('#pbody .news-count').innerText(),/^\d+\s+articles? · 24H · Global/);
 assert((await p.locator('#pbody .lens-item').count())>5);assert.equal(await p.locator('#peek').isVisible(),false);
 await p.locator('#dock [data-v=markets]').click();await p.waitForTimeout(400);assert.equal(await p.locator('#dock [aria-current=page]').innerText(),'Markets');
 assert.deepEqual(await p.locator('.mk-row b').allInnerTexts(),['Sydney','Tokyo','Hong Kong','London','New York']);
 await p.locator('#dock [data-v=globe]').click();await p.waitForTimeout(400);assert.equal(await p.locator('#dock [aria-current=page]').innerText(),'Globe');assert.equal(await p.locator('#peek').isVisible(),true);});
await check('P8 news rows show time, source and the real % pill, same as the lens list',async()=>{
 await p.locator('#dock [data-v=news]').click();await p.waitForTimeout(500);
 const rows=await p.$$eval('#pbody .lens-item',els=>els.slice(0,12).map(e=>({id:e.dataset.story,t:e.querySelector('time')?.textContent||'',pct:e.querySelector('.pct')?.textContent.replace(/[^0-9.]/g,'')||''})));
 let priced=0;for(const r of rows){assert.match(r.t,/ago$/);const s=news.find(x=>x.id===r.id);const a=(s.impacts||[]).map(i=>i.ticker&&(markets[i.ticker.toUpperCase()]||markets[i.ticker.toUpperCase()+'-USD'])).find(a=>a&&Number.isFinite(a.d));if(a){priced++;assert.equal(r.pct,Math.abs(a.d).toFixed(2));}else assert.equal(r.pct,'');}
 assert(priced>0);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('.panel-tabs button')].map(e=>Math.round(e.getBoundingClientRect().height)));assert(tabs.every(h=>h>=44),tabs.join());
 const small=await p.evaluate(()=>[...document.querySelectorAll('#pbody .lens-item *,#pbody .panel-tabs button')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e.className||e.tagName,parseFloat(getComputedStyle(e).fontSize)]).filter(x=>x[1]<14));assert.deepEqual(small,[],JSON.stringify(small));
 await p.locator('#dock [data-v=globe]').click();await p.waitForTimeout(300);});
await check('P9 the globe and its pins stay clear of the top bar, the peek card and the zoom buttons',async()=>{
 const r=await p.evaluate(()=>{const pk=$('peek').getBoundingClientRect(),z=document.querySelector('.zoom').getBoundingClientRect(),t=document.querySelector('.top').getBoundingClientRect();
  return {bottomOk:globeBox.bottom<=pk.top,topOk:globeBox.top>=t.bottom,bad:drawn.filter(d=>d.y>pk.top-4||d.y<t.bottom||(d.x>z.left-14&&d.y>z.top-14&&d.y<z.bottom+14&&d.x<z.right+14)).length,n:drawn.length};});
 assert(r.bottomOk&&r.topOk,JSON.stringify(r));assert.equal(r.bad,0,JSON.stringify(r));assert(r.n>0);});
await check('P10 no horizontal overflow and no script errors on the phone',async()=>{assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(p.errors,[]);});
await p.context().close();
const d=await mk(1440,900);
await check('D1 the desktop layout is unchanged: chips and regions on the globe screen, no dock, no peek card, no Filters button',async()=>{
 assert.equal(await d.locator('#cats .chip').first().isVisible(),true);assert.equal(await d.locator('#reg-btn').isVisible(),true);assert.equal(await d.locator('#mine-btn').isVisible(),true);
 for(const s of ['#dock','#peek','#m-filters','#m-search','#fsheet'])assert.equal(await d.locator(s).isVisible(),false,s);assert.equal(await d.locator('#tl').isVisible(),true);});
await d.context().close();
await b.close();
fs.writeFileSync('tests/globe-phone-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
