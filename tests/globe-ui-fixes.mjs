// Offline real-feed replay. No provider requests, ingestion or date rewriting.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch} from './browser-support.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8780';
const out=new URL('../.github/review/globe-fixes/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const ASOF='2026-11-08T00:45:00Z', browser=await launch(),report=[];
async function setup(width,theme='dark',geo='success'){
 const c=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
 await c.route('https://**/*',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
 await c.addInitScript(({theme,geo,asof})=>{
  localStorage.setItem('inv-theme',theme);localStorage.setItem('inv-auth-seen','1');localStorage.setItem('inv-pop','1');
  localStorage.setItem('inv-consent',JSON.stringify({version:1,date:asof,preferences:true,images:false,analytics:false,live:false}));
  window.geoCalls=0;Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,no){window.geoCalls++;geo==='success'?ok({coords:{latitude:51.5,longitude:-.13,accuracy:25}}):no({code:1});}}});
 },{theme,geo,asof:ASOF});
 const page=await c.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.clock.install({time:new Date(ASOF)});await page.goto(base+'/assets/globe/news.html');
 await page.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&typeof MARKET!=='undefined');
 await page.waitForTimeout(450);return{c,page,errors,width,theme};
}
async function shot(s,name){
 await s.page.evaluate(text=>{document.getElementById('review-label')?.remove();const e=document.createElement('div');e.id='review-label';e.textContent=text;e.style.cssText='position:fixed;bottom:4px;left:4px;z-index:999999;background:#101012;color:#fff;border:1px solid #ff7a1a;padding:5px 8px;border-radius:5px;font:10px Inter,system-ui;max-width:calc(100vw - 8px)';document.body.append(e);},`New · Globe fixes · ${s.width===390?'Phone 390':'PC '+s.width} · ${s.theme} · Saved feed: 8 Nov 2026`);
 await s.page.screenshot({path:new URL(`${name}-${s.width}-${s.theme}.png`,out).pathname});
}
const box=locator=>locator.boundingBox();
function disjoint(a,b){return a.x+a.width<=b.x+1||b.x+b.width<=a.x+1||a.y+a.height<=b.y+1||b.y+b.height<=a.y+1;}
try{
 for(const width of [1180,1280,1440,1920]){
  const s=await setup(width),p=s.page;
  assert.equal(await p.locator('#reg-btn img,#regions img').count(),0);
  const region=await box(p.locator('#reg-btn')),time=await box(p.locator('.tf-btn')),search=await box(p.locator('#sbox')),sector=await box(p.locator('#sideSec'));
  assert.ok(disjoint(region,time)&&disjoint(region,search)&&disjoint(time,sector)&&disjoint(region,sector),'controls overlap '+width);
  await p.locator('#reg-btn').click();assert.equal(await p.locator('#regions').isVisible(),true);const menu=await box(p.locator('#regions'));assert.ok(menu.y>=region.y+region.height);assert.ok(menu.width>=region.width);
  await p.locator('.tf-btn').click();assert.equal(await p.locator('#regions').isVisible(),false);assert.equal(await p.locator('.tf-dd').getAttribute('class'),'dd tf-dd open');
  await p.locator('#lay-btn').click();assert.equal(await p.locator('.tf-btn').getAttribute('aria-expanded'),'false');assert.equal(await p.locator('#lay-pop').isVisible(),true);
  await p.keyboard.press('Escape');assert.equal(await p.locator('#lay-pop').isVisible(),false);
  assert.deepEqual(s.errors,[]);report.push({width,layout:'pass'});await s.c.close();
 }
 for(const width of [1440,390])for(const theme of ['dark','light']){
  const s=await setup(width,theme),p=s.page;
  await shot(s,'overview');
  if(width===390){await p.locator('#m-filters').click();await shot(s,'filters-layers');await p.locator('#fs-close').click();}
  if(width===1440){
   await p.locator('#lay-btn').click();await shot(s,'layers');await p.locator('#sw-conn').click();assert.equal(await p.locator('.lay-legend').isVisible(),false);await p.locator('#sw-rel').click();assert.equal(await p.locator('.lay-legend').isVisible(),true);await p.keyboard.press('Escape');
   const k=await p.locator('[data-sector]').first().getAttribute('data-sector');await p.locator(`[data-sector="${k}"]`).click();assert.ok(await p.evaluate(()=>shown.length>0&&shown.every(x=>x.category===F.cat)));assert.equal(await p.locator(`[data-sector="${k}"]`).getAttribute('aria-expanded'),'true');await shot(s,'sector');
   await p.locator(`[data-sector="${k}"]`).press('Enter');assert.equal(await p.evaluate(()=>F.cat),'all');
  }
  // A success must request permission once and reuse the in-memory marker.
  await p.locator('#zloc').click();assert.equal(await p.evaluate(()=>geoCalls),1);assert.ok(await p.evaluate(()=>userLoc?.la===51.5&&userLoc?.lo===-.13));await p.locator('#zloc').click();assert.equal(await p.evaluate(()=>geoCalls),1);await shot(s,'location');
  await p.evaluate(()=>InvGlobeNav.country('United States of America'));await p.waitForFunction(()=>!!GM&&!!document.querySelector('[data-gm-tab=news]'));
  if(width===390)await p.evaluate(()=>setSheet('full'));
  const back=await box(p.locator('.gf-detail-actions [data-back]')),follow=await box(p.locator('.gf-detail-actions [data-follow]')),close=await box(p.locator('.gf-detail-actions [data-detail-close]'));
  assert.ok(await p.locator('.gf-detail-actions [data-back]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=12));assert.ok(disjoint(back,follow)&&disjoint(back,close)&&disjoint(follow,close));
  if(width===1440){await p.locator('#lay-btn').click();await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>view.k),'country');}
  await p.locator('[role=tab][data-gm-tab=news]').click();assert.ok(await p.locator('[data-country-topic]').count()>1);await shot(s,'country-news');
  const topic=p.locator('[data-country-topic]').nth(1);const category=await topic.getAttribute('data-country-topic');await topic.click();assert.ok(await p.evaluate(k=>[...document.querySelectorAll('.gm-news')].every(el=>byId[el.dataset.story].category===k),category));
  await p.locator('[role=tab][data-gm-tab=overview]').click();assert.ok(await p.locator('.gf-abroad tbody tr').count()<=5);await shot(s,'abroad');
  const full=p.locator('[data-gm-tab=abroad]');if(await full.count()){await full.first().click();await p.locator('#gf-abroad-query').fill('zz-no-match');assert.equal(await p.locator('.gf-abroad tbody tr').count(),0);await p.locator('#gf-abroad-query').fill('');await shot(s,'abroad-full');}
  const mono=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length&&el.textContent.trim()&&/Geist Mono|monospace/.test(getComputedStyle(el).fontFamily)).map(el=>el.className));assert.deepEqual(mono,[]);
  await p.locator('[data-detail-close]').click();assert.equal(await p.locator('#cv').isVisible(),true);
  await p.evaluate(()=>selectAsset(MKT.all.find(a=>a.t==='stocks')?.s||MKT.all[0].s));if(width===390)await p.evaluate(()=>setSheet('full'));await shot(s,'asset');
  const ab=await box(p.locator('.gf-detail-actions [data-back]')),ax=await box(p.locator('.gf-detail-actions [data-detail-close]'));assert.ok(disjoint(ab,ax));await p.locator('[data-detail-close]').click();
  await p.evaluate(()=>marketSetMode('markets'));assert.equal(await p.evaluate(()=>MARKET.on),true);await p.evaluate(()=>marketSelect('United States of America'));await p.waitForFunction(()=>!marketPanel.hidden&&MARKET.ready);await p.locator('[data-ctab=news]').click();await shot(s,'market-country-news');await p.locator('.market-panel .market-close').click();assert.equal(await p.locator('#cv').isVisible(),true);await shot(s,'markets');await p.evaluate(()=>marketSetMode('news'));assert.equal(await p.evaluate(()=>MARKET.on),false);assert.equal(await p.locator('#cv').isVisible(),true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(s.errors,[]);report.push({width,theme,ui:'pass'});await s.c.close();
 }
 const denied=await setup(1440,'dark','denied');await denied.page.locator('#zloc').click();assert.equal(await denied.page.locator('.location-status').textContent(),'Location unavailable');await shot(denied,'location-denied');await denied.c.close();
 fs.writeFileSync(new URL('checks.json',out),JSON.stringify({as_of:ASOF,fixture:'unchanged saved real feed; browser clock replay only',report},null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
