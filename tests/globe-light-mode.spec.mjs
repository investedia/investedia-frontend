import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {launch,base,fixtureExternal} from './browser-support.mjs';
const browser=await launch();
const original=execFileSync('git',['show','origin/main:assets/globe/news.html'],{encoding:'utf8'});
const results=[];
const seed=(context,theme)=>context.addInitScript(theme=>{
 localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),preferences:true,images:false,analytics:false}));
 localStorage.setItem('inv-theme',theme);
},theme);
const ready=page=>page.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0&&typeof GB!=='undefined'&&typeof skyCv!=='undefined'&&skyCv);
const state=page=>page.evaluate(()=>({day:DAY,palette:{...GB},fg:getComputedStyle(document.documentElement).getPropertyValue('--fg').trim(),
 panel:getComputedStyle(document.querySelector('.panel')).backgroundColor,
 chip:getComputedStyle(document.querySelector('.chip[aria-pressed=true]')).backgroundColor,
 overflow:document.documentElement.scrollWidth>innerWidth}));
try{
 for(const width of [1440,390]){
  const old=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce',serviceWorkers:'block'});
  await seed(old,'dark');await fixtureExternal(old);
  await old.route('**/assets/globe/news.html',route=>route.fulfill({contentType:'text/html',body:original}));
  const previous=await old.newPage();await previous.goto(base+'/assets/globe/news.html');await ready(previous);
  const night=await state(previous);await old.close();
  for(const theme of ['dark','light']){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce',serviceWorkers:'block'});
   await seed(context,theme);await fixtureExternal(context);
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/assets/globe/news.html');await ready(page);
   assert.equal((await state(page)).overflow,false);
   if(theme==='light'){
    assert.equal(await page.evaluate(()=>DAY&&GB.s0===GB_DAY.s0&&GB.rgb===GB_DAY.rgb),true);
    assert.equal((await state(page)).fg,'#1d1d1f');
    assert.equal((await state(page)).chip,'rgb(29, 29, 31)');
    const contrast=await page.evaluate(()=>{
     const linear=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;};
     const luminance=hex=>[1,3,5].map(i=>linear(parseInt(hex.slice(i,i+2),16))).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
     const css=getComputedStyle(document.documentElement);
     return ['--fg-2','--fg-3'].map(key=>(luminance('#c4d6ee')+.05)/(luminance(css.getPropertyValue(key).trim())+.05));
    });
    assert(contrast.every(value=>value>=4.5),'secondary text contrast against the darkest sky');
    const navy=await page.evaluate(()=>new Promise(resolve=>{
     const prototype=CanvasRenderingContext2D.prototype,fill=prototype.fill,stroke=prototype.stroke;let navy=false,ring=false;
     prototype.fill=function(...args){navy ||= this.fillStyle==='rgba(36, 58, 100, 0.92)';return fill.apply(this,args);};
     prototype.stroke=function(...args){ring ||= this.strokeStyle==='rgba(255, 255, 255, 0.95)';return stroke.apply(this,args);};
     requestAnimationFrame(()=>requestAnimationFrame(()=>{prototype.fill=fill;prototype.stroke=stroke;resolve(navy&&ring);}));
    }));
    assert(navy,'actual count bubbles draw navy fill with a white ring');
    assert.equal(await page.evaluate(()=>{
     const cv=document.createElement('canvas');cv.width=2;cv.height=2;
     const saved=ctx;ctx=cv.getContext('2d');drawStars(0);const empty=ctx.getImageData(0,0,2,2).data.every(v=>v===0);ctx=saved;return empty;
    }),true,'no stars in light mode');
   }else{
    const current=await state(page);
    for(const key of ['palette','panel','chip','fg'])assert.deepEqual(current[key],night[key],`dark ${key} unchanged`);
   }
   // Same-tab theme attribute, homepage message, and another-tab preference changes.
   await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.waitForFunction(()=>DAY);
   await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.waitForFunction(()=>!DAY);
   assert.deepEqual((await state(page)).palette,night.palette,'dark palette restores exactly after toggling');
   await page.evaluate(()=>postMessage({type:'inv-theme',theme:'light'},location.origin));await page.waitForFunction(()=>DAY);
   const other=await context.newPage();await other.goto(base+'/404.html');
   await other.evaluate(()=>localStorage.setItem('inv-theme','light'));await page.waitForFunction(()=>DAY);
   await other.evaluate(()=>localStorage.setItem('inv-theme','dark'));await page.waitForFunction(()=>!DAY);
   await other.evaluate(theme=>localStorage.setItem('inv-theme',theme),theme);await page.waitForFunction(theme=>DAY===(theme==='light'),theme);await other.close();
   await page.waitForTimeout(300);
   const label=`C Blue Globe · 3 Navy · New · ${width===390?'Phone 390':'PC 1440'} · ${theme}`;
   await page.evaluate(text=>{const badge=document.createElement('div');badge.textContent=text;badge.style.cssText='position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:999999;background:#1d1d1f;color:white;padding:5px 10px;border-radius:8px;font:11px system-ui;white-space:nowrap;pointer-events:none';document.body.append(badge);},label);
   await page.screenshot({path:`.github/review/globe-light-mode/c-${theme}-${width===390?'phone':'pc'}.png`});
   assert.deepEqual(errors,[],'no runtime exceptions');
   results.push(`${width}px ${theme}: palette, theme toggles, storage/message sync, overflow and dark parity passed`);
   await context.close();
  }
 }
 console.log(results.join('\n'));
}finally{await browser.close();}
