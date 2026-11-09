// Run: node tests/consent.spec.mjs (serve docs/ first). Fresh context per URL/width.
import fs from 'node:fs';
import {pageSources} from '../tools/page-sources.mjs';
import assert from 'node:assert/strict';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';
const pages=pageSources().filter(p=>!JSON.parse(fs.readFileSync(p.source,'utf8').split('\n')[0]).redirect).map(p=>p.name);
pages.push('assets/globe/news.html','assets/globe/news.html?embed=1');
const requested=process.env.TEST_PAGES?.split(',');const rows=requested&&fs.existsSync('tests/consent-results.json')?JSON.parse(fs.readFileSync('tests/consent-results.json')).filter(r=>!requested.includes(r.page)):[],details=[],browser=await launch();
const optional=['inv-theme','inv-pal','inv-studio','inv-profile','inv-notif-read','inv-learn'];
try{for(const w of widths)for(const url of pages.filter(n=>!requested||requested.includes(n))){
 const c=await browser.newContext({viewport:viewport(w),isMobile:w===390,hasTouch:w===390,serviceWorkers:'block',reducedMotion:'reduce'});await fixtureExternal(c);
 await c.addInitScript(()=>{localStorage.setItem('inv-auth-seen','1');localStorage.setItem('inv-pop','1');localStorage.setItem('inv-app-x','1');});
 const p=await c.newPage();p.setDefaultTimeout(20000);const remote=[],errors=[];p.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin)remote.push(r.url());});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const result={page:url,width:w,first:'—',essential:'—',all:'—',withdraw:'—',reprompt:'—',errors:[]};
 try{
 await p.goto(base+'/'+(url==='story.html'?url+'?id='+JSON.parse(fs.readFileSync('assets/globe/news-live.json')).stories[0].id:url),{waitUntil:'domcontentloaded'});await p.waitForTimeout(400);
 const embed=url.includes('embed=1'),card=p.locator('#inv-consent-panel');
 if(embed){assert.equal(await card.count(),0);assert.deepEqual(remote,[]);result.first='PASS (no banner in embed)';}
 else{assert(await card.isVisible());assert.equal(await card.locator('button').count(),2);assert.deepEqual(remote,[]);await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.activeElement!==document.body));result.first='PASS';}
 assert.deepEqual(await p.evaluate(keys=>keys.filter(k=>localStorage.getItem(k)!==null),optional),[]);
 if(embed){await p.evaluate(()=>{localStorage.setItem('inv-consent',JSON.stringify({version:InvConsent.version,date:new Date().toISOString(),preferences:false,images:false,analytics:false}));});await p.reload({waitUntil:'domcontentloaded'});}
 else await card.locator('[data-consent=essential]').click();
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(300);assert.deepEqual(remote,[]);assert.deepEqual(await p.evaluate(keys=>keys.filter(k=>localStorage.getItem(k)!==null),optional),[]);result.essential='PASS';
 if(embed){await p.evaluate(()=>{localStorage.setItem('inv-consent',JSON.stringify({version:InvConsent.version,date:new Date().toISOString(),preferences:true,images:true,analytics:true}));});}
 else{const settings=p.locator('[data-cookie-settings]').first();assert(await settings.count());await settings.click();assert(await card.isVisible());await card.locator('[data-consent=accept]').click();}
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(400);const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('inv-consent')));assert(saved.version&&Date.parse(saved.date)&&saved.images&&saved.analytics&&saved.preferences);assert(remote.some(u=>u.includes('fonts.googleapis.com')));result.all='PASS';
 await p.evaluate(()=>{localStorage.setItem('inv-theme','light');sessionStorage.setItem('inv-learn','test');});
 if(embed){await p.evaluate(()=>{localStorage.setItem('inv-consent',JSON.stringify({version:InvConsent.version,date:new Date().toISOString(),preferences:false,images:false,analytics:false}));});}
 else{await p.locator('[data-cookie-settings]').first().click();await card.locator('[data-consent=essential]').click();}
 const start=remote.length;await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(300);assert.equal(remote.length,start);assert.deepEqual(await p.evaluate(keys=>keys.filter(k=>localStorage.getItem(k)!==null||sessionStorage.getItem(k)!==null),optional),[]);result.withdraw='PASS';
 if(!embed){for(const value of [{version:999,date:new Date().toISOString()},{version:1,date:'2020-01-01T00:00:00Z'}]){await p.evaluate(v=>localStorage.setItem('inv-consent',JSON.stringify({...v,preferences:true,images:true,analytics:true})),value);await p.reload({waitUntil:'domcontentloaded'});assert(await card.isVisible());}result.reprompt='PASS';}else result.reprompt='parent banner';
 assert.deepEqual(errors,[]);
 }catch(e){result.errors.push(e.message);result.errors.push(...errors);details.push(result);}
 rows.push(result);console.log(w,url,result.errors.length?'FAIL '+result.errors[0]:'PASS');await c.close();
}}finally{await browser.close();}
fs.writeFileSync('tests/consent-results.json',JSON.stringify(rows,null,2));
fs.writeFileSync('tests/consent-matrix.md','# Consent verification — 22 October 2026\n\nChromium; docs served locally; 1440×900 and 390×844. All canonical public pages plus account gates, owner gate and embedded globe. External font/logo/rate/event requests are recorded then fulfilled with deterministic test responses; provider availability and authenticated flows are not asserted. No optional third-party request is permitted before consent or after essential choice. Account-popups suppressed using necessary dismissal keys only.\n\n| Page | Width | First | Essential | All | Withdraw | Re-prompt | Errors |\n|---|---:|---|---|---|---|---|---|\n'+rows.map(r=>`| ${r.page} | ${r.width} | ${r.first} | ${r.essential} | ${r.all} | ${r.withdraw} | ${r.reprompt} | ${r.errors.join('; ').replaceAll('|','/')} |`).join('\n')+'\n');
if(details.length){console.error(details.length+' failing rows');process.exitCode=1;}
