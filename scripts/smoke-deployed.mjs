// Public GET/browser checks only. No login, ingestion, credentials or deployments.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const pages=[['Home',''],['Globe','assets/globe/news.html'],['News','news.html'],['Profile','profile.html']];
const protectedPaths=['config.local.json','.env','AGENTS.md'];

function publicUrl(value){
 const url=new URL(value);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use an HTTP(S) base URL without credentials, query or fragment.');
 if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error('External targets require HTTPS.');
 if(!url.pathname.endsWith('/'))url.pathname+='/';
 return url.href;
}
function chromiumModule(){
 for(const name of [process.env.PLAYWRIGHT_MODULE,'playwright'].filter(Boolean)){
  try{return require(name).chromium;}catch{}
 }
 throw new Error('Install Playwright or set PLAYWRIGHT_MODULE to its installed module.');
}
export function printTable(rows){
 console.log('| Check | Result | Detail |\n|---|---|---|');
 for(const row of rows)console.log(`| ${row.check} | ${row.pass?'PASS':'FAIL'} | ${row.detail} |`);
}
export async function runSmoke({baseUrl,apiUrl,settleMs=1500,timeoutMs=20000,executablePath}={}){
 const base=publicUrl(baseUrl),rows=[];
 const chromium=chromiumModule();
 const executable=executablePath||process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(!fs.existsSync(chromium.executablePath())&&fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
 const launch={headless:true,args:['--enable-unsafe-swiftshader'],...(executable?{executablePath:executable}:{})};
 if(proxy)launch.proxy={server:proxy,bypass:process.env.NO_PROXY||process.env.no_proxy||''};
 const browser=await chromium.launch(launch);
 let discoveredApi='',homeBody='';
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900},serviceWorkers:'block'});
   try{
    for(const [name,path] of pages){
     const page=await context.newPage(),errors=[];
     page.on('pageerror',()=>errors.push('exception'));
     page.on('console',message=>{if(message.type()==='error')errors.push('console');});
     let detail='',pass=false;
     try{
      const response=await page.goto(new URL(path,base).href,{waitUntil:'load',timeout:timeoutMs});
      await page.waitForTimeout(settleMs);
      const metrics=await page.evaluate(()=>({
       overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>innerWidth+1,
       content:!!document.body?.innerText.trim(),
       title:document.title,marker:document.body?.dataset.page||'',
       api:window.INV_CONFIG?.apiBaseUrl||''
      }));
      if(name==='Home'&&!discoveredApi)discoveredApi=metrics.api;
      if(name==='Home'&&width===1440&&response?.ok()&&response.headers()['content-type']?.includes('text/html'))homeBody=await response.text();
      const identity=name==='Globe'?/investedia.*globe/i.test(metrics.title):/investedia/i.test(metrics.title)&&metrics.marker===name.toLowerCase();
      pass=!!response?.ok()&&response.headers()['content-type']?.includes('text/html')&&metrics.content&&identity&&!metrics.overflow&&!errors.length;
      detail=[`HTTP ${response?.status()??'none'}`,`${errors.length} console/runtime errors`,metrics.overflow?'horizontal overflow':'no overflow',metrics.content?'content present':'empty page',identity?'page identity matched':'wrong page/challenge/fallback'].join('; ');
     }catch{detail='Navigation failed or timed out; check target/network access.';}
     rows.push({check:`${name} ${width}px`,pass,detail});
     await page.close();
    }
   }finally{await context.close();}
  }
  const context=await browser.newContext();
  try{
   for(const path of protectedPaths){
    let pass=false,detail='Website/request unavailable; exposure could not be checked.';
    try{
     if(!homeBody)throw new Error('No successful website baseline');
     const response=await context.request.get(new URL(path,base).href,{timeout:timeoutMs});
     const body=await response.text();
     // Pages can route an unknown file to its SPA homepage; exact fallback is not a leaked file.
     const fallback=!!homeBody&&body===homeBody&&response.headers()['content-type']?.includes('text/html');
     pass=[403,404,410].includes(response.status())||response.ok()&&fallback;
     detail=`HTTP ${response.status()}${fallback?'; homepage fallback only':''}${pass?'':'; unexpected response, inspect privately'}`;
    }catch{}
    rows.push({check:`Not served: ${path}`,pass,detail});
   }
  }finally{await context.close();}
  let api='';
  try{if(apiUrl||discoveredApi)api=publicUrl(apiUrl||discoveredApi);}catch{}
  for(const route of ['v1/prices','v1/news']){
   let pass=false,detail='No valid Worker URL; configure runtime API or supply --api.';
   if(api){
    // Fetch in the browser from the website's origin: an HTTP response alone cannot prove CORS works.
    const context=await browser.newContext();const page=await context.newPage();
    try{
     await page.goto(base,{waitUntil:'domcontentloaded',timeout:timeoutMs});
     const result=await page.evaluate(async({url,timeout})=>{
      try{
       const response=await fetch(url,{signal:AbortSignal.timeout(timeout),credentials:'omit'});
       const body=await response.json();
       return {status:response.status,ok:response.ok,json:body,snapshot:response.headers.get('X-Inv-Source')==='repository-snapshot'};
      }catch{return {ok:false,status:null};}
     },{url:new URL(route,api).href,timeout:timeoutMs});
     const data=result.json?.data;
     const shape=route==='v1/news'?Array.isArray(data?.stories)&&data.stories.length>0:data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length>0;
     pass=!!result.ok&&!!shape&&!result.snapshot;
     detail=`HTTP ${result.status??'unavailable'}; ${pass?'JSON payload and browser CORS passed':'Worker payload/CORS check failed'}`;
    }catch{detail='Worker check failed or timed out; check target/network access.';}
    finally{await context.close();}
   }
   rows.push({check:`Worker /${route}`,pass,detail});
  }
 }finally{await browser.close();}
 return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const {values,positionals}=parseArgs({allowPositionals:true,options:{api:{type:'string'},'settle-ms':{type:'string'},'timeout-ms':{type:'string'}}});
  if(positionals.length!==1)throw new Error('Usage: node scripts/smoke-deployed.mjs https://investedia.com [--api https://WORKER]');
  const settleMs=Number(values['settle-ms']??1500),timeoutMs=Number(values['timeout-ms']??20000);
  if(!Number.isFinite(settleMs)||settleMs<0||!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new Error('Invalid timeout options.');
  const rows=await runSmoke({baseUrl:positionals[0],apiUrl:values.api,settleMs,timeoutMs});
  printTable(rows);process.exitCode=rows.every(row=>row.pass)?0:1;
 }catch(error){
  printTable([{check:'Smoke runner',pass:false,detail:error.message.startsWith('Usage:')?error.message:'Browser/setup failed; verify Playwright, Chromium, target URL and network access.'}]);process.exitCode=1;
 }
}
