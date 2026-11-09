import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launch,base,fixtureExternal,viewport} from './browser-support.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const out=process.env.P4_EVIDENCE_DIR||'design/evidence/p4-markets-globe';fs.mkdirSync(out,{recursive:true});
const links=read('assets/globe/market-links.json').links,registry=read('data/registry.json'),economy=read('assets/globe/economy.json'),markets=read('assets/globe/markets.json').assets;
const results={baselineCommit:process.env.P4_BASELINE_COMMIT||'1a72e0045',clock:process.env.P4_AS_OF||'2026-11-07T03:00:00Z',checks:[],devices:{}};
function check(id,pass,evidence){results.checks.push({id,pass,evidence});assert.ok(pass,id+': '+JSON.stringify(evidence));}
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
async function shot(p,name,w){await p.evaluate(label=>{let el=document.getElementById('p4-label');if(!el){el=document.createElement('div');el.id='p4-label';document.body.append(el);}el.textContent=label;el.style.cssText='position:fixed;top:60px;left:12px;z-index:999999;background:#FF7A1A;color:#101012;padding:6px 10px;border-radius:8px;font:700 12px Inter,sans-serif;pointer-events:none';},`Built · ${w===390?'Phone 390px':'PC 1440px'} · ${name}`);await p.screenshot({path:path.join(out,`${name}-${w}.png`)});await p.evaluate(()=>document.getElementById('p4-label').remove());}
const browser=await launch();
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:viewport(width),isMobile:width===390,hasTouch:width===390,serviceWorkers:'block'});await fixtureExternal(context);await context.routeWebSocket(/wss:\/\/ws-feed\.exchange\.coinbase\.com/,socket=>socket.onMessage(()=>{}));
 await context.addInitScript(()=>{for(const k of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(k,'1');});
 const page=await context.newPage(),errors=[],consoleErrors=[],httpDiagnostics=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')(m.text().startsWith('Failed to load resource')?httpDiagnostics:consoleErrors).push({text:m.text(),url:m.location().url});});await page.clock.install({time:new Date(results.clock)});
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});await page.locator('[data-consent=essential]').click({timeout:4000}).catch(()=>{});
 await page.frameLocator('#hnGlobe').locator('#cv').waitFor({state:'attached'});let frame=page.frames().find(f=>f.url().includes('embed=1'));await frame.waitForFunction(()=>typeof MARKET!=='undefined');
 frame.on('pageerror',e=>errors.push(e.message));
 check('A1 News default '+width,await frame.evaluate(()=>!MARKET.on)&&!new URL(page.url()).searchParams.has('mode'));
 check('A1 News CTA '+width,await page.locator('.hn-open .t').textContent()==='Open globe');
 await shot(page,'news',width);
 await page.locator('[data-globe-mode=markets]').click();await frame.waitForFunction(()=>MARKET.ready);
 check('A1 rings without lines '+width,await frame.evaluate(()=>MARKET.on&&MARKET.markers.length>=63&&MARKET.drawnLines.length===0));
 check('A1 URL and search '+width,new URL(page.url()).searchParams.get('mode')==='markets'&&(await page.locator('.hn-search').innerText()).includes('Search countries, exchanges, indices & companies')&&(await page.locator('.hn-open').getAttribute('href')).includes('mode=markets'));
 await shot(page,'markets-unselected',width);
 await page.locator('.hn-search').click();const searchInput=page.locator('.pk-sb input');await searchInput.waitFor();check('A1 Markets search prompt '+width,(await searchInput.getAttribute('placeholder')).includes('countries, exchanges, indices & companies'));await searchInput.fill('NGX');const ngx=page.locator('.pk-r [data-nav="market:XNSA:Nigeria"]');await ngx.waitFor();await ngx.click();await frame.waitForFunction(()=>MARKET.selected==='Nigeria');check('A1 exchange search stays in homepage Markets '+width,new URL(page.url()).pathname.endsWith('/index.html')&&new URL(page.url()).searchParams.get('mode')==='markets');await frame.locator('.market-close').click();

 // Select through the real renderer tap path at the source-projected market ring.
 await frame.evaluate(()=>{const m=MARKET.markers.find(e=>e.id==='XNSA');fly=null;lon0=3.38;lat0=6.52;const p=proj(m.phi,m.lam);marketTap(p[0],p[1]);});
 await frame.waitForFunction(()=>MARKET.selected==='Nigeria'&&MARKET.drawnLines.length>0&&!fly);
 const actual=await frame.evaluate(()=>({links:MARKET.drawnLines,labels:MARKET.labels,selected:MARKET.selected,markers:MARKET.markers.length}));
 check('A1 Nigeria selected '+width,actual.selected==='Nigeria');check('A1 all rings selectable with real city positions '+width,await frame.evaluate(()=>MARKET.markers.every(e=>!!byName[e.countryName]&&e.positionSource!=='country centroid')));
 const text=await frame.locator('.market-panel').innerText(),ngfx=markets.find(a=>a.k==='Nigeria'&&a.t==='fx'),infl=economy.countries.NG.infl;
 check('A1 Nigeria KPI data '+width,text.includes(ngfx.p.toLocaleString('en-US',{minimumFractionDigits:2}))&&text.includes(infl[1].toFixed(1)+'%')&&text.includes(String(infl[0]))&&text.includes('no data yet'),{source:{fx:ngfx.p,inflation:infl},text});
 check('A1 panel elements '+width,['AFRICA · MARKET','Nigerian Exchange (NGX)','Notable developments','Market Momentum','Performers','Attention','Sectors','Explore Nigeria','Trade','Investment','Not a recommendation.'].every(t=>text.toLowerCase().includes(t.toLowerCase())));
 for(const l of actual.links)check('A2 sourced line '+width+' '+l.id,links.some(s=>s.id===l.id&&s.source===l.source&&s.year===l.year&&s.value_usd===l.value_usd),l);
 check('A2 phone cap and link kinds '+width,actual.links.length<=(width===390?5:10)&&new Set(actual.links.map(l=>l.kind)).size===2,actual.links.map(l=>l.id));
 const panel=await frame.locator('.market-panel').boundingBox(),cta=await page.locator('.hn-open').boundingBox(),sw=await page.locator('.hn-mode-row').boundingBox(),ifr=await page.locator('#hnGlobe').boundingBox();
 const globalPanel=panel,localPanel={...panel,x:panel.x-ifr.x,y:panel.y-ifr.y};
 check('A3 clear controls '+width,!overlap(globalPanel,cta)&&!overlap(globalPanel,sw),{panel:globalPanel,cta,sw});
 check('A3 phone sheet or desktop panel '+width,width===390?panel.height<=ifr.height*.55+1&&panel.y>ifr.height*.35:panel.x>1000,{panel,ifr});
 const boxes=actual.labels.map(l=>({...l,width:l.w,height:l.h}));let pairs=0;for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(overlap(boxes[i],boxes[j]))pairs++;
 check('A4 atlas no overlaps '+width,pairs===0,{overlaps:pairs,labels:actual.labels});
 check('A4 selected label '+width,actual.labels.some(l=>l.id==='XNSA'),actual.labels);
 check('A4 labels clear of panel '+width,boxes.every(l=>!overlap(l,localPanel)));
 // Independently count unique verified company mentions per country article from loaded source records.
 const attention=await frame.evaluate(()=>marketRows().attention),sourceArticles=new Map();
 for(const file of ['assets/globe/news-live.json','assets/globe/news-48h.json'])for(const a of read(file).stories)sourceArticles.set(a.id,a);
 const cut=Date.parse(results.clock)-30*864e5;for(const file of fs.readdirSync(path.join(root,'assets/globe/events')).sort())for(const e of read('assets/globe/events/'+file).events||[])if(!sourceArticles.has(e.id))sourceArticles.set(e.id,{id:e.id,published_at:e.at,location:e.loc,entities:(e.cos||[]).map(c=>({asset:{id:c.id}})),historicalAssets:e.assets||[]});
 const counted=new Map();for(const a of sourceArticles.values())if(a.location?.country==='Nigeria'&&Date.parse(a.published_at)>=cut){const ids=[...(a.entities||[]).map(e=>e.asset?.id),...(a.historicalAssets||[]).filter(e=>e.src==='entity').map(e=>e.id)],cos=new Set(ids.map(id=>registry.assets[id]).filter(a=>a?.class==='equity').map(a=>a.company||a.id));for(const co of cos)counted.set(co,(counted.get(co)||0)+1);}
 check('A1 verified attention '+width,attention.every(r=>r.n===counted.get(r.id))&&attention.length===counted.size,{actual:attention,source:[...counted]});
 await shot(page,'markets-nigeria',width);
 const detail=await context.newPage();detail.on('pageerror',e=>errors.push(e.message));const newsHref=await frame.locator('.market-section a').first().getAttribute('href');await detail.goto(new URL(newsHref,frame.url()).href);await detail.waitForFunction(()=>F.win==='30d'&&countryTab==='news'&&!historyLoading);await detail.locator('[data-gm-tab=news][aria-selected=true]').waitFor();check('A1 country news destination '+width,(await detail.locator('[data-gm-tab=news]').innerText()).includes(String([...sourceArticles.values()].filter(a=>a.location?.country==='Nigeria'&&Date.parse(a.published_at)>=cut).length)));await detail.close();

 await frame.locator('[data-market-tab=performers]').click();check('A1 unlicensed prices missing '+width,(await frame.locator('.market-panel [role=tabpanel]').innerText()).includes('Licensed historical prices are not available'));
 await frame.locator('[data-market-tab=sectors]').click();check('A1 sector tab '+width,await frame.locator('[data-market-tab=sectors]').getAttribute('aria-selected')==='true');
 const companySectors=read('data/companies.json').companies,sectorCounts=new Map();for(const a of sourceArticles.values())if(a.location?.country==='Nigeria'&&Date.parse(a.published_at)>=cut){const sectors=new Set();for(const id of [...(a.entities||[]).map(e=>e.asset?.id),...(a.historicalAssets||[]).filter(e=>e.src==='entity').map(e=>e.id)]){const asset=registry.assets[id];if(asset?.class!=='equity')continue;const sector=companySectors.find(c=>c.listings.some(l=>l.s===asset.px))?.sector;if(sector)sectors.add(sector);}for(const s of sectors)sectorCounts.set(s,(sectorCounts.get(s)||0)+1);}
 const sectors=await frame.evaluate(()=>marketRows().sectors);check('A1 source sector counts '+width,sectors.length===sectorCounts.size&&sectors.every(s=>sectorCounts.get(s.name)===s.n),{actual:sectors,source:[...sectorCounts]});

 if(width===390){await frame.locator('.market-handle').focus();await page.keyboard.press('ArrowUp');check('A3 keyboard sheet expand '+width,(await frame.locator('.market-panel').boundingBox()).height<=ifr.height*.55+1);await shot(page,'markets-nigeria-expanded',width);}
 await frame.locator('.market-close').click();check('A1 close panel '+width,await frame.locator('.market-panel').isHidden());
 await frame.evaluate(()=>marketSelect('United States of America','XNAS'));check('A1 selected exchange identity '+width,await frame.evaluate(()=>MARKET.selectedVenue==='XNAS'&&marketPanel.querySelector('.market-exchange').textContent.includes(MARKET.exchanges.XNAS.name)));await frame.locator('.market-close').click();

 await frame.evaluate(()=>marketSelect('Nigeria'));await page.keyboard.press('Escape');check('A1 Escape closes '+width,await frame.locator('.market-panel').isHidden());
 await frame.evaluate(()=>marketSelect('Nigeria'));await frame.evaluate(()=>marketTap(1,1));check('A1 outside tap closes '+width,await frame.locator('.market-panel').isHidden());
 await page.locator('[data-globe-mode=news]').click();check('A1 News restored '+width,await frame.evaluate(()=>!MARKET.on)&&!new URL(page.url()).searchParams.has('mode'));
 const gear=page.getByRole('button',{name:'Settings',exact:true});check('A5 gear in header '+width,await gear.isVisible()&&await gear.locator('svg').count()===1);
 await gear.click();check('A5 two Settings rows '+width,await page.locator('.pf-dd select').count()===2);await shot(page,'settings',width);
 await page.locator('[data-setting=currency]').selectOption('EUR');check('A5 currency saved '+width,await page.evaluate(()=>JSON.parse(localStorage.getItem('inv-prefs')).cur==='EUR'));
 const arithmetic=await page.evaluate(()=>({usd:InvPrefs.fmt(100,{cur:'USD',t:'stocks',s:'AAPL'}),local:InvPrefs.fmt(100,{cur:'ZAR',t:'stocks',s:'ABG.JO'}),index:InvPrefs.fmt(100,{cur:'USD',g:'Index'}),rate:InvPrefs.rates.EUR}));
 check('A5 USD conversion correct '+width,arithmetic.usd.includes((100*arithmetic.rate).toFixed(2))&&arithmetic.usd.includes('EUR'),arithmetic);
 check('A5 local quotes and index units '+width,!arithmetic.local.includes('EUR')&&!arithmetic.index.includes('EUR'),arithmetic);
 const guards=await page.evaluate(()=>{const before=UI.fmtC(1.25),rate=InvPrefs.rates.EUR;delete InvPrefs.rates.EUR;const missing=InvPrefs.fmt(100,{cur:'USD'});InvPrefs.setRates({EUR:rate,BAD:-1});return{before,after:UI.fmtC(1.25),missing,bad:InvPrefs.rates.BAD};});
 check('A5 no rate preserves source '+width,guards.missing.includes('100.00')&&!guards.missing.includes('EUR'),guards);
 check('A5 percentages unchanged and bad rates rejected '+width,guards.before===guards.after&&guards.bad===undefined,guards);

 await page.keyboard.press('Escape');check('Settings Escape '+width,await page.locator('.pf-dd').isHidden()&&await gear.evaluate(e=>e===document.activeElement));
 // A USD-quoted asset rendered on the homepage via its existing popular-search asset sheet.
 await page.locator('[data-pop="BTC-USD"]').click();const sheet=page.frameLocator('.pk-sheet iframe').last();await sheet.locator('.ap-p').waitFor({timeout:30000});const homePrice=await sheet.locator('.ap-p').innerText();check('A5 homepage price converts '+width,homePrice.includes('EUR'),homePrice);await page.keyboard.press('Escape');
 await page.goto(base+'/asset.html?s=AAPL');await page.locator('.ap-p').waitFor();const assetPrice=await page.locator('.ap-p').innerText();check('A5 asset price converts '+width,assetPrice.includes('EUR'),assetPrice);
 await page.reload();await page.locator('.ap-p').waitFor();check('A5 persistence '+width,(await page.locator('.ap-p').innerText()).includes('EUR'));
 const company=read('data/companies.json').companies.find(c=>c.listings.some(l=>l.s==='AAPL'));await page.goto(base+'/company.html?c='+encodeURIComponent(company.slug));await page.locator('.co-asset-r [data-usd-value]').first().waitFor();check('A5 company price converts '+width,(await page.locator('.co-asset-r [data-usd-value]').first().innerText()).includes('EUR'));
 await page.getByRole('button',{name:'Settings',exact:true}).focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');check('Settings keyboard reachable '+width,await page.evaluate(()=>!!document.activeElement.closest('.pf-dd')));await page.locator('[data-setting=language]').selectOption('fr');await page.waitForFunction(()=>document.documentElement.lang==='fr');check('A6 native French '+width,await page.evaluate(()=>InvLocale.language==='fr')&&!page.url().includes('translate.goog'));
 await page.goto(base+'/about.html');await page.waitForFunction(()=>document.documentElement.lang==='fr');check('A6 French persistence '+width,await page.evaluate(()=>InvLocale.language==='fr'));
 await page.locator('.ftr-lang button').click();check('A6 footer opens Settings '+width,await page.locator('.pf-dd').isVisible());
 await context.route('**/market-links.json',r=>r.fulfill({status:404,body:'not found'}));await page.goto(base+'/assets/globe/news.html?mode=markets&country=Nigeria');await page.waitForFunction(()=>MARKET.ready&&MARKET.selected==='Nigeria');check('A2 absent links never invent arcs '+width,await page.evaluate(()=>MARKET.links.length===0&&MARKET.drawnLines.length===0));
 check('A8 no app exceptions '+width,errors.length===0,errors);check('A8 no application console errors '+width,consoleErrors.length===0,consoleErrors);check('A8 no phone overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));results.devices[width]={links:actual.links.map(l=>l.id),labels:actual.labels,homePrice,assetPrice,errors,consoleErrors,httpDiagnostics};await context.close();
}results.completed=true;}catch(error){results.error=error.message;throw error;}finally{await browser.close();results.passed=results.checks.filter(c=>c.pass).length;results.failed=results.checks.filter(c=>!c.pass).length;fs.writeFileSync(path.join(out,'functional-results.json'),JSON.stringify(results,null,2)+'\n');console.log(`${results.passed} pass, ${results.failed} fail`);}
