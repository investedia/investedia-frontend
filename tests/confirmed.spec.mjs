// Homepage "Articles the market confirmed" and the Recent market implications page (fixture price track; real articles).
import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
import assert from 'node:assert/strict';
const b=await launch();let fail=0;
const t=async(n,f)=>{try{await f();}catch(e){fail++;console.log('FAIL',n,e.message.slice(0,400));}};
async function ctx(w,track){
  const c=await b.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block'});await fixtureExternal(c);
  await c.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
  await c.route('**/assets/globe/news-track.json',async r=>{
    if(track==='empty')return r.fulfill({json:{schema:1,s:{}}});
    const m=await (await c.request.get(base+'/assets/globe/markets.json')).json(),n=await (await c.request.get(base+'/assets/globe/news-live.json')).json();const now=Math.floor(Date.now()/60000),s={};
    const by={};for(const a of m.assets||[])by[a.s.toUpperCase()]=a;const dir={};let k=0;   // deterministic: the first priced asset follows its article, the next goes against it, and so on
    for(const st of n.stories||[]){if(Date.now()-Date.parse(st.published_at)>60*36e5)continue;for(const i of st.impacts||[]){if(i.direction!=='up'&&i.direction!=='down')continue;const t=String(i.ticker||'').toUpperCase(),a=by[t]||by[t+'-USD']||by[t.replace(/=X$/,'')];if(!a||dir[a.s]!==undefined)continue;const want=i.direction==='up'?1:-1;dir[a.s]=(k++%2===0)?want:-want;}}
    for(const a of m.assets||[]){if(!(a.p>0))continue;const d=dir[a.s]??1;const pts=[];for(let q=120;q>=0;q--)pts.push([now-q*15,a.p*(1+d*0.03*(1-q/120))]);s[a.s]=pts;}
    r.fulfill({json:{schema:1,s}});});
  await c.route('**/assets/globe/news-ledger.json',r=>r.fulfill({json:{schema:1,calls:[]}}));
  return c;}
const accept=async p=>{try{await p.getByRole('button',{name:'Accept essential',exact:true}).click({timeout:2500});}catch{}};
for(const w of [1440,390]){
  let c=await ctx(w,'full'),p=await c.newPage();await p.goto(base+'/index.html');await accept(p);await p.waitForSelector('.hn-wf',{timeout:15000});await p.waitForTimeout(1500);
  await t(w+' F1 the homepage section is titled for confirmed articles and features only confirmed calls',async()=>{
    assert.match(await p.locator('#hnWhy').locator('xpath=ancestor::section').locator('h2').innerText(),/confirmed/i);
    assert.ok(await p.locator('.hn-wf .hn-conf').count()===1);
    const ok=await p.evaluate(()=>{const els=[...document.querySelectorAll('#hnWhy .hn-wf, #hnWhy .hn-wc')];return els.length;});assert.ok(ok>=1&&ok<=3);
    assert.equal(await p.locator('#hnWhy .hn-conf').count(),ok);});
  await t(w+' F2 the featured card shows the since-the-news chart with its result and the button opens the page',async()=>{
    assert.ok(await p.locator('.hn-wf .sn svg').count()===1);
    const a=p.locator('.hn-wmore .hn-btn');assert.equal(await a.getAttribute('href'),'implications.html');assert.ok((await a.boundingBox()).height>=44);
    assert.match(await p.locator('.hn-wmore .hn-meta').innerText(),/misses included/);});
  await t(w+' F3 no horizontal overflow on the homepage',async()=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
  await p.close();
  p=await c.newPage();await p.goto(base+'/implications.html');await accept(p);await p.waitForSelector('#im .im-tabs',{timeout:15000});await p.waitForTimeout(600);
  await t(w+' I1 the page lists every call with counts that add up, hits and misses alike',async()=>{
    const rows=await p.locator('.im-row').count();assert.ok(rows>=2,'rows '+rows);
    const by=r=>p.locator(`.im-row[data-res=${r}]`).count();const [h,m,f,pd]=await Promise.all(['hit','miss','flat','pending'].map(by));assert.equal(h+m+f+pd,rows);
    assert.ok(h>=1&&m>=1,`need both outcomes in the fixture: ${h} hits ${m} misses`);
    assert.match(await p.locator('.im-sum').innerText(),new RegExp(h+' confirmed'));});
  await t(w+' I2 a hit moved the implied way and a miss moved against it',async()=>{
    for(const [res,same] of [['hit',true],['miss',false]]){const r=p.locator(`.im-row[data-res=${res}]`).first();
      const dir=await r.locator('.tr-dir').getAttribute('aria-label');const mv=parseFloat((await r.locator('.tr-mv').innerText()).replace('%',''));
      assert.equal((mv>0)===/up/.test(dir),same,res+' '+dir+' '+mv);}});
  await t(w+' I3 filters show only that group, tabs are 44px, and the News tab is current',async()=>{
    await p.getByRole('tab',{name:/Confirmed/}).click();assert.ok(await p.locator('.im-row').count()>=1);assert.equal(await p.locator('.im-row:not([data-res=hit])').count(),0);
    assert.ok((await p.getByRole('tab',{name:/Confirmed/}).boundingBox()).height>=44);
    await p.getByRole('tab',{name:/Other way/}).click();assert.equal(await p.locator('.im-row:not([data-res=miss])').count(),0);
    assert.equal(await p.locator('#news-nav [aria-current=page]').innerText(),'Market implications');});
  await t(w+' I4 no horizontal overflow on the page',async()=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
  await c.close();
  c=await ctx(w,'empty');p=await c.newPage();await p.goto(base+'/index.html');await accept(p);await p.waitForSelector('#hnWhyMore .hn-btn',{timeout:15000});await p.waitForTimeout(800);
  await t(w+' F4 with no recorded prices nothing is called confirmed and the button is still there',async()=>{assert.equal(await p.locator('#hnWhy .hn-conf').count(),0);assert.match(await p.locator('#hnWhy').innerText(),/No recent article has been borne out/);assert.ok(await p.locator('.hn-wmore .hn-btn').isVisible());});
  await p.close();p=await c.newPage();await p.goto(base+'/implications.html');await accept(p);await p.waitForSelector('#im .im-tabs');
  await t(w+' I5 with no recorded prices every call is pending, none confirmed',async()=>{assert.equal(await p.locator('.im-row:not([data-res=pending])').count(),0);});
  await c.close();}
await b.close();console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
