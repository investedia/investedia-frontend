// Regression: the orange country tint must never cover the whole globe. A country on the far side used to be pulled onto the edge and, filled, painted the entire disc orange at some rotations (reported on Safari, reproduced in Chromium).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(id,fn)=>{try{await fn();results.push({id,pass:true});}catch(e){results.push({id,pass:false,error:e.message.split('\n').filter(Boolean).slice(0,3).join(' | ')});}};
const c=await b.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(c);
await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
const p=await c.newPage();await p.goto(base+'/assets/globe/news.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&countries.length>overview.length);await p.waitForTimeout(1200);
const scan=zoom=>p.evaluate(zoom=>{const out=[],pts=[];for(let a=0;a<360;a+=20)for(const f of [.2,.5,.8])pts.push([Math.cos(a*Math.PI/180)*f,Math.sin(a*Math.PI/180)*f]);
 const set=zoom>=1.8?countries:overview;
 for(const la of [-70,-40,-10,24,55,80]) for(let lo=-180;lo<180;lo+=20){fly=null;lon0=lo;lat0=la;Zt=Z=zoom;R=R0*zoom;
  for(const c of set){if(!activity[c.name])continue;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.restore();
   ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.clip();countryShape(c,'rgba(255,255,255,1)');ctx.restore();
   const k=cv.width/innerWidth;let hit=0;for(const [dx,dy] of pts){const d=ctx.getImageData(Math.round((cx+dx*R)*k),Math.round((cy+dy*R)*k),1,1).data;if(d[3]>200)hit++;}
   if(hit>pts.length*.6)out.push(`${c.name}@${la}/${lo}`);}}
 return out;},zoom);
await check('O1 at normal zoom no country with news fills most of the globe at any rotation',async()=>assert.deepEqual(await scan(1),[]));
await check('O2 zoomed in (detailed map) no country fills most of the globe at any rotation',async()=>assert.deepEqual(await scan(2.4),[]));
await check('O3 countries entirely behind the globe add nothing to the picture',async()=>{
 const r=await p.evaluate(()=>{fly=null;Zt=Z=1;R=R0;lon0=-170;lat0=40;let tested=0,bad=[];
  for(const c of overview){const behind=c.rr.every(rr=>rr.every(([phi,lam])=>proj(phi,lam)[2]<0));if(!behind)continue;tested++;
   ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.restore();countryShape(c,'rgba(255,255,255,1)');
   const d=ctx.getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;if(n)bad.push(c.name);}
  return {tested,bad};});
 assert(r.tested>20,'few countries behind: '+r.tested);assert.deepEqual(r.bad,[]);});
await b.close();
fs.writeFileSync('tests/globe-orange-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
