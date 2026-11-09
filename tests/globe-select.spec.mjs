// The globe must never select text or paint the page orange (::selection is the brand orange). Chromium here; Safari needs the -webkit- prefix, which is set too.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base,fixtureExternal} from './browser-support.mjs';
const b=await launch(), results=[];
const check=async(id,fn)=>{try{await fn();results.push({id,pass:true});}catch(e){results.push({id,pass:false,error:e.message.split('\n')[0]});}};
const ctx=await b.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(ctx);
await ctx.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
const p=await ctx.newPage();
const sel=async()=>p.evaluate(()=>{const own=getSelection().toString();const fr=[...document.querySelectorAll('iframe')].map(f=>{try{return f.contentWindow.getSelection().toString()}catch{return ''}}).join('');return {own,fr,ranges:!!(getSelection().rangeCount&&!getSelection().isCollapsed)};});
for(const [name,url,frame] of [['home hero','/index.html','#hnGlobe'],['globe page','/globe.html','#globe-frame']]){
 await p.goto(base+url);try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}await p.waitForTimeout(2500);
 const box=await p.locator(frame).boundingBox();const cx=box.x+box.width*.12,cy=Math.min(box.y+box.height*.55,700);
 await check(`S1 ${name}: double-click, triple-click and a drag across the globe select nothing`,async()=>{
  await p.mouse.dblclick(cx,cy);assert.deepEqual(await sel().then(s=>[s.own,s.fr]),['','']);
  await p.mouse.click(cx,cy,{clickCount:3});assert.deepEqual(await sel().then(s=>[s.own,s.fr]),['','']);
  await p.mouse.move(box.x+30,Math.min(box.y+80,850));await p.mouse.down();await p.mouse.move(cx,cy,{steps:8});await p.mouse.move(cx+200,Math.min(cy+80,880),{steps:8});await p.mouse.up();
  const s=await sel();assert.equal(s.own,'',JSON.stringify(s));assert.equal(s.fr,'',JSON.stringify(s));assert.equal(s.ranges,false,JSON.stringify(s));});
 await check(`S2 ${name}: the globe container and the document inside it have user-select none`,async()=>{
  const r=await p.evaluate(f=>{const fe=document.querySelector(f),d=fe.contentDocument,g=e=>getComputedStyle(e);return {outer:g(fe.parentElement).userSelect,iframe:g(fe).userSelect,body:g(d.body).userSelect,cv:g(d.getElementById('cv')).userSelect};},frame);
  assert.deepEqual(r,{outer:'none',iframe:'none',body:'none',cv:'none'},JSON.stringify(r));});
}
await check('S3 article text in the globe panel can still be selected and copied; search input too',async()=>{
 await p.goto(base+'/assets/globe/news.html');try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}await p.waitForFunction(()=>typeof stories!=='undefined'&&stories.length>0);await p.waitForTimeout(800);
 const r=await p.evaluate(()=>({pbody:getComputedStyle($('pbody')).userSelect,q:getComputedStyle($('q')).userSelect,cv:getComputedStyle($('cv')).userSelect,body:getComputedStyle(document.body).userSelect}));
 assert.deepEqual(r,{pbody:'text',q:'text',cv:'none',body:'none'},JSON.stringify(r));});
await check('S4 double-click on the open globe page selects nothing and the canvas ignores selectstart',async()=>{
 await p.mouse.dblclick(540,520);assert.equal(await p.evaluate(()=>getSelection().toString()),'');
 assert.equal(await p.evaluate(()=>{const e=new Event('selectstart',{cancelable:true});$('cv').dispatchEvent(e);return e.defaultPrevented;}),true);});
await b.close();
fs.writeFileSync('tests/globe-select-results.json',JSON.stringify(results,null,1));
for(const r of results)if(!r.pass)console.log('FAIL',r.id,r.error);
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
process.exit(results.some(r=>!r.pass)?1:0);
