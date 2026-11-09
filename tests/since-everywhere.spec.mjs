// Since-the-news card on the article page (the homepage section is covered by confirmed.spec.mjs) (fixture price track; real articles).
import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',n,e.message.slice(0,400));}};
async function ctx(w,track){
  const c=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(c);
  await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
  await c.route('**/assets/globe/news-track.json',async r=>{
    if(track==='empty')return r.fulfill({json:{schema:1,s:{}}});
    const m=await (await r.request().frame()?.page().request.get(base+'/assets/globe/markets.json'))?.json().catch(()=>null)||{assets:[]};
    const now=Math.floor(Date.now()/60000),s={};
    for(const a of m.assets||[]){if(!(a.p>0))continue;const pts=[];for(let k=30*4;k>=0;k--){pts.push([now-k*15,a.p*(1+Math.sin(k/9)*0.004-k*0.0001)]);}s[a.s]=pts;}
    r.fulfill({json:{schema:1,s}});});
  return c;}
for(const w of [1440,390]){
  let c=await ctx(w,'full'),p=await c.newPage();await p.goto(base+'/index.html');
  try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}
  const id=await p.evaluate(async()=>{const [n,m]=await Promise.all([fetch('assets/globe/news-live.json').then(r=>r.json()),fetch('assets/globe/markets.json').then(r=>r.json())]);const by=new Set((m.assets||[]).map(a=>a.s));
    const pub=s=>Date.parse(s.published_at);const s=n.stories.find(s=>Date.now()-pub(s)<26*36e5&&Date.now()-pub(s)>4*36e5&&(s.impacts||[]).some(i=>i.ticker&&(by.has(i.ticker.toUpperCase())||by.has(i.ticker.toUpperCase()+'-USD'))));return s&&s.id;});
  await t(w+' E3 article page shows the card above the tabs',async()=>{
    assert.ok(id,'no recent article with a priced asset');
    const q=await c.newPage();await q.goto(base+'/story.html?id='+id);await q.waitForSelector('#sp-mi',{timeout:15000});await q.waitForTimeout(2000);
    assert.equal(await q.locator('#sp-mi .sn').count(),1);
    const card=await q.locator('#sp-mi .sn').boundingBox(),tabs=await q.locator('#sp-mi .mi-p.on').first().boundingBox();assert.ok(card.y+card.height<=tabs.y+2);
    const cb=await q.locator('#sp-mi .sn').boundingBox(),mk=await q.locator('#sp-mi .sn-mark').boundingBox();assert.ok(mk.x>=cb.x&&mk.x+mk.width<=cb.x+cb.width,'the label stays inside the card');
    assert.ok(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow');await q.close();});
  await c.close();
  await c.close();}
await b.close();console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
