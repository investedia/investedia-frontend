// Real-data acceptance evidence. Run against candidate + an unchanged main server.
// No article fixtures: both servers must serve the same committed data snapshot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launch, require, base} from './browser-support.mjs';
const {devices}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.P0_EVIDENCE_DIR || 'design/evidence/p0-timeline';
fs.mkdirSync(out,{recursive:true});
const asOf=process.env.P0_AS_OF || '2026-11-06T21:34:11Z';
const results={asOf,baseline:process.env.P0_BASELINE_URL,checks:[],devices:{}};
const browser=await launch();
function check(id,ok,detail){results.checks.push({id,ok,detail:structuredClone(detail)});assert.ok(ok,`${id}: ${JSON.stringify(detail)}`);}
async function open(url,phone=false,embed=false){
 const context=await browser.newContext(phone?devices['iPhone 13']:{viewport:{width:1440,height:900}});
 await context.addInitScript(({asOf})=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[asOf]));}static now(){return NativeDate.parse(asOf);}};window.__frames=[];window.__firstReplay=null;const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf.call(window,t=>{const start=performance.now();cb(t);if(cb.name==='frame'){window.__frames.push({t,ms:performance.now()-start});if(window.__frames.length>3000)window.__frames.shift();if(typeof play!=='undefined'&&play&&shown.length&&!window.__firstReplay)window.__firstReplay={oldest:Math.min(...shown.map(s=>s.t)),start:play.start,cur:play.cur};}});},{asOf});
 // Optional third-party decoration is excluded; article/day/connection data stays real.
 await context.route('https://**/*',r=>r.fulfill({status:200,contentType:r.request().resourceType()==='stylesheet'?'text/css':'application/json',body:r.request().resourceType()==='stylesheet'?'':'{}'}));
 const page=await context.newPage(),events=[],errors=[],missing=[];
 page.on('request',r=>{if(r.url().includes('/events/'))events.push(r.url());});
 page.on('response',r=>{if(r.status()===404&&r.url().includes('/events/'))missing.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.location().url.includes('/events/'))errors.push(m.text());});
 await page.goto(`${url}/assets/globe/news.html${embed?'?embed=1':''}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>stories.length>0);
 const consent=page.locator('[data-consent=essential]');if(await consent.isVisible())await consent.click();
 return {context,page,events,errors,missing};
}
async function state(p){return p.evaluate(()=>({count:shown.length,oldest:new Date(Math.min(...shown.map(s=>s.t))).toISOString(),total:stories.length,unique:new Set(stories.map(s=>s.id)).size,places:SITES.length,text:tlInfo.innerText}));}
async function choose(p,k,phone){if(phone){await p.locator('.tb-btn').click();await p.locator(`#tb [data-k="${k}"]`).click();}else await p.locator(`#wins [data-k="${k}"]`).click();await p.waitForFunction(k=>F.win===k&&!historyLoading,k);}
async function shot(p,label,phone,k){
 if(phone&&k==='historical-article'){await p.locator('#grab').click();await p.waitForTimeout(500);}
 if(phone&&k!=='historical-article'){await p.locator('#dock [data-v="news"]').click();await p.locator('#grab').click();await p.waitForTimeout(500);}
 await p.evaluate(label=>{document.getElementById('evidence-label')?.remove();const el=document.createElement('div');el.id='evidence-label';el.textContent=label;el.style.cssText='position:fixed;top:64px;left:12px;z-index:99999;background:#ff7a1a;color:#000;font:700 16px sans-serif;padding:9px 12px;border-radius:8px;pointer-events:none';document.body.append(el);},`${label} · ${phone?'Phone 390px':'PC 1440px'} · ${k.toUpperCase()}`);
 if(phone&&k==='historical-article')await p.locator('#evidence-label').evaluate(el=>{el.style.top='8px';});
 await p.screenshot({scale:'css',path:path.join(out,`${label.toLowerCase()}-${phone?'phone':'pc'}-${k}.png`)});
 if(phone&&k==='historical-article'){await p.locator('#pbody .src').scrollIntoViewIfNeeded();await p.screenshot({scale:'css',path:path.join(out,'new-phone-historical-source.png')});}
 await p.evaluate(()=>document.getElementById('evidence-label').remove());
 if(phone)await p.locator('#dock [data-v="globe"]').click();
}
try{
 for(const phone of [false,true]){
  const device=phone?'phone':'pc',r=results.devices[device]={};
  if(results.baseline){const b=await open(results.baseline,phone);r.baseline={};for(const k of ['48h','7d','30d','24h']){await b.page.evaluate(k=>setWin(k),k);r.baseline[k]=await state(b.page);if(k!=='24h')await shot(b.page,'Now',phone,k);}await b.context.close();}
  const c=await open(base,phone),p=c.page;r.new={};
  const original=await p.evaluate(()=>Object.fromEntries(stories.map(s=>[s.id,JSON.stringify([s.headline,s.published_at,s.source,s.summary,s.impacts])])));
  for(const k of ['48h','24h']){await choose(p,k,phone);r.new[k]=await state(p);check(`A3 ${device} ${k}`,!r.baseline||r.new[k].count===r.baseline[k].count,{main:r.baseline?.[k].count,new:r.new[k].count});}
  check(`short windows ${device}`,c.events.length===0,c.events);
  await choose(p,'48h',phone);await shot(p,'New',phone,'48h');
  for(const k of ['7d','30d']){await choose(p,k,phone);r.new[k]=await state(p);const age=(Date.parse(asOf)-Date.parse(r.new[k].oldest))/86400000;check(`${k==='7d'?'A1':'A2'} ${device}`,k==='7d'?r.new[k].count>2000&&age>=6&&age<=7:r.new[k].count>5000&&r.new[k].oldest.startsWith('2026-10-15'),r.new[k]);await shot(p,'New',phone,k);}
  check(`A6 ${device}`,r.new['30d'].total===r.new['30d'].unique,r.new['30d']);
  await p.waitForFunction(()=>sitesFor===shown);
  check(`cluster metadata ${device}`,await p.evaluate(()=>[...clusterLists].every(([membership,data])=>{const list=membership.split(',').flatMap(i=>SITES[Number(i)].m).sort(sortTop),h=list[0];return data.key===list.map(s=>s.id).join()&&data.same===list.every(s=>Math.abs(s.location.lat-h.location.lat)<1&&Math.abs(s.location.lon-h.location.lon)<1);})), 'Cached lists and marker metadata match the original per-frame calculation');
  check(`connections ${device}`,await p.evaluate(()=>stories.filter(s=>s.historical).every(s=>!s.impacts.length&&!s.entities.length&&!s.links.length)&&network.filter(e=>e.article.historical).every(e=>(CONN?.connections||[]).some(c=>c.event===e.article.id))),'Historical markers carry no browser-inferred asset connections');
  check(`live precedence ${device}`,await p.evaluate(o=>Object.entries(o).every(([id,s])=>JSON.stringify([byId[id].headline,byId[id].published_at,byId[id].source,byId[id].summary,byId[id].impacts])===s),original),'All initially loaded records preserved byte-for-byte');
  const n=c.events.length;await choose(p,'7d',phone);await choose(p,'30d',phone);check(`cache ${device}`,c.events.length===n,{requests:c.events.length,distinct:new Set(c.events).size});
  for(const k of ['24h','48h']){await choose(p,k,phone);const s=await state(p);check(`A3 after history ${device} ${k}`,s.count===r.new[k].count,s);}
  await choose(p,'30d',phone);
  const article=await p.evaluate(()=>{const s=byId.n3fdac5b5fd;openStory(s);return {headline:s.headline,source:s.source,summary:s.summary,impacts:s.impacts,links:s.links};});
  const text=await p.locator('#pbody').innerText();
  const link=p.locator('#pbody a').filter({hasText:'Read article'});
  check(`A7 ${device}`,text.includes(article.headline)&&text.includes(article.source.name)&&text.includes('No Investedia summary')&&article.summary===''&&await link.getAttribute('href')===article.source.url,{...article,link:await link.getAttribute('href')});
  await shot(p,'New',phone,'historical-article');
  if(phone){await p.locator('#m-filters').click();}
  await p.locator('#play').click();
  if(phone)await p.locator('#fs-close').click();
  await p.waitForFunction(()=>window.__firstReplay!==null,null,{timeout:20000});
  r.replay=await p.evaluate(()=>window.__firstReplay);
  check(`A4 ${device}`,r.replay.oldest>=r.replay.start&&Date.parse(asOf)-r.replay.oldest>48*3600000,r.replay);
  await p.evaluate(()=>setWin('48h'));
  r.requests=c.events;r.missing=c.missing;r.errors=c.errors;
  check(`A9 ${device}`,c.errors.length===0,c.errors);
  await c.context.close();
  const e=await open(base,phone,true);await e.page.evaluate(async()=>{await setWin('7d');await setWin('30d');});
  check(`A5 ${device}`,e.events.length===0,e.events);await e.context.close();
 }
 // A late response must not change a newer selection. An actual fetch failure can retry.
 const race=await open(base);let release;const held=new Promise(resolve=>release=resolve);
 await race.page.route('**/events/2026-11-01.json',async route=>{await held;await route.continue();});
 const requested=race.page.waitForRequest('**/events/2026-11-01.json');
 await race.page.evaluate(()=>{setWin('7d');});await requested;
 await race.page.evaluate(()=>setWin('48h'));release();
 await race.page.waitForFunction(()=>historyDays.size===8&&stories.length>600);
 check('selection race',await race.page.evaluate(()=>F.win==='48h'&&play===null&&shown.length===600&&!historyLoading),'Late 7D response preserves the selected 48H view');
 await race.context.close();
 const retry=await open(base);let failures=0;
 await retry.page.route('**/events/2026-11-01.json',route=>failures++===0?route.fulfill({status:503,body:''}):route.continue());
 await retry.page.evaluate(()=>setWin('7d'));
 check('retry state',await retry.page.evaluate(()=>historyError&&!historyLoading),'503 has an honest retry state');
 await retry.page.evaluate(()=>setWin('7d'));
 check('retry success',await retry.page.evaluate(()=>!historyError&&shown.length>2000),{attempts:failures});
 await retry.context.close();
}finally{fs.writeFileSync(path.join(out,'functional-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close();}
