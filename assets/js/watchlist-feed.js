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
 // Redesign (owner 15 Nov 2026): news first. One card per followed item (latest article, 30-day counts, positive/negative), a small delayed price line,
 // filters (All, each item, Positive, Negative), impact label on each article and a side panel for the selected item. Prices are never the headline.
 function boot(){
  const root=document.getElementById('wf-root');if(!root)return;
  const st={articles:[],quotes:[],asof:null,sel:'all',tone:'all',loaded:false,error:false,hist:{}};
  const readFollows=()=>{try{return JSON.parse(localStorage.getItem('inv-follow')||'[]')}catch{return []}};
  const list=()=>items(window.INVWATCH?.all()||[],readFollows(),Object.fromEntries(st.quotes.map(q=>[symbol(q.s),q.n])));
  const D30=30*864e5,now=()=>Date.now();
  const tone=(a,item)=>{if(item.kind!=='asset')return null;const i=(a.impacts||[]).find(i=>[i.ticker,i.symbol].some(s=>s&&symbol(s)===item.key));return i?i.direction:null;};
  const quote=item=>item.kind==='asset'?st.quotes.find(q=>symbol(q.s)===item.key):null;
  const fdate=t=>new Date(t).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  const href=a=>'story.html?id='+encodeURIComponent(a.id);
  const STAR='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>';
  const logo=item=>item.kind==='country'?`<span class="wl-lg"><img src="assets/globe/flags/${esc((window.ISO_CC||{})[item.key]||'')}.svg" alt="" onerror="this.parentNode.textContent='${esc(item.name.slice(0,2).toUpperCase())}'"></span>`:(window.AssetIcons&&quote(item)?`<span class="wl-lg">${AssetIcons.icon(quote(item))}</span>`:`<span class="wl-lg wl-mono">${esc(item.key.slice(0,3))}</span>`);
  function stats(item){const arts=st.articles.filter(a=>now()-Date.parse(a.published_at)<=D30&&Date.parse(a.published_at)<=now()&&matches(a,item));const pos=arts.filter(a=>tone(a,item)==='up').length,neg=arts.filter(a=>tone(a,item)==='down').length;return {arts,pos,neg};}
  function card(item){const s=stats(item),l=s.arts[0],q=quote(item),on=st.sel===item.id;
   const px=q&&Number.isFinite(q.p)?`<div class="wl-px">${esc(new Intl.NumberFormat('en-US',{style:'currency',currency:q.cur||'USD',maximumFractionDigits:2}).format(q.p))} ${Number.isFinite(q.d)?`<span class="${q.d>0?'up':q.d<0?'dn':''}">${q.d>0?'+':q.d<0?'−':''}${Math.abs(q.d).toFixed(2)}%</span>`:''} · <span class="wl-dly">delayed price${st.asof?', '+new Date(st.asof).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):''}</span></div>`:'';
   return `<div class="wl-card${on?' on':''}" data-sel="${esc(item.id)}" role="button" tabindex="0" aria-pressed="${on}"><div class="wl-ch">${logo(item)}<div><b>${esc(item.name)}</b><small>${item.kind==='asset'?esc(item.key)+(q?.t==='stocks'?' · Stock':''):'Country'}</small></div><button type="button" class="wl-unf" data-unf="${esc(item.id)}" aria-label="Unfollow ${esc(item.name)}" title="Unfollow">${STAR}</button></div>
    ${l?`<a class="wl-latest" href="${href(l)}"><span>Latest · ${esc(fdate(l.published_at))}</span><b>${esc(l.headline)}</b></a>`:'<p class="wl-none">No articles in the last 30 days.</p>'}
    <div class="wl-cnt"><div><b>${s.arts.length}</b><small>articles, 30 days</small></div>${item.kind==='asset'?`<div><b class="up">${s.pos}</b><small>positive</small></div><div><b class="dn">${s.neg}</b><small>negative</small></div>`:''}</div>${px}</div>`;}
  function side(item){const s=stats(item),h=st.hist[item.key],q=quote(item);
   return `<aside class="wl-side"><h3>${esc(item.name)} this month</h3><div class="wl-kv"><span>Articles</span><b>${s.arts.length}</b></div>${item.kind==='asset'?`<div class="wl-kv"><span>Marked positive</span><b class="up">${s.pos}</b></div><div class="wl-kv"><span>Marked negative</span><b class="dn">${s.neg}</b></div>`:''}${h&&h.lo52&&h.hi52&&q?`<div class="wl-kv"><span>52-week range</span><b>${esc(new Intl.NumberFormat('en-US',{style:'currency',currency:q.cur||'USD',maximumFractionDigits:0}).format(h.lo52))} – ${esc(new Intl.NumberFormat('en-US',{style:'currency',currency:q.cur||'USD',maximumFractionDigits:0}).format(h.hi52))}</b></div>`:''}${h?.perf&&Number.isFinite(h.perf.YTD)?`<div class="wl-kv"><span>Year to date</span><b class="${h.perf.YTD>0?'up':'dn'}">${h.perf.YTD>0?'+':''}${h.perf.YTD.toFixed(1)}%</b></div>`:''}<p class="wl-na">Prices are delayed. Not investment advice.</p></aside>`;}
  function row(a,L){const rel=L.filter(i=>matches(a,i)),it=rel.find(i=>i.id===st.sel)||rel.find(i=>i.kind==='asset')||rel[0],t=it?tone(a,it):null,im=a.image?.file?`<a class="wl-th" href="${href(a)}" tabindex="-1" aria-hidden="true" style="background-image:url('assets/globe/${esc(a.image.file)}')"></a>`:'<span class="wl-th wl-th0"></span>';
   const pill=it&&it.kind==='asset'?(t==='up'?`<span class="wl-pill up">▲ Positive for ${esc(it.key)}</span>`:t==='down'?`<span class="wl-pill dn">▼ Negative for ${esc(it.key)}</span>`:'<span class="wl-pill">Impact unclear</span>'):(it?`<span class="wl-pill">${esc(it.name)}</span>`:'');
   return `<article class="wl-ar">${im}<div><p class="wl-eb">${esc((a.category||'News').replace(/_/g,' '))} · ${esc(fdate(a.published_at))}</p><h3><a href="${href(a)}">${esc(a.headline)}</a></h3><div class="wl-mt">${esc(a.source?.name||'')} ${pill}</div></div></article>`;}
  function render(){const L=list(),n=now();
   if(st.sel!=='all'&&!L.some(i=>i.id===st.sel))st.sel='all';
   if(!L.length){root.innerHTML=`<section class="wf-empty"><span class="wf-empty-mark" aria-hidden="true">＋</span><h2>Your feed starts with what you follow</h2><p>Tap ☆ on any asset or country to see its articles here.</p><a class="btn btn-primary" href="assets/globe/news.html">Explore the Globe ↗</a></section>`;return;}
   const all=st.articles.filter(a=>n-Date.parse(a.published_at)<=D30&&Date.parse(a.published_at)<=n&&L.some(i=>matches(a,i)));
   const sel=L.find(i=>i.id===st.sel),focus=sel||L.find(i=>i.kind==='asset')||L[0];
   let feed=sel?all.filter(a=>matches(a,sel)):all;
   if(st.tone!=='all')feed=feed.filter(a=>L.some(i=>matches(a,i)&&tone(a,i)===(st.tone==='pos'?'up':'down')));
   const hasAsset=L.some(i=>i.kind==='asset');
   root.innerHTML=`<section class="wl-head"><div><h1>My watchlist</h1><p>${L.length} ${L.length===1?'item':'items'} · ${all.length} ${all.length===1?'article':'articles'} in the last 30 days</p></div><a class="wl-add" href="assets/globe/news.html">＋ Add an asset or country</a></section>
    <div class="wl-cards">${L.map(card).join('')}${L.length<3?'<div class="wl-ghost">Follow more countries and assets to see them here.<br>Tap ☆ on any asset or country.</div>':''}</div>
    <div class="wl-g"><div><div class="wl-tabs" role="group" aria-label="Filter articles"><button type="button" data-f="all" aria-pressed="${st.sel==='all'&&st.tone==='all'}">All</button>${L.map(i=>`<button type="button" data-f="${esc(i.id)}" aria-pressed="${st.sel===i.id}">${esc(i.name)}</button>`).join('')}${hasAsset?`<button type="button" data-t="pos" aria-pressed="${st.tone==='pos'}">Positive</button><button type="button" data-t="neg" aria-pressed="${st.tone==='neg'}">Negative</button>`:''}</div>
    ${!st.loaded?'<p class="wf-message" role="status">Loading articles…</p>':st.error?'<p class="wf-message" role="status">Articles could not load. Please try again.</p>':feed.length?feed.slice(0,60).map(a=>row(a,L)).join(''):'<p class="wf-message">No articles match this filter in the last 30 days.</p>'}</div>${side(focus)}</div>`;
   root.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{st.sel=b.dataset.f;st.tone='all';render();});
   root.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{st.tone=st.tone===b.dataset.t?'all':b.dataset.t;render();});
   root.querySelectorAll('[data-sel]').forEach(c=>{c.onclick=e=>{if(e.target.closest('a,button'))return;st.sel=st.sel===c.dataset.sel?'all':c.dataset.sel;st.tone='all';render();};c.onkeydown=e=>{if(e.key==='Enter'&&e.target===c)c.click();};});
   root.querySelectorAll('[data-unf]').forEach(b=>b.onclick=e=>{e.stopPropagation();const item=L.find(i=>i.id===b.dataset.unf);if(!item)return;for(const en of item.entries)window.INVWATCH?.toggle(en);if(item.follows.length){try{localStorage.setItem('inv-follow',JSON.stringify(readFollows().filter(x=>!item.follows.includes(x))))}catch{}}render();});
   L.filter(i=>i.kind==='asset'&&!(i.key in st.hist)).forEach(i=>{st.hist[i.key]=null;fetch('assets/hist/'+encodeURIComponent(i.key.replace(/-USD$|=F$|^\^/g,''))+'.json').then(r=>r.ok?r.json():null).then(j=>{if(j){st.hist[i.key]=j;render();}}).catch(()=>{});});
  }
  async function load(){st.loaded=false;st.error=false;render();
   const res=await Promise.allSettled([window.InvNewsSource?window.InvNewsSource.load('assets/globe/news-live.json'):Promise.reject(),...['news-48h.json','news-archive.json'].map(f=>fetch('assets/globe/'+f,{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject()))]);
   const feeds=res.filter(r=>r.status==='fulfilled'&&Array.isArray(r.value?.stories)&&!r.value.demo).map(r=>r.value.stories);st.articles=merge(feeds);st.error=!feeds.length;st.loaded=true;render();}
  fetch('assets/globe/iso.json').then(r=>r.json()).then(j=>{window.ISO_CC=Object.fromEntries(Object.entries(j).map(([k,v])=>[country(k),String(v).toLowerCase()]));render();}).catch(()=>{});
  fetch('assets/globe/markets.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{st.quotes=Array.isArray(j?.assets)?j.assets:[];st.asof=j?.asof;render();}).catch(()=>{});
  window.INVWATCH?.on(render);addEventListener('inv-user',render);addEventListener('storage',e=>{if(['inv-watch','inv-follow',null].includes(e.key))render();});load();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
