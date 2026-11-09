// Owner changes (2026-10-25): crypto page shows Bitcoin plus the top 3 gainers and top 3 losers; "Crypto" is removed from the globe category bar.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(width,id,fn)=>{try{await fn();results.push({width,id,pass:true});}catch(e){results.push({width,id,pass:false,error:e.message.split('\n')[0]});}};
const pct=t=>Number(t.replace(/[^0-9.\-−]/g,'').replace('−','-'));
for(const w of widths){
 const ctx=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(ctx);
 await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const p=await ctx.newPage();
 await p.goto(base+'/markets.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2000});}catch{}await p.waitForTimeout(1500);
 await p.getByRole('button',{name:'Crypto',exact:true}).first().click();await p.waitForSelector('.mh-gl2');
 await check(w,'M1 crypto shows Bitcoin in one big card and a second square with the movers',async()=>{assert.equal(await p.locator('.mh-big2 .mh-bt:not(.mh-gl2)').count(),1);assert.match(await p.locator('.mh-big2 .mh-bt:not(.mh-gl2)').innerText(),/Bitcoin/);assert.equal(await p.locator('.mh-big2 .mh-gl2').count(),1);});
 await check(w,'M2 labels read "Top gainers · top 3" and "Top losers · top 3" with 3 rows each',async()=>{const labs=(await p.locator('.mh-gl2 .mh-lab').allInnerTexts()).map(t=>t.toLowerCase());assert.deepEqual(labs,['top gainers · top 3','top losers · top 3']);assert.equal(await p.locator('.mh-gl2 > div:nth-child(1) .mh-mini').count(),3);assert.equal(await p.locator('.mh-gl2 > div:nth-child(2) .mh-mini').count(),3);});
 await check(w,'M3 gainers are sorted best first, losers worst first, and no gainer is below any loser',async()=>{const g=(await p.locator('.mh-gl2 > div:nth-child(1) .mh-mini span').allInnerTexts()).map(pct),l=(await p.locator('.mh-gl2 > div:nth-child(2) .mh-mini span').allInnerTexts()).map(pct);assert.deepEqual(g,[...g].sort((a,c)=>c-a));assert.deepEqual(l,[...l].sort((a,c)=>a-c));assert(Math.min(...g)>=Math.max(...l));});
 await check(w,'M4 the old gainers and losers block below the table is gone',async()=>assert.equal(await p.locator('.mh-gl:not(.mh-gl2)').count(),0));
 await check(w,'M5 no horizontal overflow',async()=>assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false));
 await check(w,'M6 globe topic bar (lenses, chosen 2026-10-26) has no Crypto chip: All, Energy, Central banks, Trade & tariffs, Earnings',async()=>{await p.goto(base+'/assets/globe/news.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}await p.waitForTimeout(1500);const chips=(await p.locator('#cats .chip').allInnerTexts()).map(t=>t.replace(/\s*\d+$/,'').trim());assert(!chips.includes('Crypto'),chips.join(','));assert.deepEqual(chips,['All','Energy','Central banks','Trade & tariffs','Earnings']);});
 await ctx.close();
}
await b.close();
fs.writeFileSync('tests/markets-updates-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.width,r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
