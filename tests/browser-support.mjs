import {createRequire} from 'node:module';
import fs from 'node:fs';
export const require=createRequire(import.meta.url);
let pw;
for(const path of [process.env.PLAYWRIGHT_MODULE,'playwright','/usr/local/lib/node_modules/omniroute/node_modules/playwright'].filter(Boolean)){try{pw=require(path);break;}catch{}}
if(!pw)throw new Error('Install Playwright as a development dependency or set PLAYWRIGHT_MODULE.');
export const chromium=pw.chromium;
export const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8767';
export function launch(){const opts={headless:true,args:['--enable-unsafe-swiftshader','--hide-scrollbars']};
 if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)opts.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
 else if(!fs.existsSync(chromium.executablePath())&&fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'))opts.executablePath='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 return chromium.launch(opts);}
// Network fixtures isolate audit runs from external outages and never send test analytics.
// Requests are recorded before fulfillment: this tests gates, not provider availability.
export async function fixtureExternal(context){await context.route('https://**/*',async route=>{const u=new URL(route.request().url());
 if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
 if(u.hostname==='cdn.brandfetch.io')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="white"/></svg>'});
 if(u.hostname.endsWith('.supabase.co')&&u.pathname==='/rest/v1/events')return route.fulfill({status:201,contentType:'application/json',body:'[]',headers:{'access-control-allow-origin':'*'}});
 if(u.hostname==='investedia-live.adonaykabeya10.workers.dev')return route.fulfill({contentType:'application/json',body:'{"p":{}}',headers:{'access-control-allow-origin':'*'}});
 if(u.hostname==='api.coinbase.com')return route.fulfill({contentType:'application/json',body:'{"data":{"rates":{"EUR":"0.92"}}}'});
 return route.continue();});}
export const widths=[1440,390];
export const viewport=w=>({width:w,height:w===390?844:900});
