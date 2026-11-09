// Acceptance tests for the globe controls the owner chose on 2026-10-26: 1A Layers menu, 2C topic chips with count badges, 3C region flag stacks + globe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n').filter(Boolean).slice(0,4).join(' | ')});}};
for(const w of widths){
 const phone=w===390;
 const ctx=await b.newContext({viewport:viewport(w),isMobile:phone,hasTouch:phone,serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/assets/globe/news.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
 await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&MKT.all&&MKT.all.length>0);await p.waitForTimeout(900);
 const openLayers=async()=>{if(phone){if(await p.locator('#fsheet').isHidden())await p.locator('#m-filters').click();}else if(await p.locator('#lay-pop').isHidden())await p.locator('#lay-btn').click();};
 const closeLayers=async()=>{if(phone){if(await p.locator('#fsheet').isVisible())await p.locator('#fs-close').click();}else if(await p.locator('#lay-pop').isVisible())await p.keyboard.press('Escape');};
 // ---- 1A layers ----
 await check(w,'LA1 the Layers card is closed when the globe opens, with Connections on and Market hours off',async()=>{
  if(!phone){assert.equal(await p.locator('#lay-btn').isVisible(),true);assert.equal(await p.locator('#lay-btn').getAttribute('aria-expanded'),'false');assert.equal(await p.locator('#lay-pop').isVisible(),false);assert.equal(await p.locator('.legend').count(),0);}
  const r=await p.evaluate(()=>({conn:$('sw-conn').getAttribute('aria-checked'),mkt:$('sw-mkt').getAttribute('aria-checked'),n:$('lay-n').textContent}));assert.deepEqual(r,{conn:'true',mkt:'false',n:'1'});});
 await check(w,'LA2 the menu holds two real switches, says how many connections are shown, and keeps the legend',async()=>{
  await openLayers();
  assert.equal(await p.locator('#sw-conn[role=switch]').isVisible(),true);assert.equal(await p.locator('#sw-mkt[role=switch]').isVisible(),true);
  const n=await p.evaluate(()=>network.length);assert.match(await p.locator('#connection-count').innerText(),new RegExp(`^Show all ${n} connections? from the last `));
  if(!phone)assert.match(await p.locator('.lay-legend').innerText(),/News origin[\s\S]*Asset[\s\S]*Asset/);
  if(!phone){assert.equal(await p.locator('#lay-btn').getAttribute('aria-expanded'),'true');}});
 await check(w,'LA3 switching Connections off removes every line and pill from the globe; on brings them back',async()=>{
  await openLayers();const before=await p.evaluate(()=>+cv.dataset.arcCount);assert(before>0,'no arcs to start with');
  await p.locator('#sw-conn').click();await p.waitForTimeout(500);
  const off=await p.evaluate(()=>({arcs:+cv.dataset.arcCount,hits:arcHits.length,pills:pillRects.length,checked:$('sw-conn').getAttribute('aria-checked'),n:$('lay-n').textContent}));
  assert.deepEqual(off,{arcs:0,hits:0,pills:0,checked:'false',n:'0'});
  await p.locator('#sw-conn').click();await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>+cv.dataset.arcCount)>0,true);assert.equal(await p.locator('#lay-n').innerText(),'1');});
 await check(w,'LA4 switching Market hours on shows the night shade and exchange dots and the count becomes 2; off removes them',async()=>{
  await openLayers();await p.locator('#sw-mkt').click();await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>MKTON),true);assert.equal(await p.locator('#lay-n').innerText(),'2');
  if(!phone){assert.equal(await p.locator('#panel-tab-markets').isVisible(),true);}
  await p.locator('#sw-mkt').click();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>MKTON),false);assert.equal(await p.locator('#lay-n').innerText(),'1');assert.equal(await p.evaluate(()=>exHits.length),0);});
 if(!phone)await check(w,'LA5 the card stays open when the globe is dragged or clicked; the button and Escape hide it and bring it back',async()=>{
  if(await p.locator('#lay-pop').isHidden())await p.locator('#lay-btn').click();
  await p.mouse.move(600,500);await p.mouse.down();await p.mouse.move(700,520,{steps:5});await p.mouse.up();await p.mouse.click(620,430);assert.equal(await p.locator('#lay-pop').isVisible(),true,'closed by touching the globe');
  await p.locator('#lay-btn').click();assert.equal(await p.locator('#lay-pop').isVisible(),false,'button hides');assert.equal(await p.locator('#lay-btn').getAttribute('aria-expanded'),'false');
  await p.locator('#lay-btn').click();assert.equal(await p.locator('#lay-pop').isVisible(),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#lay-pop').isVisible(),false,'escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'lay-btn','focus');});
 await check(w,'LA7 every time the globe opens, Connections is on and Market hours is off (nothing is remembered)',async()=>{
  await p.evaluate(()=>{CONNON=false;setMarketsLayer(true);});await p.goto(base+'/assets/globe/news.html');await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0);await p.waitForTimeout(700);
  assert.deepEqual(await p.evaluate(()=>({c:CONNON,m:MKTON,n:$('lay-n').textContent})),{c:true,m:false,n:'1'});assert((await p.evaluate(()=>+cv.dataset.arcCount))>0);});
 await check(w,'LA6 ?connections=0 opens with connections off',async()=>{
  await closeLayers();await p.goto(base+'/assets/globe/news.html?connections=0');await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0);await p.waitForTimeout(700);
  assert.equal(await p.evaluate(()=>CONNON),false);assert.equal(await p.evaluate(()=>+cv.dataset.arcCount),0);});
 // ---- 2C topic chips ----
 await check(w,'TC1 the topic bar has no dark pill container; each topic is its own outlined chip with a round count badge',async()=>{
  await p.goto(base+'/assets/globe/news.html');await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0);await p.waitForTimeout(700);
  if(phone){await p.locator('#m-filters').click();}
  const r=await p.evaluate(()=>{const c=getComputedStyle($('cats')),chip=document.querySelector('#cats .chip'),bd=chip.querySelector('b'),cs=getComputedStyle(chip),bs=getComputedStyle(bd),r=bd.getBoundingClientRect();
   return {contBg:c.backgroundColor,contBorder:c.borderTopWidth,chipBorder:cs.borderTopWidth,badgeRadius:bs.borderTopLeftRadius,badge:[Math.round(r.width),Math.round(r.height)],h:Math.round(chip.getBoundingClientRect().height)};});
  assert.equal(r.contBg,'rgba(0, 0, 0, 0)');assert.equal(r.contBorder,'0px');assert.equal(r.chipBorder,'1px');assert.equal(r.badge[1],26);assert(r.badge[0]>=26);assert(r.h>=(phone?44:40),JSON.stringify(r));});
 await check(w,'TC2 the active chip is white with a black badge; the numbers are the real counts',async()=>{
  const r=await p.evaluate(()=>{const on=document.querySelector('#cats .chip[aria-pressed=true]'),bd=on.querySelector('b');return {bg:getComputedStyle(on).backgroundColor,fg:getComputedStyle(on).color,bbg:getComputedStyle(bd).backgroundColor,txt:[...document.querySelectorAll('#cats .chip')].map(c=>c.textContent.trim().replace(/\s+/g,' ')),all:stories.filter(matchNoLens).length};});
  assert.equal(r.bg,'rgb(255, 255, 255)');assert.equal(r.bbg,'rgb(0, 0, 0)');assert.equal(r.txt[0],`All ${r.all}`);assert.deepEqual(r.txt.map(t=>t.replace(/ \d+$/,'')),['All','Energy','Central banks','Trade & tariffs','Earnings']);});
 // ---- 3C regions ----
 const openReg=async()=>{if(phone&&await p.locator('#fsheet').isHidden())await p.locator('#m-filters').click();if(await p.locator('#regions').isHidden())await p.locator('#reg-btn').click();};
 await check(w,'RG1 the region menu has All regions with the globe icon and seven plain-text regions, each with a count',async()=>{
  await openReg();
  const r=await p.$$eval('#regions .reg',els=>els.map(e=>({k:e.dataset.k,label:e.querySelector('.rg-name').textContent.trim(),globe:e.querySelector('.rg-globe')?.getAttribute('src')||'',imgs:e.querySelectorAll('img').length,n:+e.querySelector('[data-n]').textContent})));
  assert.deepEqual(r.map(x=>x.k),['global','na','eu','asia','me','af','latam','oc']);
  assert.equal(r[0].label,'All regions');assert.equal(r[0].globe,'region-globe.png');assert.deepEqual(r.slice(1).map(x=>x.imgs),[0,0,0,0,0,0,0]);
  assert.deepEqual(r.slice(1).map(x=>x.label),['North America','Europe','Asia','Middle East','Africa','Latin America','Oceania']);
  assert.equal(r.slice(1).reduce((a,x)=>a+x.n,0),r[0].n,'regions add up to All regions');});
 await check(w,'RG2 the icon file loads (no broken image)',async()=>{
  const bad=await p.evaluate(async()=>{const imgs=[...document.querySelectorAll('#reg-dd img')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;})));return imgs.filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'));});assert.deepEqual(bad,[]);});
 await check(w,'RG3 choosing a region filters and turns the globe, closes the menu, and the button says which region',async()=>{
  await openReg();await p.locator('#regions .reg[data-k=eu]').click();await p.waitForTimeout(400);
  const r=await p.evaluate(()=>({reg:F.region,bad:shown.some(s=>s.location.region!=='eu'),open:!$('regions').hidden,label:$('reg-label').textContent}));assert.deepEqual(r,{reg:'eu',bad:false,open:false,label:'Region: Europe'});
  await openReg();await p.locator('#regions .reg[data-k=global]').click();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>F.region),'global');assert.equal(await p.locator('#reg-label').innerText(),'Region: All regions');});
 await check(w,'X1 no script errors and no horizontal overflow',async()=>{assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/globe-controls-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
