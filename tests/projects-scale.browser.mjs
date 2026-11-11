import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base} from './browser-support.mjs';
const out='.github/review/projects-scale';fs.mkdirSync(out,{recursive:true});
const browser=await launch(),results=[];
try{
 for(const theme of ['dark','light'])for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.addInitScript(theme=>{localStorage.setItem('inv-theme',theme);localStorage.setItem('inv-auth-seen','1');localStorage.setItem('inv-pop','1');localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),necessary:true,preferences:true,images:false,analytics:false,live:false}));},theme);
  const page=await context.newPage(),errors=[],projectRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/projects(?:-featured)?\.json/.test(r.url()))projectRequests.push(r.url());});
  await page.goto(base+'/assets/globe/news.html');await page.waitForFunction(()=>typeof PROJ!=='undefined');
  assert.equal(projectRequests.length,0,'Projects fetch stays lazy in News');
  await page.evaluate(()=>projSet(true));await page.waitForFunction(()=>PROJ.list.length===308);
  assert.equal(projectRequests.length,2);assert.equal(await page.evaluate(()=>PROJ.list.length),308);
  await page.evaluate(()=>{PROJ.collapsed=false;PROJ.phoneDetail=false;projRender();});
  assert.equal(await page.evaluate(()=>DAY),theme==='light');
  assert.equal(await page.locator('.pjr').count(),30);
  assert.equal(await page.locator('.pjr .pj-row-tags .pjt:last-child').count(),30);
  await page.selectOption('[data-pf=s]','Under construction');
  assert(await page.evaluate(()=>PROJ.vis.every(p=>p.stage_group==='Under construction')));
  await page.selectOption('[data-pf=s]','Completed');
  assert(await page.evaluate(()=>PROJ.vis.every(p=>/^Completed 20/.test(p.stage))));
  await page.selectOption('[data-pf=s]','');
  await page.selectOption('[data-pf=t]','Real estate');assert.equal(await page.evaluate(()=>PROJ.vis.length),50);
  await page.selectOption('[data-pf=t]','');
  await page.locator('[data-pjmore]').click();assert.equal(await page.locator('.pjr').count(),60);
  await page.locator('[data-pj]').first().click();
  assert.equal(await page.locator('.pj-pro-preview a').getAttribute('href'),'../../projects.html#waitlist');
  assert.match(await page.locator('.pj-pro-preview').innerText(),/Pro · coming soon/);
  assert.match(await page.locator('#projPanel').innerText(),/Project facts are free/);
  assert(!/SAMPLE|locked|170 km|9 million/.test(await page.locator('#projPanel').innerText()));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.evaluate(label=>{const n=document.createElement('div');n.id='review-label';n.textContent=label;n.style.cssText='position:fixed;left:8px;bottom:4px;z-index:99999;background:#ff7a1a;color:#111;padding:4px 8px;border-radius:4px;font:600 12px Inter,sans-serif';document.body.append(n);},`New · Current Projects · ${width===390?'phone 390':'PC 1440'} · ${theme}`);
  await page.screenshot({path:`${out}/new-${width}-${theme}-detail.png`});
  if(width===390){await page.locator('[data-pj-back]').click();await page.screenshot({path:`${out}/new-${width}-${theme}-list.png`});}
  await page.evaluate(()=>{projSet(false,{mode:'markets'});marketSetMode('markets');marketSetMode('news');projSet(true);});
  assert.equal(projectRequests.length,2,'Mode switching reuses cached Projects');
  assert.deepEqual(errors,[]);
  // Browser frame cadence on the real dataset, followed by a synthetic-only stress fixture.
  const perf=await page.evaluate(async()=>{
   async function measure(){const times=[];let last;await new Promise(done=>{function tick(t){if(last)times.push(t-last);last=t;if(times.length<90)requestAnimationFrame(tick);else done();}requestAnimationFrame(tick);});return {fps:Math.round(1000/(times.reduce((a,b)=>a+b,0)/times.length)),p95_ms:Math.round([...times].sort((a,b)=>a-b)[Math.floor(times.length*.95)])};}
   const real=await measure(),saved=PROJ.vis;
   const fixture=Array.from({length:5000},(_,i)=>({id:'performance-fixture-'+i,name:'Synthetic performance fixture',country:'Fixture only',lat:-65+(i*0.347)%130,lon:-180+(i*0.733)%360}));
   PROJ.vis=fixture;const stress=await measure();PROJ.vis=saved;
   return {real,synthetic_5000:stress,fixture_only:true};
  });
  results.push({width,theme,projects:308,errors,overflow:false,lazy:true,...perf});
  await page.goto(base+'/projects.html');await page.locator('[data-project-cards] .pp-card').first().waitFor();assert.equal(await page.locator('[data-project-cards] .pp-card').count(),4);assert.deepEqual(errors,[]);
  await context.close();console.log('PASS',width,theme,JSON.stringify(perf));
 }
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
