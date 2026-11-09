// "Since the news" card (owner picked option B, 2026-10-26): grey before the article, red or green after, with plain-words fallbacks. Series are test fixtures for the UI; the real file is written by update_news_track.py.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n').filter(Boolean).slice(0,3).join(' | ')});}};
const MIN=60000;
const arrow=v=>v>0?'↑':v<0?'↓':'↔';
const hhmm=ms=>{const d=new Date(ms);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
async function open(ctx,url,trackBody){
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/assets/globe/news-track.json',r=>trackBody===null?r.fulfill({status:404,body:''}):r.fulfill({contentType:'application/json',body:JSON.stringify(trackBody)}));
 await p.goto(base+url);try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
 await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&MKT.all&&MKT.all.length>0);await p.waitForTimeout(700);p.errors=errors;
 if(url.includes('story='))await p.waitForSelector('.sn',{timeout:15000}).catch(async()=>{throw new Error('no card after opening the story; page errors='+JSON.stringify(errors)+'; view='+await p.evaluate(()=>view.k+' '+(window.TRACK===undefined?'':'')+document.getElementById('pbody').innerText.slice(0,120).replace(/\s+/g,' ')));});
 return p;}
for(const w of widths){
 const phone=w===390;
 const ctx=await b.newContext({viewport:viewport(w),isMobile:phone,hasTouch:phone,serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 // find a real story with an up/down call on a priced asset
 const probe=await open(ctx,'/assets/globe/news.html',null);
 const pick=await probe.evaluate(()=>{for(const s of [...stories].sort((a,b)=>b.t-a.t)){for(const i of impactsOf(s)){const a=assetForImpact(i);if(a&&(i.direction==='up'||i.direction==='down')&&Number.isFinite(a.d))return {id:s.id,pub:s.t,sym:a.s,name:a.n,d:a.d,dir:i.direction,pubIso:s.published_at};}}return null;});
 await probe.close();assert(pick,'no suitable story in the data');
 const series=(before,after)=>({schema:1,s:{[pick.sym]:[...before.map(([m,v])=>[Math.round((pick.pub+m*MIN)/MIN),100*(1+v/100)]),...after.map(([m,v])=>[Math.round((pick.pub+m*MIN)/MIN),100*(1+v/100)])]}});
 const bef=Array.from({length:12},(_,k)=>[-170+k*15,0.15*k/11]);
 const aft=(end)=>Array.from({length:36},(_,k)=>[5+k*15,end*(k/35)]);
 const story=`/assets/globe/news.html?story=${pick.id}`;
 const wrongEnd=pick.dir==='down'?+2.5:-2.5, rightEnd=pick.dir==='down'?-6.16:+6.16;
 await check(w,'SN1 normal: big number is the move since the first price after the article; before and after are in words; grey and coloured lines; marker with the publish time',async()=>{
  const t=series(bef,aft(rightEnd));const p=await open(ctx,story,t);const pts=t.s[pick.sym];
  const baseP=pts.find(x=>x[0]*MIN>=pick.pub)[1],cur=pts.at(-1)[1],mv=(cur/baseP-1)*100;
  const big=await p.locator('.sn-big').innerText();assert.equal(big.replace(/\s+/g,' '),`${arrow(mv)} ${Math.abs(mv).toFixed(2)}%`);
  const ba=await p.locator('.sn-ba').innerText();const b0=pts.filter(x=>x[0]*MIN<pick.pub);const bm=(b0.at(-1)[1]/b0[0][1]-1)*100;
  assert.match(ba,new RegExp(`Before:\\s*${arrow(bm)} ${Math.abs(bm).toFixed(2)}% · 3 hours`));assert.match(ba,new RegExp(`After:\\s*${arrow(mv)} ${Math.abs(mv).toFixed(2)}% · `));
  assert.equal(await p.locator('.sn svg path[stroke="#8b8b94"]:not([stroke-dasharray])').count(),1);assert((await p.locator('.sn svg path[stroke="#f87171"], .sn svg path[stroke="#34d399"]').count())>=1);
  assert.match(await p.locator('.sn-mark').innerText(),new RegExp(`Article posted here · ${hhmm(pick.pub)}`));
  assert.match(await p.locator('.sn-v').innerText(),new RegExp(`✓ the article said ${pick.dir} · it went ${pick.dir}`));
  assert.match(await p.locator('.sn-note').innerText(),/delayed 15–30 min\. Not investment advice/);assert.deepEqual(p.errors,[]);await p.close();});
 await check(w,'SN2 the article was wrong: the card says so plainly',async()=>{
  const p=await open(ctx,story,series(bef,aft(wrongEnd)));const went=pick.dir==='down'?'up':'down';
  assert.match(await p.locator('.sn-v').innerText(),new RegExp(`✗ the article said ${pick.dir} · it went ${went}`));await p.close();});
 await check(w,'SN3 a move under 0.3% is reported as "barely moved", not as right or wrong',async()=>{
  const p=await open(ctx,story,series(bef,aft(pick.dir==='down'?-0.1:0.1)));assert.match(await p.locator('.sn-v').innerText(),/barely moved/);await p.close();});
 await check(w,'SN4 no recording yet (file missing): no chart, plain explanation, and today\'s real move from the price file',async()=>{
  const p=await open(ctx,story,null);assert.equal(await p.locator('.sn svg').count(),0);
  const t=await p.locator('.sn').innerText();assert.match(t,/We started recording this article's price after it was published/);assert.match(t,/Showing today's move instead/);
  assert(t.replace(/\s+/g,' ').includes(`${arrow(pick.d)} ${Math.abs(pick.d).toFixed(2)}%`),t);await p.close();});
 await check(w,'SN5 a single recorded price says tracking has started and promises the chart after the next update',async()=>{
  const p=await open(ctx,story,series([],[[10,0]]));assert.match(await p.locator('.sn').innerText(),/Tracking started at \d\d:\d\d UTC\. The chart appears after the next price update/);assert.equal(await p.locator('.sn svg').count(),0);await p.close();});
 await check(w,'SN6 the first price came more than 90 minutes after the article and nothing before it: not shown as a since-the-news chart',async()=>{
  const p=await open(ctx,story,series([],[[120,0],[135,-1],[150,-2]]));assert.equal(await p.locator('.sn svg').count(),0);assert.match(await p.locator('.sn').innerText(),/We started recording/);await p.close();});
 await check(w,'SN7 a late first price (30 min) is stated in the note and the change is measured from it; no before data is described honestly',async()=>{
  const p=await open(ctx,story,series([],[[30,0],[45,-1],[60,-2]]));const n=await p.locator('.sn-note').innerText();assert.match(n,/first price 30 minutes after the article/);assert.doesNotMatch(await p.locator('.sn-ba').innerText(),/Before:/);assert.equal(await p.locator('.sn svg path[stroke="#8b8b94"]:not([stroke-dasharray])').count(),0);await p.close();});
 await check(w,'SN8 the pure calculation ignores bad points, sorts, and never invents a before line from one point',async()=>{
  const p=await open(ctx,story,null);const r=await p.evaluate(()=>{const pub=1e12;const m=x=>Math.round((pub+x*60000)/60000);
   const a=SinceNews.compute(pub,[[m(30),110],[m(5),100],[m(10),0],['x',1],[m(-10),99]],pub+3e6);
   const b=SinceNews.compute(pub,[[m(5),100],[m(20),90]],pub+3e6);return {a:a.state,aBefore:a.before.length,aMove:a.move,bMove:b.move,none:SinceNews.compute(pub,[],pub).state,junk:SinceNews.compute(pub,null,pub).state};});
  assert.equal(r.a,'ok');assert.equal(r.aBefore,0);assert(Math.abs(r.aMove-10)<1e-9,String(r.aMove));assert(Math.abs(r.bMove+10)<1e-9);assert.equal(r.none,'none');assert.equal(r.junk,'none');await p.close();});
 await check(w,'SN9 layout: the card fits the panel with no sideways scroll; its text is at least 13 px (14 px on phones)',async()=>{
  const p=await open(ctx,story,series(bef,aft(rightEnd)));
  if(phone)await p.evaluate(()=>{setSheet('full');});await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const c=document.querySelector('.sn').getBoundingClientRect(),pb=document.getElementById('pbody').getBoundingClientRect(),sizes=[...document.querySelectorAll('.sn-ba,.sn-axis,.sn-leg,.sn-note,.sn-v,.sn-eb')].map(e=>parseFloat(getComputedStyle(e).fontSize));return {fit:c.right<=pb.right+1&&c.left>=pb.left-1,min:Math.min(...sizes),over:document.documentElement.scrollWidth>innerWidth};});
  assert(r.fit,JSON.stringify(r));assert(r.min>=(phone?14:12),JSON.stringify(r));assert.equal(r.over,false);await p.close();});
 await check(w,'SN10 a story opened from a link before the prices have loaded still gets its card once they arrive',async()=>{
  const p=await ctx.newPage();await p.route('**/assets/globe/news-track.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(series(bef,aft(rightEnd)))}));
  await p.route('**/assets/globe/markets.json',async r=>{await new Promise(x=>setTimeout(x,7000));await r.continue();});
  await p.goto(base+story);
  await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&view.k==='article');assert.equal(await p.locator('.sn').count(),0,'prices should not be here yet');
  await p.waitForSelector('.sn',{timeout:20000});assert.match(await p.locator('.sn-big').innerText(),/\d+\.\d\d%/);await p.close();});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/since-news-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
