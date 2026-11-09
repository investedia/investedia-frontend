// Owner picks (2026-10-25): indices = region button on wide screens + region tabs on phones; commodities = scoreboard on wide screens + grouped list with chips on phones.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const markets=Object.fromEntries(JSON.parse(fs.readFileSync('assets/globe/markets.json')).assets.map(a=>[a.s,a]));
const GROUPS={Energy:['BZ=F','CL=F','NG=F','HO=F','RB=F'],Metals:['GC=F','SI=F','HG=F','PL=F'],Agriculture:['ZW=F','ZC=F','ZS=F','KC=F','SB=F','CC=F','CT=F']};
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n')[0]});}};
const num=t=>Number(t.replace(/[^0-9.\-−]/g,'').replace('−','-'));
for(const w of widths){
 const phone=w===390;
 const ctx=await b.newContext({viewport:viewport(w),isMobile:phone,hasTouch:phone,serviceWorkers:'block'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const p=await ctx.newPage();
 await p.goto(base+'/markets.html?view=idx&region=Europe');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2000});}catch{}await p.waitForSelector('.mh-sec .mh-tbl');
 await check(w,'I1 only the chosen region is shown (one table), not every continent stacked',async()=>{assert.equal(await p.locator('.mh-sec .mh-tbl').count(),1);assert.match(await p.locator('.mh-tr').first().innerText(),/FTSE/);});
 if(!phone){
  await check(w,'I2 wide: "Region: Europe ▾" button with ‹ › arrows and an "n indices · average" summary',async()=>{assert.match(await p.locator('.mh-rbtn').innerText(),/Region: Europe/);assert.equal(await p.locator('.mh-rstep').count(),2);assert.match(await p.locator('.mh-rsum').innerText(),/7 indices · average[\s\S]*%/);assert.equal(await p.locator('.mh-rtabs.mh-rg-ph').isVisible(),false);});
  await check(w,'I3 wide: the menu lists each region with its average move plus "All regions"',async()=>{await p.locator('.mh-rbtn').click();const items=await p.locator('#mh-rmenu [role=menuitem]').allInnerTexts();assert.equal(items.length,4);assert.match(items[0],/Americas/);assert.match(items[0],/%/);assert(items[3].includes('All regions'));assert.equal(await p.locator('.mh-rbtn').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('#mh-rmenu').isHidden(),true);});
  await check(w,'I4 wide: choosing a region changes the table; ‹ › step and wrap; All shows three tables',async()=>{await p.locator('.mh-rbtn').click();await p.locator('#mh-rmenu [data-region=Asia-Pacific]').click();assert.match(await p.locator('.mh-tr').first().innerText(),/Nikkei/);await p.locator('[data-rstep="1"]').click();assert.match(await p.locator('.mh-rbtn').innerText(),/All regions/);assert.equal(await p.locator('.mh-sec .mh-tbl').count(),3);await p.locator('[data-rstep="1"]').click();assert.match(await p.locator('.mh-rbtn').innerText(),/Americas/);});
 } else {
  await check(w,'I2 phone: region tabs Americas | Europe | Asia | All, Europe pressed; no wide-screen button',async()=>{const t=await p.locator('.mh-rtabs.mh-rg-ph button').allInnerTexts();assert.deepEqual(t,['Americas','Europe','Asia','All']);assert.equal(await p.locator('.mh-rtabs.mh-rg-ph [aria-pressed=true]').innerText(),'Europe');assert.equal(await p.locator('.mh-rg-pc').isVisible(),false);});
  await check(w,'I3 phone: tapping Asia shows the Asia-Pacific table, All shows three',async()=>{await p.locator('.mh-rg-ph [data-region=Asia-Pacific]').click();assert.match(await p.locator('.mh-tr').first().innerText(),/Nikkei/);await p.locator('.mh-rg-ph [data-region=All]').click();assert.equal(await p.locator('.mh-sec .mh-tbl').count(),3);});
  await check(w,'I3b phone: region tab targets are at least 44px tall',async()=>{const h=await p.$$eval('.mh-rg-ph button',els=>els.map(e=>e.getBoundingClientRect().height));assert(h.every(x=>x>=44),h.join(','));});
 }
 await check(w,'I5 ?region=Asia opens that region',async()=>{await p.goto(base+'/markets.html?view=idx&region=Asia');await p.waitForSelector('.mh-sec .mh-tbl');assert.match(await p.locator('.mh-tr').first().innerText(),/Nikkei/);});
 // ---- commodities ----
 await p.goto(base+'/markets.html?view=cmd');await p.waitForSelector('.mh-cm-pc .mh-cg',{state:'attached'});
 if(!phone){
  await check(w,'C1 wide: three group cards Energy, Metals, Agriculture, each with an average pill',async()=>{const names=await p.locator('.mh-cg .mh-cgh b').allInnerTexts();assert.deepEqual(names,['Energy','Metals','Agriculture']);assert.equal(await p.locator('.mh-cgh .mh-chip').count(),3);});
  await check(w,'C2 wide: the biggest mover of each group is the real largest move (markets.json)',async()=>{for(const [g,syms] of Object.entries(GROUPS)){const card=p.locator('.mh-cg',{has:p.locator(`.mh-cgh b:text-is("${g}")`)});const top=await card.locator('.mh-cbig').getAttribute('data-s');const best=syms.filter(s=>markets[s]).sort((a,c)=>markets[c].d-markets[a].d)[0];assert.equal(top,best,g);assert.equal(num(await card.locator('.mh-cbig strong').innerText()),Math.abs(markets[best].d));}});
  await check(w,'C3 wide: the rest of each group is listed as small rows with a sparkline and %',async()=>{const n=await p.locator('.mh-cg .mh-cr').count();assert.equal(n,Object.values(GROUPS).flat().filter(s=>markets[s]).length-3);assert.equal(await p.locator('.mh-cg .mh-cr svg').count(),n);});
  await check(w,'C4 wide: a row opens the asset pop-up',async()=>{await p.locator('.mh-cg .mh-cr').first().click();await p.waitForTimeout(800);assert(await p.evaluate(()=>/s=|#/.test(location.hash+location.search)||!!document.querySelector('.pk.on,.pk-s.on,[class*=pk][aria-modal=true],.ap')||location.pathname.includes('asset')));});
 } else {
  await check(w,'C1 phone: chips All | Energy | Metals | Agri, no wide scoreboard',async()=>{assert.deepEqual(await p.locator('.mh-cm-chips button').allInnerTexts(),['All','Energy','Metals','Agri']);assert.equal(await p.locator('.mh-cm-pc').isVisible(),false);});
  await check(w,'C2 phone: Energy chip shows only the 5 energy markets with price, sparkline and %',async()=>{await p.locator('[data-cgrp=Energy]').click();assert.equal(await p.locator('.mh-cl').count(),5);const t=await p.locator('.mh-cl').first().innerText();assert.match(t,/Brent/);assert.match(t,/\d/);assert.equal(await p.locator('.mh-cl svg').count(),5);});
  await check(w,'C3 phone: All shows 16 markets under group headings; chip targets >=44px',async()=>{await p.locator('[data-cgrp=All]').click();assert.equal(await p.locator('.mh-cl').count(),Object.values(GROUPS).flat().filter(s=>markets[s]).length);assert.equal(await p.locator('.mh-cll .mh-lab').count(),3);const h=await p.$$eval('.mh-cm-chips button',els=>els.map(e=>e.getBoundingClientRect().height));assert(h.every(x=>x>=44),h.join(','));});
 }
 await check(w,'X1 no horizontal overflow on indices and commodities',async()=>{for(const u of ['?view=idx&region=All','?view=cmd']){await p.goto(base+'/markets.html'+u);await p.waitForTimeout(1500);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,u);}});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/indices-commodities-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
