import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,require,base} from './browser-support.mjs';
const {devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.P0_EVIDENCE_DIR||'design/evidence/p0-timeline';
const browser=await launch();
const median=a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)];};
try{
 const context=await browser.newContext(devices['iPhone 13']);
 await context.route('https://**/*',r=>r.fulfill({contentType:'text/plain',body:''}));
 await context.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-11-06T21:34:11Z']));}static now(){return NativeDate.parse('2026-11-06T21:34:11Z');}};window.__frames=[];const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf.call(window,t=>{const before=performance.now();cb(t);if(cb.name==='frame')window.__frames.push({t,cpu:performance.now()-before});});});
 const p=await context.newPage(),cdp=await context.newCDPSession(p);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.goto(`${base}/assets/globe/news.html`,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>stories.length>0);
 const consent=p.locator('[data-consent=essential]');if(await consent.isVisible())await consent.click();
 const camera=await p.evaluate(()=>({lon:lon0,lat:lat0,z:Zt}));
 const samples=[];
 for(const window of ['48h','30d','30d','48h']){
  await p.evaluate(k=>setWin(k),window);
  await p.evaluate(c=>{lon0=c.lon;lat0=c.lat;Z=Zt=c.z;},camera);
  await p.evaluate(()=>{window.__frames=[];});
  await p.waitForFunction(()=>window.__frames.length>=120,null,{timeout:120000});
  samples.push(await p.evaluate(k=>({window:k,articles:shown.length,places:SITES.length,frames:window.__frames.slice(20,120)}),window));
  console.log(window, {frames:samples.at(-1).frames.length, medianDrawMs:median(samples.at(-1).frames.map(f=>f.cpu))});
 }
 const metrics={};for(const k of ['48h','30d']){const frames=samples.filter(s=>s.window===k).flatMap(s=>s.frames);metrics[k]={articles:samples.find(s=>s.window===k).articles,places:samples.find(s=>s.window===k).places,samples:frames.length,medianFrameMs:median(frames.slice(1).map((f,i)=>f.t-frames[i].t).filter(t=>t>0&&t<1000)),medianDrawMs:median(frames.map(f=>f.cpu))};}
 const result={device:'iPhone 13',cpuSlowdown:4,asOf:'2026-11-06T21:34:11Z',order:samples.map(s=>s.window),metrics,frameRatio:metrics['30d'].medianFrameMs/metrics['48h'].medianFrameMs,drawRatio:metrics['30d'].medianDrawMs/metrics['48h'].medianDrawMs};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(`${out}/performance-results.json`,JSON.stringify(result,null,2)+'\n');console.log(result);
 assert.ok(result.frameRatio<=1.15,'A8: median animation frame interval regressed >15%');
 assert.ok(result.drawRatio<=1.15,'A8: median frame draw duration regressed >15%');
}finally{await browser.close();}
