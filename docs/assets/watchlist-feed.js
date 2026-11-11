// Design C: one sourced article feed. Reuses inv-watch / inv-follow and existing account mutations.
(()=>{
 'use strict';
 const aliases={'united states of america':'united states','us':'united states','usa':'united states','uk':'united kingdom','czech rep.':'czechia','czech republic':'czechia','dem. rep. congo':'dr congo','democratic republic of the congo':'dr congo'};
 const country=v=>{const s=String(v||'').trim().toLowerCase();return aliases[s]||s;};
 const symbol=v=>String(v||'').trim().toUpperCase();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function items(watch,follow,names={}){
  const map=new Map();
  for(const entry of watch||[]){if(!entry||!['asset','country'].includes(entry.kind))continue;const k=entry.kind==='country'?country(entry.k):symbol(entry.s);if(!k)continue;const id=entry.kind+':'+k;
   if(!map.has(id))map.set(id,{id,kind:entry.kind,key:k,name:entry.kind==='country'?aliases[String(entry.k).toLowerCase()]?k.replace(/\b\w/g,c=>c.toUpperCase()):entry.k:entry.n||names[k]||entry.s,entries:[],follows:[]});map.get(id).entries.push(entry);}
  for(const name of Array.isArray(follow)?follow:[]){if(typeof name!=='string'||!name.trim())continue;const k=country(name),id='country:'+k;if(!map.has(id))map.set(id,{id,kind:'country',key:k,name:aliases[name.toLowerCase()]?k.replace(/\b\w/g,c=>c.toUpperCase()):name,entries:[],follows:[]});map.get(id).follows.push(name);}
  return [...map.values()];
 }
 function matches(article,item){
  if(item.kind==='country')return country(article.location?.country)===item.key;
  const refs=[...(article.impacts||[]),...(article.entities||[]),...(article.historicalAssets||[])];
  return refs.some(r=>[r.ticker,r.symbol,r.sym,r.asset?.px,r.asset?.ticker,r.asset?.symbol].some(s=>s&&symbol(s)===item.key));
 }
 function merge(feeds){const seen=new Set(),urls=new Set(),out=[];for(const feed of feeds)for(const a of feed||[]){if(!a?.id||!a.headline||!Number.isFinite(Date.parse(a.published_at)))continue;let url;try{const u=new URL(a.source?.url);u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/.test(key))u.searchParams.delete(key);url=u.href;}catch{}if(seen.has(a.id)||url&&urls.has(url))continue;seen.add(a.id);if(url)urls.add(url);out.push(a);}return out.sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));}
 const eligible=(a,now)=>Date.parse(a.published_at)<=now;
 const recent=(a,now)=>eligible(a,now)&&now-Date.parse(a.published_at)<=864e5;
 function move(item,quotes,asof,now){const t=Date.parse(asof);if(item.kind!=='asset'||!Number.isFinite(t)||t>now||new Date(t).toDateString()!==new Date(now).toDateString())return null;const a=quotes.find(a=>symbol(a.s)===item.key);return a&&typeof a.d==='number'&&Number.isFinite(a.d)&&typeof a.p==='number'&&Number.isFinite(a.p)&&a.p>0?a.d:null;}
 function groupLabel(at,now){const d=new Date(at),today=new Date(now),yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);return d.toDateString()===today.toDateString()?'Today':d.toDateString()===yesterday.toDateString()?'Yesterday':d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:d.getFullYear()===today.getFullYear()?undefined:'numeric'});}
 window.InvWatchFeed={items,matches,merge,recent,move,groupLabel};
 function boot(){
  const content=document.getElementById('wf-content');if(!content)return;
  const state={articles:[],quotes:[],asof:null,selected:'all',loaded:false,error:false};
  const readFollows=()=>{try{return JSON.parse(localStorage.getItem('inv-follow')||'[]')}catch{return []}};
  const allItems=()=>items(window.INVWATCH?.all()||[],readFollows(),Object.fromEntries(state.quotes.map(q=>[symbol(q.s),q.n])));
  const pill=value=>value===null?'':`<span class="wf-move ${value>0?'positive':value<0?'negative':'neutral'}"><i aria-hidden="true">${value>0?'↑':value<0?'↓':'↔'}</i>${Math.abs(value).toFixed(2)}%</span>`;
  function image(a){const file=a.image?.file;if(file){try{const u=new URL(file,new URL('assets/globe/',location.href));if(u.origin===location.origin&&u.pathname.startsWith('/assets/'))return `<img src="${esc(u.href)}" alt="${esc(a.image.alt||'Article illustration')}" title="${esc([a.image.credit,a.image.license].filter(Boolean).join(' · '))}" loading="lazy">`;}catch{}}
   return '<span class="wf-image-fallback" aria-hidden="true"><svg viewBox="0 0 32 24"><path d="M4 4h24v16H4zM8 8h7v8H8zm11 0h5m-5 4h5m-5 4h5" fill="none" stroke="currentColor"/></svg></span>';}
  function row(a,list,now){const related=list.filter(item=>matches(a,item)),item=related.find(i=>i.id===state.selected)||related.find(i=>i.kind==='asset')||related[0],minutes=Math.floor((now-Date.parse(a.published_at))/60000),time=minutes<1?'Just now':minutes<60?minutes+'m ago':minutes<1440?Math.floor(minutes/60)+'h ago':new Date(a.published_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
   return `<article class="wf-article"><a class="wf-thumb" href="assets/globe/news.html?story=${encodeURIComponent(a.id)}" tabindex="-1" aria-hidden="true">${image(a)}</a><div class="wf-copy"><p class="wf-category">${esc((a.category||'News').replace(/_/g,' '))} <span>· <time datetime="${esc(a.published_at)}">${esc(time)}</time></span></p><h3><a href="assets/globe/news.html?story=${encodeURIComponent(a.id)}">${esc(a.headline)}</a></h3><p class="wf-source">${esc(a.source?.name||'Source')}${item?` <span>· ${esc(item.name)}</span> ${pill(move(item,state.quotes,state.asof,now))}`:''}</p></div></article>`;}
  function render(){const list=allItems(),now=Date.now(),matched=state.articles.filter(a=>eligible(a,now)&&list.some(i=>matches(a,i))),newCount=matched.filter(a=>recent(a,now)).length;
   if(state.selected!=='all'&&!list.some(i=>i.id===state.selected))state.selected='all';
   document.getElementById('wf-summary').textContent=list.length&&(!state.loaded||state.error)?state.error?'Articles are currently unavailable.':'Loading articles about what you follow…':`${newCount} new ${newCount===1?'article':'articles'} about what you follow`;
   document.getElementById('wf-empty').hidden=!!list.length;document.getElementById('wf-layout').hidden=!list.length;
   const filters=document.getElementById('wf-filters');filters.innerHTML=`<div class="wf-filter-wrap${state.selected==='all'?' active':''}"><button type="button" class="wf-filter" data-wf-select="all" aria-pressed="${state.selected==='all'}"><span>All</span><small>${newCount}</small></button></div>`+list.map(i=>`<div class="wf-filter-wrap${state.selected===i.id?' active':''}"><button type="button" class="wf-filter" data-wf-select="${esc(i.id)}" aria-pressed="${state.selected===i.id}"><span>${esc(i.name)}${i.kind==='asset'?`<small>${esc(i.key)}</small>`:''}</span>${i.kind==='country'?`<small>${state.articles.filter(a=>recent(a,now)&&matches(a,i)).length}</small>`:pill(move(i,state.quotes,state.asof,now))}</button><button class="wf-unfollow" type="button" data-wf-remove="${esc(i.id)}" aria-label="Unfollow ${esc(i.name)}">×</button></div>`).join('');
   const selected=list.find(i=>i.id===state.selected),visible=selected?matched.filter(a=>matches(a,selected)):matched;content.setAttribute('aria-busy',String(!state.loaded));
   if(!state.loaded)content.innerHTML='<p class="wf-message" role="status">Loading articles…</p>';
   else if(state.error)content.innerHTML='<p class="wf-message" role="status">Articles could not load. Please try again.</p><button type="button" class="btn btn-ghost" data-wf-retry>Try again</button>';
   else if(!visible.length)content.innerHTML='<p class="wf-message">No articles about these followed items in the loaded feed yet.</p>';
   else{let day='';content.innerHTML=visible.map(a=>{const key=new Date(a.published_at).toDateString(),heading=key!==day?`<h2 class="wf-day">${esc(groupLabel(a.published_at,now))}</h2>`:'';day=key;return heading+row(a,list,now);}).join('');}
   filters.querySelectorAll('[data-wf-select]').forEach(b=>b.onclick=()=>{state.selected=b.dataset.wfSelect;render();filters.querySelector(`[data-wf-select="${CSS.escape(state.selected)}"]`)?.focus({preventScroll:true});});
   filters.querySelectorAll('[data-wf-remove]').forEach(b=>b.onclick=()=>{const item=list.find(i=>i.id===b.dataset.wfRemove);if(!item)return;for(const entry of item.entries)window.INVWATCH?.toggle(entry);if(item.follows.length){try{localStorage.setItem('inv-follow',JSON.stringify(readFollows().filter(n=>!item.follows.includes(n))))}catch{content.innerHTML='<p class="wf-message">Your follow could not be removed. Please try again.</p>';return;}}render();filters.querySelector(`[data-wf-select="${CSS.escape(state.selected)}"]`)?.focus({preventScroll:true});});
   content.querySelector('[data-wf-retry]')?.addEventListener('click',load);
  }
  async function load(){state.loaded=false;state.error=false;render();const news=await Promise.allSettled([window.InvNewsSource.load('assets/globe/news-live.json'),fetch('assets/globe/news-48h.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Saved feed unavailable');return r.json().then(j=>{if(!Array.isArray(j.stories)||j.demo)throw Error('Invalid saved feed');return j;});})]);const feeds=news.filter(r=>r.status==='fulfilled').map(r=>r.value.stories||[]);state.articles=merge(feeds);state.error=!feeds.length;state.loaded=true;render();}
  fetch('assets/globe/markets.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{state.quotes=Array.isArray(j?.assets)?j.assets:[];state.asof=j?.asof;render();}).catch(()=>{});
  window.INVWATCH?.on(render);addEventListener('inv-user',render);addEventListener('storage',e=>{if(['inv-watch','inv-follow',null].includes(e.key))render();});setInterval(render,60000);load();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
