import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {launch} from './browser-support.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8820',out='.github/review/p19';fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync('assets/globe/news.html','utf8'),oldMode=execFileSync('git',['show','HEAD:tools/globe-news/projects-mode.js'],{encoding:'utf8'}),newMode=fs.readFileSync('tools/globe-news/projects-mode.js','utf8');
const draw=s=>s.slice(s.indexOf('function drawProj(){'),s.indexOf('function projTap('));
const browser=await launch(),results=[];
async function context(width,theme='dark',baseline=false){const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await c.route('https://**/*',r=>r.fulfill({contentType:'application/json',body:'{}',headers:{'access-control-allow-origin':'*'}}));
 await c.routeWebSocket(/wss:\/\/ws-feed\.exchange\.coinbase\.com\//,r=>r.close());
 if(baseline)await c.route('**/assets/globe/news.html*',r=>r.fulfill({contentType:'text/html',body:html.replace(draw(newMode),draw(oldMode))}));
 await c.addInitScript(theme=>{localStorage.setItem('inv-theme',theme);localStorage.setItem('inv-auth-seen','1');localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),necessary:true,preferences:true,images:false,analytics:false,live:false}));},theme);return c;}
try{
 for(const width of [1440,390])for(const theme of ['dark','light']){
  const c=await context(width,theme),p=await c.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(/projects(?:-featured)?\.json/.test(r.url()))requests.push(r.url())});
  await p.goto(base+'/assets/globe/news.html');await p.waitForFunction(()=>typeof PROJ!=='undefined');await p.waitForTimeout(300);assert.equal(requests.length,0,'B1 no project data request while News is active');
  await p.evaluate(()=>projSet(true));await p.waitForFunction(()=>PROJ.list.length>0);assert.equal(requests.length,2,'B1 lazy shared fetch once');
  const count=await p.evaluate(()=>PROJ.list.length);assert.equal(count,637,'B1 existing v1 retained');
  await p.waitForTimeout(500);assert((await p.evaluate(()=>PROJ.hits.filter(h=>!h.rect).length))<=(width===390?60:200),'B2 marker budget');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.evaluate(label=>{const l=document.createElement('div');l.textContent=label;l.style.cssText='position:fixed;bottom:5px;left:5px;z-index:99999;background:#ff7a1a;color:#111;font:600 11px Inter,sans-serif;padding:4px 8px';document.body.append(l)},`Built · P19 plumbing · ${width===390?'phone 390':'PC 1440'} · ${theme} · existing design`);
  await p.screenshot({path:`${out}/built-${width}-${theme}.png`});
  // Load/performance fixtures only: synthetic expansion of saved real coordinates is never published.
  const synthetic=await p.evaluate(async()=>{const saved=PROJ.vis;PROJ.vis=Array.from({length:4000},(_,i)=>({...saved[i%saved.length],id:'performance-fixture-'+i,featured:false,lat:Math.max(-89,Math.min(89,saved[i%saved.length].lat+Math.floor(i/saved.length)*.04)),lon:saved[i%saved.length].lon}));drawProj();const markers=PROJ.hits.filter(h=>!h.rect).length;PROJ.vis=saved;return {points:4000,markers};});assert(synthetic.markers<=(width===390?60:200));
  await p.evaluate(()=>projSet(false,{mode:'news'}));await p.evaluate(()=>projSet(true));await p.waitForTimeout(100);assert.equal(requests.length,2,'B1 cached on re-entry');
  await p.goto(base+'/sources.html');assert.equal(await p.locator('#projects-data h2').innerText(),'Projects data');const text=await p.locator('#projects-data').innerText();assert.match(text,/CC0 1.0/);assert.match(text,/CC BY-SA 4.0/);assert.match(text,/Not investment advice/);assert.match(text,/have not been added/);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);results.push({width,theme,existing_points:count,synthetic,assertions:'B1 lazy/v1/cache, B2 cap4000, B6 attribution, no overflow or console errors'});console.log('PASS',width,theme);await c.close();
 }
 for(const width of [1440,390]){
  const measurements=[];
  for(const baseline of [true,false,true,false]){
   const c=await context(width,'dark',baseline),p=await c.newPage();await p.goto(base+'/assets/globe/news.html?mode=projects');await p.waitForFunction(()=>typeof PROJ!=='undefined'&&PROJ.list.length>0);await p.waitForTimeout(600);
   const measurement=await p.evaluate(async ({baseline})=>{const saved=PROJ.vis;if(!baseline)PROJ.vis=Array.from({length:4000},(_,i)=>({...saved[i%saved.length],id:'performance-fixture-'+i,featured:false,lat:Math.max(-89,Math.min(89,saved[i%saved.length].lat+Math.floor(i/saved.length)*.04)),lon:saved[i%saved.length].lon}));
    // Time the actual scheduled complete globe frame, not FPS throttled to the screen's refresh rate.
    const old=frame,times=[];lon0=0;lat0=15;await new Promise(resolve=>{frame=function(t){lon0+=.05;const begin=performance.now();old(t);times.push(performance.now()-begin);if(times.length>=100){frame=old;resolve();}};});
    PROJ.vis=saved;times.sort((a,b)=>a-b);return {points:baseline?saved.length:4000,median_ms:times[50],p95_ms:times[95],frames:100};},{baseline});
   measurements.push({baseline,...measurement});await c.close();
  }
  const median=a=>{a.sort((x,y)=>x-y);return (a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2;},before=median(measurements.filter(x=>x.baseline).map(x=>x.median_ms)),after=median(measurements.filter(x=>!x.baseline).map(x=>x.median_ms)),regression_pct=100*(after-before)/before;
  const perf={width,measurements,baseline_median_ms:before,new_4000_median_ms:after,regression_pct,within_15_pct:regression_pct<=15};results.push(perf);console.log('PERF',JSON.stringify(perf));
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify({browser:'headless Chromium, shared cloud runner; not physical-phone hardware',date:'2026-11-11',camera:'rotating +0.05 degrees per measured frame',results},null,2)+'\n');
 assert(results.filter(r=>r.measurements).every(r=>r.within_15_pct),'B2 median complete-frame regression exceeds 15%');
}finally{await browser.close();}
