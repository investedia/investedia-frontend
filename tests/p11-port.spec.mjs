// Port acceptance from old PR49; real saved articles, current split layout and consent API.
import assert from 'node:assert/strict';
import {launch,base,fixtureExternal} from './browser-support.mjs';
const browser=await launch();
try{for(const width of [1440,390])for(const theme of ['dark','light']){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await fixtureExternal(context);await context.addInitScript(theme=>{
  localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),preferences:true,images:false,analytics:false}));localStorage.setItem('inv-theme',theme);
 },theme);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/assets/globe/news.html');await page.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&typeof MARKET!=='undefined');
 if(width===390){
  await page.locator('[data-v=news]').click();assert(await page.evaluate(()=>phoneView==='news'&&sheetState==='closed'&&!MARKET.on));
  await page.locator('[data-v=news]').click();assert(await page.evaluate(()=>sheetState!=='closed'));
  await page.locator('[data-panel-tab=latest]').click();await page.locator('#sheet-close').click();
  await page.locator('[data-v=news]').click();assert.equal(await page.evaluate(()=>panelTab),'latest');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>sheetState),'closed');
  const handle=await page.locator('#nav-grab').boundingBox();
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2,handle.y-80,{steps:6});await page.mouse.up();
  assert(await page.evaluate(()=>sheetState!=='closed'),'upward handle opens the sheet');
  const grab=await page.locator('#grab').boundingBox();
  await page.mouse.move(grab.x+grab.width/2,grab.y+8);await page.mouse.down();await page.mouse.move(grab.x+grab.width/2,820,{steps:12});await page.mouse.up();
  assert.equal(await page.evaluate(()=>sheetState),'closed','downward handle dismisses the sheet');
  await page.locator('[data-v=markets]').click();assert(await page.locator('#dock').isVisible());assert(await page.evaluate(()=>MARKET.on&&sheetState==='closed'));
  await page.locator('[data-v=markets]').click();assert(await page.evaluate(()=>sheetState!=='closed'));
  await page.locator('#sheet-close').click();await page.locator('[data-v=globe]').click();assert(await page.evaluate(()=>phoneView==='globe'&&!MARKET.on&&sheetState==='closed'));
  await page.locator('[data-v=news]').click();await page.locator('[data-v=news]').click();
 }else{
  await page.evaluate(()=>openStory(shown[0]));await page.keyboard.press('Escape');assert(await page.locator('#panel').isHidden());
  await page.evaluate(()=>{panel.hidden=false;layOpen(true);});await page.keyboard.press('Escape');assert(await page.locator('#panel').isVisible());assert(await page.locator('#lay-pop').isHidden());
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const surface=await page.locator('#panel').evaluate(e=>getComputedStyle(e).backgroundColor);
 assert.equal(surface,theme==='dark'?'rgba(18, 18, 22, 0.62)':'rgba(255, 255, 255, 0.9)');
 await page.evaluate(label=>{const e=document.createElement('div');e.textContent=label;e.style.cssText='position:fixed;z-index:999999;top:4px;left:50%;transform:translateX(-50%);background:#1d1d1f;color:white;border-radius:8px;padding:5px 9px;font:11px system-ui;white-space:nowrap';document.body.append(e);},`P11 Glass Panels · New · ${width}px · ${theme}`);
 await page.screenshot({path:`.github/review/p11-ui-port/new-${width}-${theme}.png`});
 assert.deepEqual(errors,[]);
 await page.goto(base+'/index.html');assert.equal(await page.locator('.hn-map-caption').count(),0);
 if(width===390)assert(await page.locator('.hn-mode-row').isHidden());else assert.equal((await page.locator('.hn-modes').boundingBox()).height,34);
 console.log(`${width}px ${theme}: navigation, dismissal, state, glass, homepage and overflow pass`);await context.close();
}}finally{await browser.close();}
