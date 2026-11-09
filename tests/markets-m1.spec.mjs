import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launch,base,viewport,fixtureExternal} from './browser-support.mjs';
const out=process.env.M1_EVIDENCE_DIR||'/tmp/markets-m1-evidence';fs.mkdirSync(out,{recursive:true});
const root=new URL('..',import.meta.url).pathname;
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const news=read('assets/globe/news-48h.json'),focus=read('assets/globe/market-focus.json'),exchanges=read('data/exchanges.json'),registry=read('data/registry.json'),links=read('assets/globe/connections.json').connections;
const fixture=read('tests/fixtures/markets-m1-news.json');
const results=[],measurements={},b=await launch();
const check=async(id,w,fn)=>{try{await fn();results.push({id,width:w,pass:true});console.log('PASS',w,id);}catch(e){results.push({id,width:w,pass:false,error:e.message});console.log('FAIL',w,id,e.message.slice(0,500));}};
const pause=p=>p.waitForTimeout(120);
for(const w of [390,1440]){
 const errors=[],requests=[],c=await b.newContext({viewport:viewport(w),reducedMotion:'reduce',serviceWorkers:'block',isMobile:w===390,hasTouch:w===390});await fixtureExternal(c);
 await c.addInitScript(at=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[at]));}static now(){return at;}};const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText,rect=proto.strokeRect;window.__canvasText=[];window.__squares=[];proto.fillText=function(text,...args){window.__canvasText.push(String(text));if(window.__canvasText.length>500)window.__canvasText.shift();return fill.call(this,text,...args);};proto.strokeRect=function(...args){window.__squares.push(args);if(window.__squares.length>500)window.__squares.shift();return rect.apply(this,args);};window.__marketPaintColours=[];for(const method of ['stroke','fill']){const original=proto[method];proto[method]=function(...args){const colour=method==='stroke'?this.strokeStyle:this.fillStyle;if(typeof colour==='string'){window.__marketPaintColours.push(colour);if(window.__marketPaintColours.length>2000)window.__marketPaintColours.shift();}return original.apply(this,args);};}},Date.parse(news.updated_at));
 c.on('request',r=>requests.push(r.url()));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base+'/markets-preview.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.InvMarketPreview?.state().ready);
 const f=p.frames().find(f=>f.url().includes('/market-preview.html'));assert(f,'globe iframe');await f.waitForFunction(()=>window.InvMarketGlobe?.state().ready);await pause(p);
 const state=()=>f.evaluate(()=>InvMarketGlobe.state());
 const open=async(code,tab='overview',venue=null)=>{await p.evaluate(([code,tab,venue])=>InvMarketPreview.open(code,tab,venue),[code,tab,venue]);await pause(p);};
 const close=async()=>{await p.evaluate(()=>InvMarketPreview.close());await pause(p);};
 await check('A1 square markers and collision-checked contextual labels',w,async()=>{
  const s=await state();assert(s.markers.length>10);assert(s.labels.length>0);assert(s.labels.length<=(w===390?5:9));
  for(let i=0;i<s.labels.length;i++)for(let j=i+1;j<s.labels.length;j++){const a=s.labels[i],b=s.labels[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'label overlap');}
  assert(await f.evaluate(()=>__squares.some(a=>a[2]===6&&a[3]===6)));
  for(const l of s.labels)assert(focus.countries[l.country].labels.length);
  measurements[w]={labels:s.labels.length,markers:s.markers.length,dataBytes:fs.statSync(path.join(root,'assets/globe/market-focus.json')).size};
  const swiss=s.markers.find(m=>m.id==='XSWX');assert(swiss);await f.locator('#cv').click({position:{x:swiss.x,y:swiss.y}});await p.waitForFunction(()=>InvMarketPreview.state().code==='CH'&&InvMarketPreview.state().venue==='XSWX');await close();
 });
 await check('A2 every Markets state passes exact text and direction-colour scans',w,async()=>{
  const approvedPhrases=[
   'Price not shown · no licensed feed',
   'Why no price?',
   'Price performance is not shown: no licensed price feed. Appearing here is based on news, not on returns.'
  ];
  // Explicit publisher quotations, not a general exemption for all headlines.
  const reportedHeadlineAllowlist=[
   'Nigeria International LNG Supply Rises 30% on Higher Feedgas',
   'Nigeria Targets 95% Digital Literacy by 2030',
   'AXA Mansard Reports 81% Rise in Profit to N10.9 Billion',
   'Traders Price in 77% Odds of December Fed Rate Hike Following Jobs Report'
  ];
  const directionColours=new Set(['52,211,153','248,113,113','74,222,128','34,197,94','239,68,68','220,38,38','0,128,0','255,0,0']);
  const rgb=value=>{const hex=value.match(/^#([0-9a-f]{6})$/i);if(hex)return [0,2,4].map(i=>parseInt(hex[1].slice(i,i+2),16)).join(',');const m=value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);return m?m.slice(1,4).join(','):'';};
  const visibleColours=()=>[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').flatMap(e=>{const s=getComputedStyle(e);return [s.color,s.backgroundColor,s.borderTopColor,s.borderRightColor,s.borderBottomColor,s.borderLeftColor,s.fill,s.stroke];});
  let scanned=0;
  const scan=async label=>{
   const raw=[await p.locator('body').innerText(),await p.locator('.mf-headline').textContent(),await f.locator('body').innerText(),(await state()).labels.map(l=>l.text).join(' ')].join(' ').replace(/\s+/g,' ');
   let remaining=raw;
   for(const phrase of [...approvedPhrases,...reportedHeadlineAllowlist])remaining=remaining.split(phrase).join(' ');
   assert(!/[%↑↓]|\bprice\w*|\breturn\w*/i.test(remaining),`${label}: prohibited text ${remaining.match(/.{0,45}(?:[%↑↓]|\bprice\w*|\breturn\w*).{0,65}/i)?.[0]}`);
   const colours=[...await p.evaluate(visibleColours),...await f.evaluate(visibleColours),...await f.evaluate(()=>window.__marketPaintColours||[])];
   for(const colour of colours)assert(!directionColours.has(rgb(colour)),`${label}: up/down colour ${colour}`);
   scanned++;
  };
  await p.locator('[data-globe-mode="news"]').click();await pause(p);
  await f.evaluate(()=>{sel=stories.find(s=>s.impacts?.some(i=>['up','down'].includes(i.direction)))||stories[0];arcHover={article:sel};});
  await p.locator('[data-globe-mode="markets"]').click();await pause(p);assert(await f.evaluate(()=>sel===null&&arcHover===null));await f.evaluate(()=>{window.__marketPaintColours=[];});
  await close();await scan('default and headline');
  for(const [code,view,venue]of [['NG','overview'],['NG','focus'],['NG','structured'],['NG','investments'],['NG','investments-all'],['TZ','investments'],['NG','centre','XNSA'],['TZ','overview'],['MY','overview']]){await open(code,view,venue||null);await scan(code+' '+view);}
  await open('NG','connections');await scan('connection list');const id=focus.countries.NG.connections[0];assert(id);await p.evaluate(id=>InvMarketPreview.connection(id),id);await pause(p);await scan('selected connection');
  assert.equal(await p.locator('#mf-panel canvas,#mf-panel svg.sparkline,.market-kpis,.market-up,.market-down').count(),0);
  assert.deepEqual(await f.evaluate(()=>__canvasText.filter(t=>/^\d+$/.test(t))),[]);
  assert(!requests.some(u=>/\/(?:markets\.json|market-links\.json|news-prices\.json|intraday\.json|registry\.json|quotes\.js)|yahoo|workers\.dev/i.test(u)),'forbidden data requested');
  assert.deepEqual(await p.evaluate(()=>InvMarketPreview.flags),{MARKET_LINKS_ENABLED:false,RISING_ATTENTION_ENABLED:false});measurements[w].a2StatesScanned=scanned;await close();
 });
 await check('A3 static exact reported headline, category, country, source and age',w,async()=>{
  const el=p.locator('.mf-headline'),id=await el.getAttribute('data-article'),article=news.stories.find(a=>a.id===id);assert(article);assert((await el.innerText()).includes(article.headline));assert((await el.innerText()).includes(article.source.name));assert.equal(await el.getAttribute('href'),article.source.url);assert((await el.innerText()).includes(article.location.country));assert(news.stories.every(a=>(a.importance||1)<=(article.importance||1)));assert(news.stories.filter(a=>a.importance===article.importance).every(a=>Date.parse(a.published_at)<=Date.parse(article.published_at)));
  for(const a of await p.locator('#hnPop [data-market-suggestion]').all()){const iso=await a.getAttribute('data-market-suggestion');assert.equal(await a.innerText(),focus.countries[iso].name);}assert.equal(await p.locator('#hnPop a[href*="asset.html"],.mf-header a[href="markets.html"]').count(),0);
  const initial=await el.innerHTML();await p.waitForTimeout(1100);assert.equal(await el.innerHTML(),initial);assert(await el.locator('.mf-chip').count());
 });
 await check('A4 sourced country overview facts for NG MY TZ',w,async()=>{
  for(const code of ['NG','MY','TZ']){await open(code);const c=focus.countries[code],e=exchanges[c.exchange],text=await p.locator('#mf-panel').innerText();assert(text.includes(c.name));assert.equal(await p.locator('.mf-fact').count(),3);const tiles=await Promise.all((await p.locator('.mf-fact').all()).map(e=>e.boundingBox()));if(w===1440)assert(tiles.every(r=>r.y===tiles[0].y),'desktop facts share one row');if(code==='TZ')assert(text.includes('Shilling (TZS)'));assert(text.includes(e?e.name:'Not in our exchange list yet'));assert(text.includes(e?.benchmark_name||'No benchmark in our data yet'));assert(text.includes(e?.currency||'Not in our exchange list yet'));assert(text.includes('Price not shown · no licensed feed'));assert(text.includes('Full '+c.name+' profile'));if(code==='MY')assert(!text.includes('Bursa Malaysia (Bursa Malaysia)'));}await close();
 });
 await check('A5 editorial and structured options retain source links and ages',w,async()=>{
  await open('NG','focus');let text=await p.locator('#mf-panel').innerText();for(const label of ['Market Overview','Most significant','Also developing','Sectors in focus','28-day baseline','our analysis, not a forecast'])assert(text.toLowerCase().includes(label.toLowerCase()),label);
  for(const card of await p.locator('.mf-article').all()){assert(await card.locator('.mf-source a[href^="http"]').count());assert(await card.locator('time[datetime]').count());}
  await p.getByRole('tab',{name:'All developments',exact:true}).click();await pause(p);assert(await p.getByRole('tab',{name:'All developments',exact:true}).evaluate(e=>e===document.activeElement));assert(await p.locator('[data-group]').count());for(const group of await p.locator('[data-group]').all())assert((await group.locator('.mf-article').count())<=2);
  const ng=focus.countries.NG.developments[0];assert(/Central Bank of Nigeria/.test(ng.headline),'CBN significant ranking');assert(!/Africa \$211B/.test(ng.headline));await close();
 });
 await check('A6 research names and verified listings have source evidence',w,async()=>{
  await open('NG','investments');const c=focus.countries.NG,shown=c.investments.slice(0,w===390?3:5),cards=await p.locator('.mf-investment').all();assert.equal(cards.length,shown.length);assert(cards.length>0);
  for(let index=0;index<shown.length;index++){const i=shown[index],text=await cards[index].innerText();assert(news.stories.some(a=>i.article_ids.includes(a.id)&&a.impacts.some(impact=>impact.name===i.name&&['company','etf'].includes(impact.kind))));const evidence=news.stories.find(a=>a.id===i.evidence_article_id),impact=evidence.impacts.find(impact=>impact.name===i.name&&['company','etf'].includes(impact.kind));assert(text.includes(evidence.headline));assert(text.includes((impact.why||'').replace(/81% surge in profit/g,'81 per cent surge in profit')));if(i.registry_id)assert(registry.assets[i.registry_id]);else{assert(text.includes('Listing not verified'));assert.equal(i.ticker,null);assert.equal(i.mic,null);}}
  assert((await p.locator('#mf-panel').innerText()).includes('Not recommendations'));await close();
 });
 await check('A7 desktop panel replaces copy; close and Escape restore exact geometry',w,async()=>{
  const initial=await state(),box=await p.locator('#hnGlobe').boundingBox();await open('NG');const current=await state();assert.deepEqual(current.camera,initial.camera);if(w===1440){assert.equal(await p.locator('.hn-copy').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.deepEqual(await p.locator('#hnGlobe').boundingBox(),box);}await p.locator('#mf-panel .mf-close').click();await pause(p);assert(await p.locator('#mf-panel').isHidden());assert.equal(await p.locator('.hn-copy').evaluate(e=>getComputedStyle(e).visibility),'visible');await open('NG');await p.keyboard.press('Escape');assert(await p.locator('#mf-panel').isHidden());assert.deepEqual((await state()).camera,initial.camera);await p.evaluate(()=>{for(let i=0;i<5;i++){InvMarketPreview.open('NG');InvMarketPreview.close();}});await pause(p);assert(await p.locator('#mf-panel').isHidden());
 });
 await check('A8 responsive sheet leaves globe visible and page locked',w,async()=>{
  await open('NG','focus');const box=await p.locator('#mf-panel').boundingBox(),s=await state(),fr=await p.locator('#hnGlobe').boundingBox();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(w===390){assert(box.height<=844*.58+1);assert.equal(box.x,8);assert.equal(w-box.x-box.width,8);const globeTop=fr.y+s.camera.cy-s.camera.R;assert(globeTop<box.y-150,'globe must be visible above sheet');assert.equal(await p.locator('.hn-tick').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await p.locator('.hn-mode-row').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).overflow),'hidden');measurements[w].sheetHeight=box.height;const header=await p.locator('.mf-header').boundingBox();measurements[w].visibleGlobeHeight=Math.max(0,Math.min(fr.y+s.camera.cy+s.camera.R,box.y)-Math.max(globeTop,header.y+header.height));}
  await close();
 });
 await check('A9 real limited no-price no-exchange and no-company states',w,async()=>{
  await open('TZ');let text=await p.locator('#mf-panel').innerText();assert.equal(focus.countries.TZ.counts.articles_48h,1);assert(text.includes('Limited coverage: 1 development in 48 h'));assert(text.includes('Not in our exchange list yet'));await open('MY');text=await p.locator('#mf-panel').innerText();assert(text.includes('Why no price?'));const empty=Object.entries(focus.countries).find(([,c])=>!c.investments.length);await open(empty[0],'investments');assert((await p.locator('#mf-panel').innerText()).includes('No companies named in recent developments'));await close();
 });
 await check('Connections verified news only, caps, exact source and confidence',w,async()=>{
  await open('NG','connections');const c=focus.countries.NG;assert(c.connections.length>0);const id=c.connections.find(id=>links.find(l=>l.id===id)?.dest.name.includes('Total'))||c.connections[0];await p.evaluate(id=>InvMarketPreview.connection(id),id);await pause(p);const l=links.find(l=>l.id===id),text=await p.locator('#mf-panel').innerText();assert(text.includes(l.evidence.headline));assert(text.includes(String(l.confidence)));assert(text.includes('not a trade or investment statistic'));assert((await state()).lines.length<=(w===390?3:5));assert((await state()).lines.every(id=>c.connections.includes(id)));await close();
 });
 // Screenshot evidence uses the actual source snapshot, not the regression fixture.
 const states=[['1-default','Default Markets',null],['2-country','Country Overview','NG','overview'],['3-centre','Financial Centre','NG','centre','XNSA'],['4a-focus-editorial','Editorial Briefing','NG','focus'],['4b-focus-structured','Structured Intelligence','NG','structured'],['5-invest','Research Companies','NG','investments'],['6-limited','Limited Coverage','TZ','overview'],['7-noprice','No Licensed Feed','MY','overview'],['8-connection','International Connection','NG','connections']];
 for(const [key,name,country,view,venue]of states){await close();if(country)await open(country,view,venue||null);if(key==='8-connection'){const ids=focus.countries.NG.connections,id=ids.find(id=>links.find(l=>l.id===id)?.dest.name.includes('Total'))||ids[0];await p.evaluate(id=>InvMarketPreview.connection(id),id);await pause(p);}await p.evaluate(({key,name,w})=>{document.querySelector('#evidence-label')?.remove();const el=document.createElement('div');el.id='evidence-label';el.textContent=`${key.split('-')[0]} · ${name} · Built · ${w===390?'Phone 390':'PC 1440'}`;Object.assign(el.style,{position:'fixed',zIndex:'9999',top:'4px',left:'50%',transform:'translateX(-50%)',padding:'5px 10px',borderRadius:'10px',background:'#ff7a1a',color:'#101012',font:'600 11px Arial',whiteSpace:'nowrap',pointerEvents:'none'});document.body.append(el);},{key,name,w});await p.evaluate(()=>document.activeElement?.blur());await p.screenshot({path:path.join(out,`MF-${w===390?'phone':'pc'}-${key}-built.png`)});if(['2-country','4a-focus-editorial','5-invest','7-noprice'].includes(key)&&await p.locator('#mf-panel').evaluate(e=>e.scrollHeight>e.clientHeight)){await p.locator('#mf-panel').evaluate(e=>e.scrollTop=e.scrollHeight);await p.evaluate(({key,w})=>{document.querySelector('#evidence-label').textContent=`${key.split('-')[0]} · Panel Detail · Built · ${w===390?'Phone 390':'PC 1440'}`;},{key,w});await p.screenshot({path:path.join(out,`MF-${w===390?'phone':'pc'}-${key}-details-built.png`)});await p.locator('#mf-panel').evaluate(e=>e.scrollTop=0);}}
 await check('No JavaScript errors or forbidden requests across all states',w,async()=>{assert.deepEqual(errors,[]);assert(!requests.some(u=>/\/(?:markets\.json|market-links\.json|news-prices\.json|intraday\.json|registry\.json|quotes\.js)|yahoo|workers\.dev/i.test(u)));});
 await check('Loading failure retries using real source data',w,async()=>{
  const retryPage=await c.newPage();let fail=true;
  await retryPage.route('**/market-focus.json',r=>fail?r.fulfill({status:503,body:'Unavailable'}):r.continue());
  await retryPage.goto(base+'/markets-preview.html',{waitUntil:'domcontentloaded'});
  await retryPage.waitForSelector('#mf-retry');assert((await retryPage.locator('#mf-panel').innerText()).includes("Couldn't load this market's developments. Try again."));
  fail=false;await retryPage.locator('#mf-retry').click();await retryPage.waitForFunction(()=>InvMarketPreview.state().ready);
  assert(await retryPage.locator('#mf-panel').isHidden());await retryPage.close();
 });
 await check('Accessible market search and phone swipe dismissal',w,async()=>{
  await close();await p.locator('.hn-search').click();await p.locator('#mf-query').fill('Nigeria');await p.locator('#mf-results button').first().click();await pause(p);assert((await p.locator('#mf-panel').innerText()).includes('Nigeria'));
  if(w===390){const box=await p.locator('.mf-handle').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+2);await p.mouse.down();await p.mouse.move(box.x+box.width/2,box.y+70,{steps:5});await p.mouse.up();await pause(p);assert(await p.locator('#mf-panel').isHidden());}else await close();
 });
 await check('Responsive resize preserves selected mode and correct globe placement',w,async()=>{
  const responsive=await c.newPage();await responsive.goto(base+'/markets-preview.html',{waitUntil:'domcontentloaded'});await responsive.waitForFunction(()=>window.InvMarketPreview?.state().ready);
  await responsive.locator('[data-globe-mode="news"]').click();
  const target=w===390?1440:390;await responsive.setViewportSize(viewport(target));
  const rf=responsive.frames().find(f=>f.url().includes('/market-preview.html'));
  await rf.waitForFunction(target=>window.InvMarketGlobe?.state().ready&&Math.abs(InvMarketGlobe.state().camera.cx-target*(target===390?.5:.7))<.1&&!MARKET.on,target);
  assert.equal(await responsive.locator('[data-globe-mode="news"]').getAttribute('aria-pressed'),'true');await responsive.close();
 });
 await check('Frozen snapshot survives rotated live files and missing website metadata',w,async()=>{
  const drift=await c.newPage(),driftErrors=[];drift.on('pageerror',e=>driftErrors.push(e.message));drift.on('console',m=>{if(m.type()==='error')driftErrors.push(m.text());});
  const differentNews={...fixture,stories:fixture.stories.filter(a=>a.location.country!=='Nigeria')};
  await drift.route('**/news-48h.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(differentNews)}));
  await drift.route('**/connections.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({connections:links.slice(0,1)})}));
  const snapshot=read('assets/globe/'+focus.source_file);delete snapshot.exchanges.XNSA.website;
  await drift.route('**/'+focus.source_file,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(snapshot)}));
  await drift.goto(base+'/markets-preview.html',{waitUntil:'domcontentloaded'});await drift.waitForFunction(()=>window.InvMarketPreview?.state().ready);
  await drift.evaluate(()=>InvMarketPreview.open('NG','investments-all'));assert.equal(await drift.locator('.mf-investment').count(),focus.countries.NG.investments.length);
  await drift.evaluate(()=>InvMarketPreview.open('NG'));assert.equal(await drift.locator('a[href*="undefined"]').count(),0);assert.equal(await drift.locator('#mf-retry').count(),0);assert.deepEqual(driftErrors,[]);await drift.close();
 });
 await c.close();
 await check('A10 News counts and connections match on fixed sourced fixture',w,async()=>{
  const c=await b.newContext({viewport:viewport(w),reducedMotion:'reduce',serviceWorkers:'block'});await fixtureExternal(c);
  await c.addInitScript(at=>{Date.now=()=>at;},Date.parse(fixture.updated_at));
  for(const endpoint of ['news-live.json','news-48h.json','news-archive.json'])await c.route('**/'+endpoint,r=>r.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));
  for(const endpoint of ['markets.json','news-prices.json','intraday.json'])await c.route('**/'+endpoint,r=>r.fulfill({contentType:'application/json',body:'{"assets":[],"s":{}}'}));
  await c.route('**/quotes.js',r=>r.fulfill({contentType:'application/javascript',body:'window.QUOTES={q:{}};'}));
  const sample=async(preview)=>{const p=await c.newPage();await p.goto(base+'/assets/globe/'+(preview?'market-preview.html':'news.html')+'?embed=1&cx=.7&cy=.5&r=.4',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof shown!=='undefined'&&shown.length>0&&network.length>0);if(preview)await p.evaluate(()=>marketSetMode('news'));await pause(p);const r=await p.evaluate(()=>({articles:shown.map(a=>a.id).sort(),connections:network.map(l=>l.conn?.id).sort()}));await p.close();return r;};
  const before=await sample(false),after=await sample(true);assert.deepEqual(after,before);assert(before.articles.length>20);assert(before.connections.length>0);measurements[w].newsRegression={articles:before.articles.length,connections:before.connections.length};await c.close();
 });
}
await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({sourceSnapshot:{updatedAt:news.updated_at,clock:"pinned to news-48h.updated_at"},results,measurements},null,2));console.log(`${results.filter(r=>r.pass).length}/${results.length} passed. Evidence: ${out}`);process.exitCode=results.some(r=>!r.pass)?1:0;
