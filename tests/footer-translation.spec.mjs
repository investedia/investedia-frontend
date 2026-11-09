import assert from 'node:assert/strict';
import {launch,base,widths,viewport} from './browser-support.mjs';

// Contract fixture only: exercises the Google widget API, not Google's real translation quality or uptime.
const widgetFixture=`window.google={translate:{TranslateElement:function(options,id){
 window.widgetOptions=options;
 const host=document.getElementById(id),select=document.createElement('select');select.className='goog-te-combo';
 for(const [code,label]of Object.entries({'':'Select Language',fr:'Français',nl:'Nederlands',de:'Deutsch',es:'Español',it:'Italiano',pt:'Português'}))select.add(new Option(label,code));
 select.addEventListener('change',()=>{window.requestedTranslation=select.value;document.cookie='googtrans=/en/'+select.value+';path=/';});
 host.append(select,document.createTextNode('Powered by Google Translate (test fixture)'));
}}};window[new URL(document.currentScript.src).searchParams.get('cb')]();`;
const browser=await launch();
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:viewport(width),isMobile:width===390,hasTouch:width===390,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>{for(const key of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(key,'1');});
  let providerMode='success',requests=0,navigations=[];
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin===new URL(base).origin)return route.continue();
   if(route.request().isNavigationRequest())navigations.push(u.href);
   if(u.hostname==='translate.google.com'&&u.pathname==='/translate_a/element.js'){
    requests++;
    return providerMode==='success'?route.fulfill({contentType:'text/javascript',body:widgetFixture}):providerMode==='timeout'?route.fulfill({contentType:'text/javascript',body:'/* no callback */'}):route.abort();
   }
   return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(8000);
  async function open(){await page.goto(base+'/about.html?source=footer#team',{waitUntil:'domcontentloaded'});if(await page.locator('#inv-consent-panel:visible').count())await page.locator('[data-consent=essential]').click();}
  async function choose(label){const trigger=page.locator('.ftr-lang .csel-btn');await trigger[width===390?'tap':'click']();await page.getByRole('option',{name:label,exact:true})[width===390?'tap':'click']();}
  // A1: no external translator loads until a language is requested, even after accepting all services.
  await open();assert.equal(requests,0);await page.evaluate(()=>InvConsent.open());await page.locator('[data-consent=accept]').click();assert.equal(requests,0);
  // A2: requesting French loads the in-page provider and hands off the language, without navigation.
  const original=page.url();await choose('Français');await page.waitForFunction(()=>window.requestedTranslation==='fr');
  assert.equal(page.url(),original);assert.deepEqual(navigations,[]);assert(await page.locator('#inv-google-translate').isVisible());assert(await page.locator('.ftr-lang').isHidden());assert(await page.locator('.ftr-original').isVisible());assert.equal(await page.evaluate(()=>widgetOptions.pageLanguage),'en');
  // A3: the provider's requested-language cookie resumes on the next page; English clears it and reloads the same URL.
  await open();await page.waitForFunction(()=>window.requestedTranslation==='fr');assert.equal(page.url(),original);
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('.ftr-original').click()]);await page.waitForFunction(()=>!document.cookie.includes('googtrans='));assert.equal(page.url(),original);assert(await page.locator('.ftr-lang').isVisible());
  // A4: blocked provider leaves the page and language control usable, then a later retry succeeds.
  providerMode='error';await choose('Deutsch');await page.getByRole('status').filter({hasText:'could not load'}).waitFor();assert.equal(page.url(),original);assert.equal(await page.locator('.ftr-lang select').inputValue(),'en');assert.equal(await page.locator('.ftr-lang select').isDisabled(),false);assert(await page.locator('#main-content').isVisible());
  providerMode='success';await choose('Español');await page.waitForFunction(()=>window.requestedTranslation==='es');assert.equal(page.url(),original);await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('.ftr-original').click()]);await page.waitForFunction(()=>!document.cookie.includes('googtrans='));
  // A5: a silent/non-initializing provider times out rather than trapping the control in a disabled state.
  providerMode='timeout';await page.clock.install();await choose('Italiano');await page.clock.fastForward(16000);await page.getByRole('status').filter({hasText:'could not load'}).waitFor();assert.equal(await page.locator('.ftr-lang select').isDisabled(),false);assert.equal(page.url(),original);assert.deepEqual(navigations,[]);
  console.log(width+': A1–A5 PASS (in-page widget contract; live provider unverified)');await context.close();
 }
}finally{await browser.close();}
