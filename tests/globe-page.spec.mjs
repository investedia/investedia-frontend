// The Globe page (globe.html) shows the full globe with its controls, not the controls-free embed used in the homepage hero.
import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',n,e.message.slice(0,300));}};
for(const w of [1440,390]){
  const c=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(c);
  await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
  const p=await c.newPage();await p.goto(base+'/globe.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
  await p.waitForSelector('#globe-frame');await p.waitForTimeout(3500);const f=p.frameLocator('#globe-frame');
  await t(w+' G1 the iframe loads the full globe page, not the embed',async()=>{assert.doesNotMatch(await p.locator('#globe-frame').getAttribute('src'),/embed=1/);});
  if(w===1440)await t(w+' G2 PC: top bar, news panel and timeline are visible',async()=>{for(const s of ['.top','.panel','.timeline'])assert.ok(await f.locator(s).first().isVisible(),s);});
  else await t(w+' G2 phone: the Globe / News / Markets dock is visible',async()=>{assert.ok(await f.locator('#dock').isVisible());});
  await t(w+' G3 no horizontal overflow',async()=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
  await c.close();}
await b.close();console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
