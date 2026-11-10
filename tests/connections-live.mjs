import assert from 'node:assert/strict';import fs from 'node:fs';import {launch} from './browser-support.mjs';
const ROOT=new URL('../',import.meta.url),saved=JSON.parse(fs.readFileSync(new URL('assets/globe/connections.json',ROOT))),ASOF='2026-11-08T00:45:00Z';
const out=new URL('.github/review/connections-live/',ROOT);fs.mkdirSync(out,{recursive:true});
const browser=await launch(),reports=[];
async function context(width,theme,mode='api'){
 const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});let staticReads=0,apiReads=0;
 await c.route('**/assets/globe/connections.json',async r=>{staticReads++;return r.continue();});
 await c.route('https://**/*',r=>{
  if(new URL(r.request().url()).pathname==='/v1/connections'){apiReads++;return r.fulfill({status:mode==='fail'?503:200,contentType:'application/json',body:mode==='invalid'?'{}':mode==='empty'?JSON.stringify({...saved,connections:[]}):JSON.stringify(saved)});}
  return r.fulfill({contentType:'application/json',body:'{}'});
 });
 await c.addInitScript(({theme,asof})=>{localStorage.setItem('inv-theme',theme);localStorage.setItem('inv-auth-seen','1');localStorage.setItem('inv-pop','1');localStorage.setItem('inv-consent',JSON.stringify({version:1,date:asof,preferences:true,images:false,analytics:false,live:false}));},{theme,asof:ASOF});
 const p=await c.newPage(),errors=[],missingHistory=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'){const url=m.location().url||'';if(/\/events\/\d{4}-\d{2}-\d{2}\.json/.test(url)&&m.text().includes('404'))missingHistory.push(url.split('/').pop());else errors.push(m.text());}});await p.clock.install({time:new Date(ASOF)});await p.goto('http://127.0.0.1:8790/assets/globe/news.html');await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&!!CONN);return{c,p,errors,missingHistory,reads:()=>({staticReads,apiReads})};
}
try{
 for(const width of [1440,390])for(const theme of ['dark','light']){
  const s=await context(width,theme),counts={};
  assert.equal(await s.p.evaluate(()=>CONN.connectionSource),'api');assert.equal(s.reads().staticReads,0);
  for(const window of ['24h','48h','7d','30d']){
   await s.p.evaluate(window=>setWin(window),window);await s.p.waitForTimeout(150);
   counts[window]=await s.p.evaluate(()=>events.length);assert.ok(counts[window]>0,window+' must contain drawable lines');
   const label=`New · API lines · ${window.toUpperCase()} · ${width===390?'Phone 390':'PC 1440'} · ${theme} · Saved generator replay: 8 Nov 2026`;
   await s.p.evaluate(text=>{document.getElementById('review-label')?.remove();const e=document.createElement('div');e.id='review-label';e.textContent=text;e.style.cssText='position:fixed;bottom:4px;left:4px;z-index:999999;border:1px solid #ff7a1a;color:white;background:#101012;font:10px Inter,system-ui;padding:4px 6px;max-width:calc(100vw - 8px)';document.body.append(e);},label);
   await s.p.screenshot({path:new URL(`${window}-${width}-${theme}.png`,out).pathname});
  }
  assert.ok(counts['48h']>=counts['24h']&&counts['7d']>=counts['48h']&&counts['30d']>=counts['7d']);
  assert.equal(await s.p.evaluate(()=>InvConnectionsSource.dedupe([CONN.connections[0],CONN.connections[0]]).length),1);
  const freshness=await s.p.locator('#connections-freshness').textContent();assert.match(freshness,/Lines updated/);
  if(width===1440)await s.p.locator('#lay-btn').click();else await s.p.locator('#m-filters').click();
  await s.p.screenshot({path:new URL(`freshness-${width}-${theme}.png`,out).pathname});
  assert.deepEqual(s.errors,[]);reports.push({width,theme,counts,source:'api',pre_existing_missing_history_days:[...new Set(s.missingHistory)]});await s.c.close();
 }
 const fallback=await context(1440,'dark','fail');assert.equal(await fallback.p.evaluate(()=>CONN.connectionSource),'static');assert.equal(fallback.reads().staticReads,1);assert.ok(await fallback.p.evaluate(()=>events.length>0));assert.match(await fallback.p.locator('#connections-freshness').textContent(),/saved fallback/);await fallback.c.close();
 const empty=await context(1440,'dark','empty');assert.equal(await empty.p.evaluate(()=>CONN.connections.length),0);assert.equal(await empty.p.evaluate(()=>events.length),0);assert.equal(empty.reads().staticReads,0);await empty.c.close();
 const malformed=await context(1440,'dark','invalid');assert.equal(await malformed.p.evaluate(()=>CONN.connectionSource),'static');await malformed.c.close();
 const sticky=await context(1440);await sticky.p.route('**/v1/connections',r=>r.fulfill({status:503,body:'{}'}));await sticky.p.evaluate(()=>refreshConnections());assert.equal(await sticky.p.evaluate(()=>CONN.connectionSource),'api');await sticky.c.close();
 fs.writeFileSync(new URL('checks.json',out),JSON.stringify({replay_as_of:ASOF,real_generator_snapshot:saved.generated_at,reports,api_failure_fallback:'pass',healthy_empty_does_not_use_static:'pass',malformed_api_uses_static:'pass',api_last_good_retained_on_failure:'pass',live_ingestion_performed:false},null,2)+'\n');console.log(JSON.stringify(reports));
}finally{await browser.close();}
