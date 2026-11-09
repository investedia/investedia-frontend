import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',n,e.message.slice(0,400));}};
const c=await b.newContext({viewport:viewport(1440),serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});await fixtureExternal(c);
await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
const p=await c.newPage();await p.goto(base+'/index.html');
const ids=await p.evaluate(()=>fetch('assets/share/index.json').then(r=>r.json()));
const id=ids[0];
await t('X1 the share index lists up to 48 articles with an image and a preview page each',async()=>{assert.ok(ids.length>=1&&ids.length<=48);
  const png=await p.evaluate(async id=>{const r=await fetch('assets/share/'+id+'.png');const b=new Uint8Array(await r.arrayBuffer());return {ok:r.ok,w:(b[16]<<24)|(b[17]<<16)|(b[18]<<8)|b[19],h:(b[20]<<24)|(b[21]<<16)|(b[22]<<8)|b[23]};},id);
  assert.deepEqual(png,{ok:true,w:1200,h:630});
  const h=await p.evaluate(id=>fetch('assets/share/'+id+'.html').then(r=>r.text()),id);assert.match(h,/og:image/);assert.match(h,/summary_large_image/);});
await t('X2 the preview page sends people to the article',async()=>{await p.goto(base+'/assets/share/'+id+'.html');await p.waitForURL(/story\.html\?id=/,{waitUntil:'commit'});});
await t('X3 article page: Share copies the preview link when there is no share sheet',async()=>{
  await p.goto(base+'/story.html?id='+id);await p.waitForSelector('#sp-share');await p.locator('#sp-share').click();await p.waitForFunction(()=>document.getElementById('sp-share').textContent==='Link copied');
  assert.equal(await p.locator('#sp-share').innerText(),'Link copied');
  assert.match(await p.evaluate(()=>navigator.clipboard.readText()),new RegExp('/assets/share/'+id+'\\.html$'));});
await t('X5 globe panel: the article has a Share link that copies the preview link',async()=>{
  await p.goto(base+'/assets/globe/news.html?story='+id);await p.waitForSelector('.share-link',{timeout:15000});await p.locator('.share-link').first().click();await p.waitForFunction(()=>/Link copied/.test(document.querySelector('.share-link').textContent),null,{timeout:5000});
  assert.match(await p.evaluate(()=>navigator.clipboard.readText()),new RegExp('/assets/share/'+id+'\\.html$'));});
await t('X6 an article without a card shares the plain article address',async()=>{
  const r=await p.evaluate(()=>ShareLink.urlFor('nnotthere'));assert.match(r,/\/story\.html\?id=nnotthere$/);});
await t('X4 article page: with a share sheet it is called with the preview link',async()=>{
  await p.addInitScript(()=>{window.__s=null;navigator.share=async d=>{window.__s=d;};});await p.goto(base+'/story.html?id='+id);await p.waitForSelector('#sp-share');
  await p.evaluate(()=>{window.__s=null;navigator.share=async d=>{window.__s=d;};});await p.locator('#sp-share').click();await p.waitForTimeout(300);
  const d=await p.evaluate(()=>window.__s);assert.ok(d&&/assets\/share\/.+\.html$/.test(d.url)&&d.title);});
await b.close();console.log(fail?fail+' failed':'6/6 passed');process.exit(fail?1:0);
