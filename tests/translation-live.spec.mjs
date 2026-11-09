// Opt-in live-provider smoke test. Requires network access to Google Translate.
// Run with the same PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE and TEST_BASE_URL as other browser tests.
// There are deliberately no translation fixtures: a passing result must contain provider-translated text.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,widths,viewport} from './browser-support.mjs';
const browser=await launch();
try {
 for(const width of widths){
  const context=await browser.newContext({viewport:viewport(width),isMobile:width===390,hasTouch:width===390,serviceWorkers:'block',reducedMotion:'reduce'});
  try {
   await context.addInitScript(()=>{for(const key of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(key,'1');});
   const page=await context.newPage();page.setDefaultTimeout(10000);
   await page.goto(base+'/about.html',{waitUntil:'domcontentloaded'});
   await page.locator('[data-consent=essential]').click();
   const originalURL=page.url(),heading=page.locator('#main-content h1').first(),english=await heading.innerText();
   assert(english.trim(),'The original page must have a heading to translate.');
   const translated=page.waitForFunction(original=>{
    const text=document.querySelector('#main-content h1')?.innerText?.trim();
    return document.documentElement.classList.contains('translated-ltr')&&text&&text!==original.trim()?text:false;
   },english,{timeout:45000});
   // Attach error handling immediately while the native widget is loading.
   const result=translated.then(handle=>({handle}),error=>({error}));
   await page.locator('.ftr-lang .csel-btn')[width===390?'tap':'click']();
   await page.getByRole('option',{name:'Français',exact:true})[width===390?'tap':'click']();
   const outcome=await result;
   if(outcome.error){
    const status=await page.locator('.ftr-translate-status').innerText();
    throw new Error(`${width}: Live translation NOT VERIFIED. ${status||outcome.error.message}`);
   }
   assert.equal(page.url(),originalURL,'Translation must keep the visitor on Investedia.');
   assert.equal(await page.locator('.brand b').first().innerText(),'Investedia','Keep the brand name unchanged.');
   console.log(`${width}: actual translated heading: ${await outcome.handle.jsonValue()}`);
   if(process.env.TEST_SCREENSHOT_DIR){
    fs.mkdirSync(process.env.TEST_SCREENSHOT_DIR,{recursive:true});
    await heading.scrollIntoViewIfNeeded();
    await page.evaluate(w=>{const label=document.createElement('div');label.className='notranslate';label.textContent=`New · ${w===390?'Phone':'PC'} · Live French translation`;Object.assign(label.style,{position:'fixed',top:'48px',left:'8px',padding:'10px 12px',background:'#ff7a1a',color:'#111',font:'bold 13px sans-serif',zIndex:999999});document.body.append(label);},width);
    await page.screenshot({path:`${process.env.TEST_SCREENSHOT_DIR}/french-${width}.png`});
   }
   await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('.ftr-original').click()]);
   assert.equal(await page.locator('#main-content h1').first().innerText(),english);
   console.log(`${width}: live translation and English restoration PASS`);
  } finally {await context.close();}
 }
} finally {await browser.close();}
