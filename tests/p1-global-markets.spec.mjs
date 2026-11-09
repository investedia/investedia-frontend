// Approved layouts A–D, verified against the committed files, at both widths.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launch, base, fixtureExternal} from './browser-support.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const registry=read('data/registry.json'),exchanges=read('data/exchanges.json'),markets=read('assets/globe/markets.json').assets,economy=read('assets/globe/economy.json').countries;
const out=process.env.P1_EVIDENCE_DIR||'design/evidence/p1-global-markets';fs.mkdirSync(out,{recursive:true});
const asOf=process.env.P1_AS_OF||'2026-11-06T21:34:11Z',now=Date.parse(asOf);
const cases=[['ZA','South Africa'],['NG','Nigeria'],['SA','Saudi Arabia'],['IN','India'],['BR','Brazil']];
const results={asOf,baselineCommit:process.env.P1_BASELINE_COMMIT||'7f8791d4d',checks:[],devices:{}};
function check(id,pass,evidence){results.checks.push({id,pass,evidence:structuredClone(evidence)});assert.ok(pass,`${id}: ${JSON.stringify(evidence)}`);}
const required=new Set([...Object.values(registry.assets).flatMap(a=>[a.mic,/^EQ:[A-Z0-9]{4}:/.test(a.id)?a.id.split(':')[1]:null]).filter(Boolean),...'XNSA XNAI XCAI XCAS XGHA XSAU XADS XDFM DSMD XKUW XBAH XIDX XSTC XBKK XPHS'.split(' ')]);
check('A7 every registry/required MIC covered',[...required].every(mic=>exchanges[mic]&&['name','short','city','country','currency','central_bank'].every(k=>exchanges[mic][k])),{required:required.size,covered:Object.keys(exchanges).length,missing:[...required].filter(mic=>!exchanges[mic])});
// Independently merge the actual files for country activity; no article fixtures.
function articles(window){
 const minutes={'48h':2880,'7d':10080,'30d':43200}[window],cut=now-minutes*60000,byId=new Map();
 for(const article of read('assets/globe/news-live.json').stories)byId.set(article.id,{...article,time:Date.parse(article.published_at)});
 for(const article of read('assets/globe/news-48h.json').stories)if(!byId.has(article.id)&&Date.parse(article.published_at)>=now-48*3600000)byId.set(article.id,{...article,time:Date.parse(article.published_at)});
 if(minutes>2880)for(const file of fs.readdirSync(path.join(root,'assets/globe/events')).sort()){if(!file.endsWith('.json'))continue;for(const event of read('assets/globe/events/'+file).events){const time=Date.parse(event.at);if(!byId.has(event.id)&&time>=cut&&time<=now)byId.set(event.id,{id:event.id,time,location:event.loc});}}
 return [...byId.values()].filter(a=>a.time>=cut);
}
const browser=await launch();
async function screenshot(page,name,width,label){
 await page.evaluate(label=>{document.getElementById('p1-evidence-label')?.remove();const el=document.createElement('div');el.id='p1-evidence-label';el.textContent=label;el.style.cssText='position:fixed;top:12px;left:12px;z-index:99999;background:#ff7a1a;color:#050506;font:700 15px sans-serif;padding:8px 11px;border-radius:9px;pointer-events:none';if(innerWidth>760)el.style.left='42%';document.body.append(el);},label||`Built · ${width===390?'Phone 390px':'PC 1440px'} · ${name}`);
 await page.screenshot({path:path.join(out,`${name}-${width}.png`),scale:'css'});await page.evaluate(()=>document.getElementById('p1-evidence-label').remove());
}
function parsed(text){return Number(text.replace(/[,%\s]/g,''));}
async function moveCheck(locator,value,id){const text=await locator.innerText();check(id,Number.isFinite(value)?text.includes(Math.abs(value).toFixed(2)+'%')&&text.includes(value>0?'↑':value<0?'↓':'↔'):text.includes('no data yet'),{source:value,display:text});}
async function tab(page,key){await page.locator(`[role=tab][data-gm-tab="${key}"]`).click();}
async function time(page,key,width){if(width===390){await page.locator('.tb-btn').click();await page.locator(`#tb [data-k="${key}"]`).click();}else await page.locator(`#wins [data-k="${key}"]`).click();await page.waitForFunction(key=>F.win===key&&!historyLoading,key);}
try{
 for(const width of [1440,390]){
  const device=width===390?'Phone':'PC',context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,serviceWorkers:'block',reducedMotion:'reduce'});
  await fixtureExternal(context);await context.addInitScript(asOf=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[asOf]));}static now(){return NativeDate.parse(asOf);}};},asOf);
  const page=await context.newPage(),errors=[],consoleErrors=[],missing=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push({text:m.text(),url:m.location().url});});
  page.on('response',r=>{if(r.status()===404&&r.url().includes('/events/'))missing.push(r.url());});page.on('request',r=>requests.push(r.url()));
  await page.goto(base+'/assets/globe/news.html',{waitUntil:'domcontentloaded'});await page.locator('[data-consent=essential]').click();await page.waitForFunction(()=>stories.length>0&&MKT.all&&ECON);
  check(`lazy directory ${device}`,!requests.some(u=>/data\/(registry|exchanges|companies)\.json/.test(u)),'Initial global news view requests no market directories');
  await time(page,'30d',width);
  const record=results.devices[device]={countries:{}};
  for(const [code,name] of cases){
   await page.evaluate(name=>openCountry(byName[name]),name);await page.waitForSelector(`[data-gm-country="${code}"] [data-gm-kpi="benchmark"]`);
   const country=page.locator(`[data-gm-country="${code}"]`),sourceIndices=markets.filter(a=>a.k===name&&a.g==='Index'),benchmark=sourceIndices.find(a=>a.m)||sourceIndices[0],currency=markets.find(a=>a.k===name&&a.t==='fx');
   const equityIds=Object.values(registry.assets).filter(a=>a.class==='equity'&&exchanges[a.mic]?.country===code).map(a=>a.id);
   const expectedNews=articles('30d').filter(a=>a.location.country===name).length;
   const benchmarkText=await country.locator('[data-gm-kpi=benchmark]>b').innerText(),fxText=await country.locator('[data-gm-kpi=currency]>b').innerText();
   check(`A5 ${device} ${code} index`,benchmark?parsed(benchmarkText)===benchmark.p:benchmarkText==='no data yet',{source:benchmark?.p,display:benchmarkText});
   check(`A5 ${device} ${code} currency`,currency?parsed(fxText)===Number(currency.p.toFixed(4)):fxText==='no data yet',{source:currency?.p,display:fxText});
   await moveCheck(country.locator('[data-gm-kpi=benchmark]'),benchmark?.d,`A5 ${device} ${code} benchmark move`);await moveCheck(country.locator('[data-gm-kpi=currency]'),currency?.d,`A5 ${device} ${code} currency move`);
   for(const [key,selector] of [['infl','inflation'],['unemp','unemployment']]){const expected=economy[code]?.[key],display=await country.locator(`[data-gm-${selector}]`).innerText();check(`A5 ${device} ${code} ${key}`,expected?display.includes(expected[1].toFixed(1)+'%')&&display.includes(String(expected[0])):display.includes('no data yet'),{source:expected,display});}
   check(`A6 ${device} ${code} overview`,!(/\b(?:NaN|undefined|null)\b/.test(await country.innerText())),'Overview contains no invalid text');
   const newsTab=await country.locator('[role=tab][data-gm-tab=news]').innerText();check(`A5 ${device} ${code} news count`,newsTab===`News (${expectedNews})`,{source:expectedNews,display:newsTab});
   record.countries[code]={benchmark:benchmark||null,currency:currency||null,macro:economy[code],companyCount:equityIds.length,newsCount:expectedNews};
   if(code==='ZA'){
    check(`A1 ${device}`,parsed(benchmarkText)===benchmark?.p&&equityIds.length===23&&(await country.locator('[data-gm-inflation]').innerText()).includes('3.2% (2025)'),record.countries[code]);
    const abroad=await country.locator('[data-gm-abroad]').evaluateAll(rows=>rows.map(r=>r.dataset.gmAbroad));check(`registry overseas listings ${device}`,abroad.length>0&&abroad.every(id=>Object.values(registry.companies).some(co=>co.listings.includes(id)&&co.listings.some(local=>equityIds.includes(local)))&&exchanges[registry.assets[id].mic].country!==code),abroad);
    await screenshot(page,width===390?'built-C-country':'built-A-country',width,`Built ${width===390?'C':'A'} · ${device} ${width}px · Country`);
   }
   if(code==='NG')await screenshot(page,'missing-data-NG',width);
   if(width===390&&await page.locator('#sheet-expand').isVisible())await page.locator('#sheet-expand').click();
   await tab(page,'companies');const actualIds=await country.locator('[data-gm-listing]').evaluateAll(rows=>rows.map(r=>r.dataset.gmListing));check(`A5 ${device} ${code} companies`,actualIds.length===equityIds.length&&equityIds.every(id=>actualIds.includes(id)),{expected:equityIds,actual:actualIds});
   const moves=await country.locator('[data-gm-listing]').evaluateAll(rows=>rows.map(row=>({id:row.dataset.gmListing,text:row.textContent})));
   for(const row of moves){const asset=registry.assets[row.id],quote=markets.find(a=>a.t==='stocks'&&a.g!=='Index'&&a.g!=='Country ETF'&&a.k===name&&(a.s===asset.px||asset.globe_symbol&&a.s===asset.globe_symbol||asset.site&&a.site===asset.site));check(`A5 ${device} ${code} company move ${row.id}`,Number.isFinite(quote?.d)?row.text.includes(Math.abs(quote.d).toFixed(2)+'%')&&row.text.includes(quote.d>0?'↑':quote.d<0?'↓':'↔'):row.text.includes('no data yet'),{source:quote?.d,display:row.text});}
   check(`A6 ${device} ${code} company view`,!(/\b(?:NaN|undefined|null)\b/.test(await country.innerText())),'Companies contain no invalid text');
   const links=await country.locator('[data-gm-listing]').evaluateAll(rows=>rows.map(row=>row.getAttribute('href')));check(`company links ${device} ${code}`,links.every(href=>/^\.\.\/\.\.\/(company|asset)\.html\?[cs]=/.test(href)),links);
   if(code==='ZA')await screenshot(page,'companies-ZA',width);
   await tab(page,'markets');
   const marketRows=await country.locator('[data-gm-market]').evaluateAll(rows=>rows.map(r=>({symbol:r.dataset.gmMarket,href:r.getAttribute('href'),price:r.querySelector('[data-gm-price]').textContent,day:r.querySelector('[data-gm-day]').textContent,week:r.querySelector('[data-gm-week]').textContent})));
   for(const row of marketRows){const source=markets.find(a=>a.s===row.symbol);check(`market link ${device} ${code} ${row.symbol}`,new URL(row.href,base+'/assets/globe/news.html').searchParams.get('s')===row.symbol,row.href);check(`A5 ${device} ${code} market ${row.symbol}`,row.price.includes(source.p.toLocaleString('en-US',{maximumFractionDigits:source.t==='fx'?4:2}))&&row.day.includes(Math.abs(source.d).toFixed(2)+'%')&&(Number.isFinite(source.w)?row.week.includes(Math.abs(source.w).toFixed(2)+'%'):row.week.includes('no data yet')),{source:{p:source.p,d:source.d,w:source.w},display:row});}
   if(code==='ZA')await screenshot(page,'markets-ZA',width);
   const text=await country.innerText();check(`A6 ${device} ${code}`,!(/\b(?:NaN|undefined|null)\b/.test(text)),'No invalid numeric/placeholder text in market/overview/company views');
   if(width===390)check(`A2 ${code} no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&pbody.scrollWidth<=pbody.clientWidth+1),{width});
  }
  // Use the existing region control, then verify its list against the source files.
  await page.locator('[data-back]').click();await time(page,'7d',width);
  if(width===390)await page.locator('#m-filters').click();await page.locator('#reg-btn').click();
  await page.locator('#regions [data-k=af]').click();if(width===390)await page.locator('#fs-close').click();
  await page.waitForSelector('[data-gm-region-panel=af]');await page.locator('[data-gm-countries]').click();
  const sourceCounts={};for(const article of articles('7d').filter(a=>a.location.region==='af'))sourceCounts[article.location.country]=(sourceCounts[article.location.country]||0)+1;
  const rows=await page.locator('.gm-country-list [data-gm-count]').evaluateAll(rows=>rows.map(r=>({country:r.dataset.country,count:Number(r.dataset.gmCount)})));
  check(`A3 ${device} ordered country counts`,rows.every((r,i)=>r.count===(sourceCounts[r.country]||0)&&(!i||rows[i-1].count>=r.count)),{source:sourceCounts,display:rows});
  check(`A3 ${device} all active countries represented`,Object.keys(sourceCounts).every(country=>rows.some(row=>row.country===country)),Object.keys(sourceCounts));
  check(`A3 ${device} country counts equal globe`,await page.evaluate(rows=>rows.every(r=>r.count===(activity[r.country]||0)),rows),rows);
  record.africa={rows,sourceCounts};await page.locator('[data-gm-countries]').click();
  check(`A4 ${device} existing panel`,await page.locator('.gm-continent').isVisible()&&await page.locator('.compact-list').count()>0,'Continent explorer precedes the retained article list');
  if(width===390)check('A4 partial phone sheet',await page.evaluate(()=>sheetState!=='closed'&&sheetVisible<SHEET_MAX()-1),'Continent selection keeps the Globe visible above a partial sheet');
  await screenshot(page,width===390?'built-D-africa':'built-B-africa',width,`Built ${width===390?'D':'B'} · ${device} ${width}px · Africa`);
  const underserved=await page.locator('.gm-underserved [data-country]').evaluateAll(rows=>rows.map(r=>({country:r.dataset.country,text:r.textContent})));
  check(`underserved ${device}`,underserved.every(r=>sourceCounts[r.country]>=1&&sourceCounts[r.country]<=9),underserved);
  await page.locator('[data-gm-region=am]').click();check(`Americas region ${device}`,await page.evaluate(()=>F.region==='am'&&shown.every(s=>['na','latam'].includes(s.location.region))&&document.querySelector('.gm-continent h2').textContent==='Americas'),'Both Americas share the real region filter');await page.locator('[data-gm-region=af]').click();
  const dirRequests=requests.filter(u=>/data\/(registry|exchanges|companies)\.json/.test(u));check(`directory cache ${device}`,dirRequests.length===3,dirRequests);
  // Open a country from B, use News/Companies, and return to the explorer.
  await page.locator('.gm-country-list [data-country="South Africa"]').click();await page.locator('[data-gm-tab=news][role=tab]').click();
  const headline=await page.locator('.gm-news strong').first().innerText();await page.locator('.gm-news').first().click();check(`A8 ${device} article opens`,(await page.locator('.story-heading h2').innerText())===headline,headline);
  await page.locator('[data-back]').click();await page.locator('[data-back]').click();check(`A8 ${device} explorer return`,await page.locator('[data-gm-region-panel=af]').isVisible(),'Country/article back navigation retains region');
  await page.evaluate(()=>{$('regions').querySelector('[data-k=global]').click();});await time(page,'48h',width);
  check(`A8 ${device} P0 short window`,await page.evaluate(expected=>shown.length===expected,articles('48h').length),'48H source count preserved after history and panel navigation');
  const actualErrors=consoleErrors.filter(e=>!missing.includes(e.url));check(`A9 ${device}`,errors.length===0&&actualErrors.length===0,{pageErrors:errors,consoleErrors:actualErrors,expectedMissingDays:missing.length});
  record.errors={pageErrors:errors,consoleErrors:actualErrors,expectedMissingDays:missing};await context.close();
 }
}finally{fs.writeFileSync(path.join(out,'functional-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close();}
