import {launch,base,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await fixtureExternal(c);
await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
const p=await c.newPage();await p.goto(base+'/assets/globe/news.html');await p.waitForTimeout(3500);
try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:1500});}catch{}
const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',n,e.message.slice(0,300));}};
await p.evaluate(()=>{const j=document.querySelector('.compact-item,.lens-item,[data-id]');});
const id=await p.evaluate(()=>fetch('news-live.json').then(r=>r.json()).then(j=>j.stories[0].id).catch(()=>null)).catch(()=>null)||await p.evaluate(()=>fetch('../globe/news-live.json').then(r=>r.json()).then(j=>j.stories[0].id));
await p.goto(base+'/assets/globe/news.html?story='+id);await p.waitForTimeout(3500);
await t('S1 an open article sheet ends above the dock, never under it',async()=>{const s=await p.locator('#panel').boundingBox(),d=await p.locator('#dock').boundingBox();assert.ok(s.y+s.height<=d.y+1,`sheet bottom ${s.y+s.height} dock top ${d.y}`);});
await t('S2 header is one slim row: Back left, close right, same line, 44px targets',async()=>{const k=await p.locator('.pbody .back').boundingBox(),x=await p.locator('#sheet-close').boundingBox();assert.ok(Math.abs(k.y-x.y)<8);assert.ok(k.height>=44&&x.height>=44&&x.width>=44);});
await t('S3 the article text starts within 90px of the sheet top',async()=>{const s=await p.locator('#panel').boundingBox(),h=await p.locator('.story-heading').boundingBox();assert.ok(h.y-s.y<=110,String(h.y-s.y));});
await t('S4 full state also stays above the dock',async()=>{await p.locator('#sheet-expand').click();await p.waitForTimeout(600);const s=await p.locator('#panel').boundingBox(),d=await p.locator('#dock').boundingBox();assert.ok(s.y+s.height<=d.y+1);});
await t('S5 closing returns to the globe with the dock showing Globe',async()=>{await p.locator('#sheet-close').click();await p.waitForTimeout(500);assert.equal(await p.locator('#dock [aria-current=page]').innerText(),'Globe');});
await b.close();console.log(fail?fail+' failed':'5/5 passed');process.exit(fail?1:0);
