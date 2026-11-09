import fs from 'node:fs';
import {pageSources} from './page-sources.mjs';
import {launch} from '../tests/browser-support.mjs';
const strings=new Set(),b=await launch();
try{const context=await b.newContext({serviceWorkers:'block'});await context.route('https://**/*',r=>r.abort());
const p=await context.newPage();
for(const {name} of pageSources()){
 await p.goto('http://127.0.0.1:8771/'+name,{waitUntil:'domcontentloaded'});await p.waitForTimeout(250);
 for(const frame of p.frames())try{for(const text of await frame.evaluate(()=>{const out=[document.title],skip='script,style,noscript,svg,canvas,code,pre,.brand,[translate=no],[data-i18n-skip],input,textarea';const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())if(!n.parentElement?.closest(skip))out.push(n.data);for(const e of document.querySelectorAll('[title],[placeholder],[aria-label],[alt]'))if(!e.closest('script,style,noscript,svg,canvas,code,pre,.brand,[translate=no],[data-i18n-skip]'))for(const a of ['title','placeholder','aria-label','alt'])if(e.hasAttribute(a))out.push(e.getAttribute(a));return out;}))strings.add(text.replace(/\s+/g,' ').trim());}catch{}
}
/*
for(const file of ['assets/globe/news-live.json','assets/globe/news-archive.json']){
 const visit=v=>{if(typeof v==='string')strings.add(v.replace(/\s+/g,' ').trim());else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))if(!/^(id|url|link|image|photo|time|published|ticker|symbol|source|iso|country_code)$/i.test(k))visit(x);};visit(JSON.parse(fs.readFileSync(file)));
}
*/
const result=[...strings].filter(s=>s.length>1&&s.length<3000&&/[a-zA-Z]{2}/.test(s)&&!/^https?:|^[\w.-]+@[\w.-]+$|^[A-Z0-9._:^=-]{1,15}$/.test(s)).sort();
fs.writeFileSync('assets/locales/source.json',JSON.stringify(result,null,2)+'\n');console.log(result.length,'strings',result.join('').length,'characters');await context.close();}finally{await b.close();}
