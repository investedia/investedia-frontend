// Logos and asset tiles must never balloon. Commodity tiles (.ai-c) were forced to 100% of their container by skin.css,
// so in containers without a fixed size (movers cards, "What moved" rows) they filled the whole card.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const MAX=64, TILES='.ai-t,.ai-i,.ai-c,.nb-lg,.nb-fl';
const pages=['index.html','news.html','movers.html','markets.html','asset.html?s=NG=F','asset.html?s=CL=F','asset.html?s=BTC','asset.html?s=AAPL','calendar.html','watchlist.html','screener.html','assets/globe/news.html'];
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n')[0]});}};
const oversized=p=>p.evaluate(({sel,max})=>[...document.querySelectorAll(sel)].map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {cls:String(e.getAttribute('class')||e.tagName),w:Math.round(r.width),h:Math.round(r.height),vis:c.display!=='none'&&c.visibility!=='hidden'};}).filter(x=>x.vis&&(x.w>max||x.h>max)),{sel:TILES,max:MAX});
for(const w of widths){
 const ctx=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const p=await ctx.newPage();let first=true;
 for(const pg of pages){await check(w,`L1 no tile larger than ${MAX}px on ${pg}`,async()=>{await p.goto(base+'/'+pg);if(first){try{await p.getByRole('button',{name:'Accept all',exact:true}).click({timeout:2500});}catch{}first=false;}await p.waitForTimeout(1800);assert.deepEqual(await oversized(p),[]);});}
 await check(w,'L2 commodity tiles in the movers cards are 22px',async()=>{await p.goto(base+'/news.html');await p.waitForSelector('.nf-t');await p.waitForTimeout(1500);const sizes=await p.$$eval('.nf-t small .ai-c',els=>els.map(e=>Math.round(e.getBoundingClientRect().width)));assert(sizes.length>=1,'a commodity mover is shown today');assert.deepEqual([...new Set(sizes)],[22]);});
 await check(w,'L3 commodity, crypto and company tiles keep their fixed size in every news container',async()=>{await p.goto(base+'/news.html');await p.waitForSelector('.nf-t');await p.waitForTimeout(1200);
  const got=await p.evaluate(()=>{const mk=(cls,inner)=>{const d=document.createElement('div');d.className=cls;d.innerHTML=inner;document.body.appendChild(d);return d;};const assets=[{s:'CL=F',n:'WTI crude oil',t:'cmd'},{s:'NG=F',n:'Natural gas',t:'cmd'},{s:'BTC-USD',n:'Bitcoin',t:'crypto'},{s:'AAPL',n:'Apple',t:'stocks'}];const out={};
   for(const [name,wrap] of [['nf-rx',h=>`<div class="nf-rx"><span>${h}</span><span class="nf-nmw"><b>x</b></span></div>`],['nf-chip',h=>`<span class="nf-chip">${h}</span>`],['nf-lg',h=>`<span class="nf-lg">${h}</span>`]])
    for(const a of assets){const el=mk('',wrap(AssetIcons.icon(a)));const t=el.querySelector('.ai-t,.ai-i,.nb-lg');const r=t.getBoundingClientRect();(out[name]=out[name]||[]).push(Math.round(r.width));el.remove();}return out;});
  for(const [k,v] of Object.entries({'nf-rx':26,'nf-chip':20,'nf-lg':38}))for(const x of got[k])assert.equal(x,v,`${k} tile is ${x}px, expected ${v}px`);});
 await check(w,'L4 search overlay commodity, crypto and company rows keep small logos',async()=>{await p.goto(base+'/index.html');await p.waitForTimeout(1200);await p.keyboard.press('/');await p.waitForTimeout(800);for(const f of ['cmd','crypto','stocks']){await p.locator(`[data-f=${f}]`).click();await p.waitForTimeout(400);assert.deepEqual(await oversized(p),[],f);}});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/logo-size-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
