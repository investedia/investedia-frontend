// First-party language packs. No third-party scripts, toolbar, or per-visitor translation requests.
(() => {
 'use strict';
 const root=new URL('locales/',document.currentScript.src),languages=['en','fr','nl','de','es','it','pt'];
 const skip='script,style,noscript,svg,canvas,code,pre,.brand,[translate="no"],[data-i18n-skip],.ftr-lang,.csel-menu';
 const originals=new WeakMap(),attributes=new WeakMap(),packs=new Map();
 let language='en',strings={},observer,busy=false,request=0,titleSource=document.title,titleOutput=document.title;
 const normalize=s=>s.replace(/\s+/g,' ').trim();
 const translate=s=>{
  const key=normalize(s);let value=Object.hasOwn(strings,key)?strings[key]:null;
  if(value===null&&language!=='en'){
   const updated=/^Updated (.+)$/.exec(key),relative=/^(\d+)\s*(min(?:utes?)?|m|hours?|h|days?|d) ago$/.exec(updated?updated[1]:key);
   if(relative){const unit=relative[2][0]==='m'?'minute':relative[2][0]==='h'?'hour':'day';value=new Intl.RelativeTimeFormat(language,{numeric:'auto'}).format(-Number(relative[1]),unit);}
   else if(updated&&updated[1]==='just now')value=new Intl.RelativeTimeFormat(language,{numeric:'auto'}).format(0,'second');
   if(value!==null&&updated)value=(strings.Updated||'Updated')+' '+value;
  }
  return value===null?s:s.match(/^\s*/)[0]+value+s.match(/\s*$/)[0];
 };
 function text(node){
  if(!node.parentElement||node.parentElement.closest(skip+',textarea,input,[contenteditable=true]'))return;
  let item=originals.get(node);
  if(!item||node.data!==item.output)item={source:node.data,output:node.data};
  item.output=translate(item.source);originals.set(node,item);
  if(node.data!==item.output)node.data=item.output;
 }
 function element(el){
  if(el.closest(skip))return;
  let saved=attributes.get(el)||{};
  for(const name of ['title','placeholder','aria-label','alt'])if(el.hasAttribute(name)){
   const current=el.getAttribute(name),old=saved[name];
   const source=old&&current===old.output?old.source:current;
   const output=translate(source);saved[name]={source,output};
   if(current!==output)el.setAttribute(name,output);
  }
  attributes.set(el,saved);
 }
 function apply(){
  if(!document.body||busy)return;busy=true;observer?.disconnect();
  try{
   if(document.title!==titleOutput)titleSource=document.title;
   titleOutput=translate(titleSource);if(document.title!==titleOutput)document.title=titleOutput;
   element(document.body);
   const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
   let node;while(node=walk.nextNode())if(node.nodeType===3)text(node);else element(node);
   document.documentElement.lang=language;
  }finally{busy=false;observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});}
 }
 let queued=false;
 function schedule(){if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;apply();});}}
 async function setLanguage(next,{remember=true}={}){
  if(!languages.includes(next))throw Error('Unsupported language');
  if(next===language)return;
  const ticket=++request;let dictionary={};
  if(next!=='en'){
   if(!packs.has(next)){
    const response=await fetch(new URL(next+'.json',root));
    if(!response.ok)throw Error('Language pack unavailable');
    const pack=await response.json();
    if(pack.language!==next||!pack.strings||typeof pack.strings!=='object'||Array.isArray(pack.strings)||Object.values(pack.strings).some(v=>typeof v!=='string'))throw Error('Invalid language pack');
    packs.set(next,pack.strings);
   }
   dictionary=packs.get(next);
  }
  if(ticket!==request)return;
  language=next;strings=dictionary;
  if(remember)document.cookie='inv-lang='+next+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
  apply();window.dispatchEvent(new CustomEvent('inv-language-change',{detail:{language}}));
  for(const frame of document.querySelectorAll('iframe'))frame.contentWindow?.postMessage({type:'investedia-language',language},location.origin);
 }
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='investedia-language'&&languages.includes(event.data.language))setLanguage(event.data.language,{remember:false}).catch(()=>{});});
 window.InvLocale={setLanguage,get language(){return language},normalize};
 function start(){
  observer=new MutationObserver(schedule);apply();
  const cookie=document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('inv-lang='));
  const saved=cookie?.slice('inv-lang='.length);
  if(languages.includes(saved)&&saved!=='en')setLanguage(saved,{remember:false}).catch(()=>window.dispatchEvent(new CustomEvent('inv-language-error')));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
