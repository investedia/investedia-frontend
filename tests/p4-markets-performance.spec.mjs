// Run alone: compare the actual existing renderer in News and Markets, at 4x CPU.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {launch,require,base,fixtureExternal} from './browser-support.mjs';
const {devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),out=process.env.P4_EVIDENCE_DIR||'design/evidence/p4-markets-globe';fs.mkdirSync(out,{recursive:true});
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
const b=await launch(),samples=[];let result;
try{const c=await b.newContext(devices['iPhone 13']);await fixtureExternal(c);const p=await c.newPage();await p.goto(base+'/assets/globe/news.html?embed=1');await p.waitForFunction(()=>typeof MARKET!=='undefined'&&stories.length>0);const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.evaluate(()=>{window.p4samples=[];const old=frame;frame=function(t){const start=performance.now();old(t);if(window.p4capture)window.p4samples.push({t,cpu:performance.now()-start});};});
 for(const mode of ['news','markets','markets','news']){
  await p.evaluate(async mode=>{marketSetMode(mode);if(mode==='markets'){await marketInit();marketSelect('Nigeria');}fly=null;spin=null;lon0=3.38;lat0=6.52;Z=Zt=1;},mode);await p.waitForTimeout(1500);
  await p.evaluate(()=>{p4samples=[];window.p4capture=true;});await p.waitForFunction(()=>p4samples.length>=200,null,{timeout:120000});
  const row=await p.evaluate(()=>{window.p4capture=false;return{frames:p4samples,links:MARKET.drawnLines.map(l=>l.id),rings:MARKET.hits.length};});samples.push({mode,...row});console.log(mode,median(row.frames.map(f=>f.cpu)));
 }
 const metrics={};for(const mode of ['news','markets']){const groups=samples.filter(s=>s.mode===mode);metrics[mode]={samples:groups.reduce((n,g)=>n+g.frames.length,0),medianFrameMs:median(groups.flatMap(g=>g.frames.slice(1).map((f,i)=>f.t-g.frames[i].t).filter(t=>t>0&&t<1000))),medianDrawMs:median(groups.flatMap(g=>g.frames.map(f=>f.cpu)))};}
 result={baselineCommit:process.env.P4_BASELINE_COMMIT||'1a72e0045',device:'iPhone 13',cpuSlowdown:4,order:samples.map(s=>s.mode),selectedCountry:'Nigeria',maxDrawnLines:Math.max(...samples.map(s=>s.links.length)),metrics,frameRatio:metrics.markets.medianFrameMs/metrics.news.medianFrameMs,drawRatio:metrics.markets.medianDrawMs/metrics.news.medianDrawMs};
 result.pass=result.frameRatio<=1.15&&result.drawRatio<=1.15;fs.writeFileSync(out+'/performance-results.json',JSON.stringify(result,null,2)+'\n');assert.ok(result.pass,'A7 Markets frame interval and draw duration must be within 15% of News');
}finally{await b.close();console.log(JSON.stringify(result));}
