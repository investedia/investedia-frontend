import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
for(const w of [390,1440]){
  const c=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(c);
  await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
  const p=await c.newPage();await p.goto(base+'/index.html');
  try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
  await p.waitForSelector('#hnGlobe');await p.waitForTimeout(2500);
  const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',w,n,e.message.slice(0,700));}};
  await t('H1 hero globe shows no dock, peek, filters sheet or layers',async()=>{
    const f=p.frameLocator('#hnGlobe');
    for(const s of ['.dock','.peek','.fsheet','.layers'])assert.equal(await f.locator(s).first().isVisible().catch(()=>false),false,s);});
  await t('H2 Open globe button is small, tappable, clear of the ticker and links to the globe',async()=>{
    const a=p.locator('.hn-open');assert.equal(await a.getAttribute('href'),'/assets/globe/news.html');
    const r=await a.boundingBox(),k=await p.locator(w>900?'.hn-hero':'.hn-tick').boundingBox();
    assert.ok(r.height>=44&&(w>900?r.width<200:r.width<90));assert.ok(w>900?(r.y+r.height<=k.y+k.height&&r.y+r.height>=k.y+k.height-80):r.y+r.height<=k.y+1);assert.ok(r.x+r.width<=w);});
  await t('H3 no horizontal overflow',async()=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
  await t('H4 clicking it opens the globe page',async()=>{await p.locator('.hn-open').click({noWaitAfter:true});await p.waitForURL(/assets\/globe\/news\.html/,{waitUntil:'commit'});});
  await c.close();}
await b.close();console.log(fail?fail+' failed':'4/4 passed per viewport');process.exit(fail?1:0);
