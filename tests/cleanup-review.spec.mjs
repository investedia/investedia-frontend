// Compare the same saved dataset on current main and the grouped-source build.
// Serve baseline docs at REVIEW_BASE_URL, built docs at TEST_BASE_URL.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {launch,base,viewport,widths,fixtureExternal} from './browser-support.mjs';

const output=process.env.REVIEW_OUTPUT||'design/cleanup-review';
fs.mkdirSync(output,{recursive:true});
const routes=[['home','index.html'],['globe','assets/globe/news.html'],['news','news.html'],['asset','asset.html?s=AAPL']];
const browser=await launch(), results=[];
try {
  for(const width of widths) for(const [name,route] of routes){
    const versions=[];
    for(const [label,url] of [['Now',process.env.REVIEW_BASE_URL||'http://127.0.0.1:8771'],['Built',base]]){
      const context=await browser.newContext({viewport:viewport(width),isMobile:width===390,hasTouch:width===390,serviceWorkers:'block',reducedMotion:'reduce'});
      await fixtureExternal(context);
      // Both builds consume the exact same retained saved data, without rewriting it.
      if(process.env.REVIEW_DATA_ROOT)await context.route('http://127.0.0.1:**/*',async route=>{
        const pathname=new URL(route.request().url()).pathname;
        if(pathname.endsWith('.json')||/\/(quotes|news|data)\.js$/.test(pathname)){
          const root=path.resolve(process.env.REVIEW_DATA_ROOT),file=path.resolve(root,'.'+pathname);
          if(file.startsWith(root+path.sep)&&fs.existsSync(file))return route.fulfill({path:file});
        }
        return route.continue();
      });
      await context.addInitScript(()=>{
        const NativeDate=Date,fixed=NativeDate.parse('2026-11-08T00:00:00Z');
        window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}};
        for(const key of ['inv-auth-seen','inv-pop','inv-app-x'])localStorage.setItem(key,'1');
        localStorage.setItem('inv-consent',JSON.stringify({version:1,date:new Date().toISOString(),preferences:false,images:false,analytics:false}));
      });
      const page=await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(url+'/'+route,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(1800);
      const actual=await page.evaluate(()=>({title:document.title,headings:[...document.querySelectorAll('h1,h2')].map(e=>e.textContent.trim()),overflow:document.documentElement.scrollWidth>innerWidth+1,canvas:!!document.querySelector('canvas'),links:[...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href').replace(location.origin,'LOCAL_ORIGIN'))}));
      // Labels are test-only overlays, never changes to page sources.
      await page.evaluate(text=>{const label=document.createElement('div');label.textContent=text;label.style.cssText='position:fixed;top:0;left:0;z-index:2147483647;background:#fff;color:#000;font:700 14px Arial;padding:7px 12px;pointer-events:none;border:2px solid #000';document.body.append(label);},`${label} | ${name} | ${width===390?'Phone':'PC'} ${width}px`);
      await page.screenshot({path:path.join(output,`${name}-${width}-${label.toLowerCase()}.png`)});
      versions.push({label,...actual,errors});
      await context.close();
    }
    // A1-A4: a separate assertion for each page, repeated at both required widths.
    assert.deepEqual(versions[1].headings,versions[0].headings,`${name}: heading contract`);
    assert.deepEqual(versions[1].links,versions[0].links,`${name}: navigation contract`);
    assert.equal(versions[1].title,versions[0].title,`${name}: title contract`);
    assert.equal(versions[1].overflow,versions[0].overflow,`${name}: overflow parity`);
    assert.deepEqual(versions[1].errors,versions[0].errors,`${name}: runtime parity`);
    if(name==='globe')assert(versions[1].canvas,'globe canvas exists');
    results.push({page:name,width,versions});
    console.log(`PASS ${name} ${width}px`);
  }
} finally {await browser.close();fs.writeFileSync(path.join(output,'comparison.json'),JSON.stringify(results,null,2));}
