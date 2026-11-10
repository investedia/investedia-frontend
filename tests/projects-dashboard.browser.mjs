import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,base} from './browser-support.mjs';
const browser=await launch(),out='.github/review/projects-dashboard';fs.mkdirSync(out,{recursive:true});
try{
for(const theme of ['dark','light'])for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(theme=>{localStorage.setItem('inv-theme',theme);localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),necessary:true,preferences:true,images:false,analytics:false,live:false}));},theme);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/assets/globe/news.html?mode=projects');await page.locator('[data-pj="line"]').waitFor();if(await page.locator('[data-consent=essential]').isVisible())await page.locator('[data-consent=essential]').click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),theme);assert.equal(await page.evaluate(()=>DAY),theme==='light');
 assert.equal(await page.locator('#pjStats div:first-child b').innerText(),'637');
 assert.equal(await page.locator('#gswitch [data-m=projects]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.pjd h2').innerText(),'The Line');
 assert(!/170 km|9 million|2030|2\.3T|SAMPLE/.test(await page.locator('#projPanel').innerText()));
 await page.locator('.pjq').fill('no possible project match xyz');assert.equal(await page.locator('.pjr').count(),0);await page.locator('.pjq').fill('');assert.equal(await page.locator('.pjr').count(),30);
 await page.locator('[data-pjmore]').click();assert.equal(await page.locator('.pjr').count(),60);
 await page.locator('[data-pf=c]').selectOption('Morocco');assert((await page.locator('.pjr small').allTextContents()).every(x=>x==='Morocco'));await page.locator('[data-pf=c]').selectOption('');
 await page.locator('[data-pw=line]').first().click();assert(JSON.parse(await page.evaluate(()=>localStorage.getItem('inv-proj-watch'))).includes('line'));
 await page.locator('[data-pj=line]').click();
 await page.locator('[data-pjtab=sources]').click();assert.match(await page.locator('.pj-sources').innerText(),/European Space Agency/);
 await page.locator('[data-pjtab=overview]').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(label=>{const b=document.createElement('div');b.textContent=label;b.style.cssText='position:fixed;left:8px;bottom:3px;z-index:99999;background:#ff7a1a;color:#111;font:600 11px Inter,sans-serif;padding:3px 8px;border-radius:4px';document.body.append(b);},`New · Claude Projects · ${width===390?'phone 390':'PC 1440'} · ${theme}`);
 await page.screenshot({path:`${out}/new-${width}-${theme}-detail.png`});
 if(width===390){await page.locator('[data-pj-back]').click();await page.screenshot({path:`${out}/new-${width}-${theme}-list.png`});await page.locator('#dock [data-v=markets]').click();assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('proj-mode')),false);await page.locator('#dock [data-v=projects]').click();await page.locator('#dock [data-v=globe]').click();}
 else{await page.locator('#gswitch [data-m=markets]').click();assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('proj-mode')),false);await page.locator('#gswitch [data-m=projects]').click();await page.locator('#gswitch [data-m=news]').click();}
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('proj-mode')),false);assert.deepEqual(errors,[]);
 await page.goto(base+'/projects.html');await page.locator('[data-project-cards] .pp-card').first().waitFor();assert.equal(await page.locator('[data-project-cards] .pp-card').count(),4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log(`PASS ${width} ${theme}: filters, tabs, watchlist, phone sheets, mode switches, shared records, no overflow or runtime errors`);await context.close();
}
}finally{await browser.close();}
