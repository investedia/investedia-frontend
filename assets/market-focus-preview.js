/* M1 approved previews only. Existing homepage and price displays are untouched. */
(() => {
  'use strict';
  const MARKET_LINKS_ENABLED=false, RISING_ATTENTION_ENABLED=false;
  const $=s=>document.querySelector(s), hero=$('.hn-hero'), frame=$('#hnGlobe'), panel=$('#mf-panel');
  const params=new URLSearchParams(location.search), phone=()=>innerWidth<=900;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=url=>{if(typeof url!=='string'||!url.trim())return '#';try{const u=new URL(url,location.href);return /^https?:$/.test(u.protocol)?esc(u.href):'#';}catch{return '#';}};
  const age=at=>{const d=Math.max(0,Date.now()-Date.parse(at)),h=Math.floor(d/36e5);return h>=48?Math.floor(h/24)+' d ago':h?h+' h ago':Math.floor(d/6e4)+' min ago';};
  const regions={af:'Africa',asia:'Asia',eu:'Europe',na:'North America',latam:'Latin America',me:'Middle East',oc:'Oceania'};
  // Editorial prose uses words for non-price corporate percentages. Quoted
  // headlines stay exact; share/price/return statements are never reformatted.
  const prose=value=>{const s=String(value||'');return /\b(profit|revenue|earnings|output|sales|margin|underwriting|literacy)\b/i.test(s)&&!/\b(stock|shares?|prices?|returns?)\b/i.test(s)?s.replace(/(\d[\d.,]*)%/g,'$1 per cent'):s;};
  let data,exchanges,connections,articles,mode='markets',code=null,tab='overview',venue=null,connection=null,previousFocus,globeReady=false;
  const send=payload=>frame.contentWindow?.postMessage({type:'investedia-mode',...payload},location.origin);
  function occlusions(){
    const fr=frame.getBoundingClientRect();
    const boxes=['.hn-title b','.hn-title span','.hn-lead','.hn-search','.hn-pop','.hn-tick','.hn-mode-row','.hn-open',...(!panel.hidden?['#mf-panel']:[])].flatMap(s=>{
      const e=$(s);if(!e||getComputedStyle(e).visibility==='hidden')return [];
      const r=e.getBoundingClientRect();return [{x:r.left-fr.left,y:r.top-fr.top,w:r.width,h:r.height}];});
    send({occlusions:boxes});
  }
  function source(a){return `<div class="mf-source"><span class="mf-chip">${esc(a.category)}</span><a href="${safe(a.source?.url)}" target="_blank" rel="noopener">${esc(a.source?.name||'Source not in our data yet')} ↗</a><time datetime="${esc(a.published_at)}">· ${esc(age(a.published_at))}</time></div>`;}
  function article(a,leading=false){return `<article class="mf-article ${leading?'mf-leading':''}" data-article="${esc(a.id)}">${source(a)}<a class="mf-title" href="${safe(a.source?.url)}" target="_blank" rel="noopener">${esc(a.headline)}</a>${leading?`<p class="mf-why"><b>Why it may matter</b>${esc(prose(a.why))}</p>`:''}</article>`;}
  const action=(label,target)=>`<button type="button" class="mf-link-button" data-tab="${target}">${esc(label)} →</button>`;
  function sectors(c){return `<div class="mf-section-label">Sectors in focus</div>${c.sectors.length?`<div class="mf-sectors">${c.sectors.map(s=>`<span class="mf-sector">${esc(s.name)} · ${s.count}</span>`).join('')}</div>`:'<p class="mf-muted">No sectors named in recent developments yet.</p>'}`;}
  function overview(c,e){
    const ex=e?(e.name===e.short?e.name:e.name+' ('+e.short+')'):'Not in our exchange list yet',latest=c.developments[0],money=c.currency_facts;
    const currency=e?[money&&money.currency===e.currency?money.currency_name+' ('+e.currency+')':e.currency,e.central_bank_short||e.central_bank].filter(Boolean).join(' · '):money?money.currency_name+' ('+money.currency+')':'Not in our exchange list yet';
    const facts=`<div class="mf-facts"><div class="mf-fact"><small>Primary exchange</small><strong>${esc(ex)}</strong>${e?action('Financial centre','centre'):''}</div><div class="mf-fact"><small>Benchmark</small><strong>${esc(e?.benchmark_name||'No benchmark in our data yet')}</strong><small>Price not shown · no licensed feed</small></div><div class="mf-fact"><small>Currency · central bank</small><strong>${esc(currency)}</strong>${!e&&money?'<small>Central bank not in our data yet.</small>':''}</div></div>`;
    const reference=e?`<small>Exchange facts: ${e.website?`<a href="${safe(e.website)}" target="_blank" rel="noopener">${esc(e.short)} ↗</a>`:esc(e.short)} · <a href="${safe(e.coordinates.source)}" target="_blank" rel="noopener">GeoNames</a> city location · CC BY 4.0 · Reference update date not in our data yet.</small>`:'';
    const currencyReference=money?`<small>Currency reference: <a href="${safe(money.source)}" target="_blank" rel="noopener">${esc(money.attribution)}</a> · checked ${esc(money.checked_at)}</small>`:'';
    if(c.counts.articles_48h<=1)return facts+`<h3>Market Overview</h3><p class="mf-subtitle">The developments, industries and events shaping this market.</p><div class="mf-empty"><b>Limited coverage: ${c.counts.articles_48h} ${c.counts.articles_48h===1?'development':'developments'} in 48 h.</b><p>Not enough news to show sectors or attention. Here is what we have:</p></div><div class="mf-section-label">Latest significant development</div>${latest?article(latest,true):'<p>No developments in our data yet.</p>'}${action('Full '+c.name+' profile','structured')}<p class="mf-notice">Coverage: ${e?'Only the sourced developments above are shown.':'Exchange not yet in our list.'} Our analysis, not a forecast.</p>${code==='MY'?'<p class="mf-notice">Why no price? Price not shown · no licensed feed.</p>':''}${reference}${currencyReference}`;
    return facts+`<div class="mf-significant"><div class="mf-section-label">Latest significant development</div>${latest?article(latest):'<p>No developments in our data yet.</p>'}</div>
      ${action('Full '+c.name+' profile','structured')}
      ${code==='MY'?'<p class="mf-notice">Why no price? Price not shown · no licensed feed.</p>':''}
      <div class="mf-overview-extra"><h3>Market Overview</h3><p class="mf-subtitle">The developments, industries and events shaping this market.</p>
      ${c.developments.slice(1,3).map(a=>article(a)).join('')}
      ${action('All '+c.counts.articles_48h+' developments','structured')}
      <div class="mf-research-summary"><div><h3>Investments to Research</h3><p class="mf-subtitle">${c.investments.length} named in recent developments · ${c.investments.filter(i=>i.site).length} with an Investedia page</p></div>${action('Open','investments')}</div></div>${reference}${currencyReference}`;
  }
  function focus(c,structured=false){
    let html='<h3>Market Overview</h3><div class="mf-subtitle">The developments, industries and events shaping this market.</div><div class="mf-legend">● Reported: what the source says · ● Why it may matter: our analysis, not a forecast</div>';
    if(!c.developments.length)return html+'<p class="mf-empty">No developments in our data yet.</p>';
    if(structured){
      for(const group of ['Policy','Economic activity','Corporate','Energy & commodities','International impact']){
        const items=c.developments.filter(a=>a.category===group);if(!items.length)continue;
        html+=`<section data-group="${esc(group)}"><div class="mf-section-label">${esc(group)}</div>${items.slice(0,2).map(a=>article(a,true)).join('')}${(c.group_counts[group]||0)>2?`<button class="mf-link-button" data-all-group="${esc(group)}">All ${c.group_counts[group]} →</button>`:''}</section>`;
      }
      if(c.connections.length)html+=`<div class="mf-section-label">Verified international connections</div>${connectionList(c)}`;
    }else{
      html+='<div class="mf-section-label">Most significant</div>'+article(c.developments[0],true);
      if(c.developments.length>1)html+='<div class="mf-section-label">Also developing</div>'+c.developments.slice(1,4).map(a=>article(a)).join('');
      html+=action('All developments','structured');
    }
    return html+sectors(c)+'<p class="mf-notice"><b>Rising attention</b> needs a 28-day baseline of comparable coverage. It is not shown yet.</p>';
  }
  function investments(c,all=false){
    const rows=all?c.investments:c.investments.slice(0,phone()?3:5);
    return '<h3>Investments to Research</h3><p class="mf-subtitle">Companies named in this market’s recent developments. Not recommendations.</p>'+
      (rows.length?rows.map(i=>`<article class="mf-investment" data-registry-id="${esc(i.registry_id||'')}"><h3>${esc(i.name)}</h3><small>${i.registry_id?esc(i.ticker+' · '+i.mic):'Listing not verified'}</small>${source(i.evidence)}<p class="mf-why">Why it appears: named in “${esc(i.evidence.headline)}”</p><p class="mf-why"><b>Why it may matter</b>${esc(prose(i.evidence.why))}</p>${i.registry_id&&i.site?`<a class="mf-action" href="asset.html?s=${encodeURIComponent(i.site)}">Open ${esc(i.name)} page →</a>`:'<small>No Investedia asset page yet: not in our verified registry.</small>'}</article>`).join(''):'<p class="mf-empty">No companies named in recent developments. We will show sourced company mentions when they are in our data.</p>')+
      (!all&&c.investments.length>rows.length?action('All','investments-all'):'')+'<p class="mf-notice">Price performance is not shown: no licensed price feed. Appearing here is based on news, not on returns.</p>';
  }
  function connectionList(c){return c.connections.map(id=>connections.find(l=>l.id===id)).filter(Boolean).slice(0,phone()?3:5).map(l=>`<button class="mf-connection-button" data-connection="${esc(l.id)}">${esc(data.countries[l.origin.country]?.name||l.origin.country)} → ${esc(l.dest.name)}<br><small>${esc(l.evidence.headline)} · confidence ${esc(l.confidence)}</small></button>`).join('')||'<p class="mf-empty">No verified international connections in our data yet.</p>';}
  function connectionCard(l){
    const a=articles.find(a=>a.id===l.event),country=data.countries[l.origin.country]?.name||l.origin.country;
    return `<div class="mf-eyebrow">News-event link · ${esc(age(l.published_at))}</div><h2 id="mf-panel-title">${esc(country)} → ${esc(l.dest.name)}</h2><p class="mf-muted">${esc(l.origin.place)} · ${esc(l.origin.country)} → ${esc(l.dest.country)} · ${esc(l.type)} / ${esc(l.relation)}</p><div class="mf-section-label">Reported</div><p>${esc(l.evidence.headline)}</p><p class="mf-why"><b>Why it may matter</b>${esc(prose(l.evidence.why))}</p><div class="mf-source"><a href="${safe(a?.source.url)}" target="_blank" rel="noopener">${esc(l.evidence.source)} ↗</a><time datetime="${esc(l.published_at)}">${esc(new Date(l.published_at).toLocaleString('en-GB'))}</time> · confidence ${esc(l.confidence)}</div><p class="mf-notice">Our analysis, not a forecast · not a trade or investment statistic.</p>`;
  }
  function render(){
    if(!code||!data)return;
    const restorePanelFocus=panel.contains(document.activeElement);
    const c=data.countries[code],e=exchanges[venue||c.exchange];
    const chrome='<div class="mf-handle" aria-hidden="true"></div><button type="button" class="mf-close" aria-label="Close market">×</button>';
    panel.setAttribute('aria-modal',String(phone()));
    panel.classList.toggle('mf-compact',tab==='centre'||tab==='connection');
    let html;
    if(tab==='connection'&&connection){html=connectionCard(connections.find(l=>l.id===connection));}
    else if(tab==='centre'&&e){html=`<div class="mf-eyebrow">Financial centre · ${esc(e.city)}</div><h2 id="mf-panel-title">${esc(e.name===e.short?e.name:e.name+' ('+e.short+')')}</h2><p class="mf-muted">ISO MIC ${esc(venue||c.exchange)} · Benchmark ${esc(e.benchmark_name||'not in our data yet')} · Price not shown · no licensed feed</p><p class="mf-notice"><b>${c.counts.articles_48h}</b> developments in ${esc(c.name)} · 48 h</p><p class="mf-notice"><b>${c.investments.length}</b> companies named · ${c.investments.filter(i=>i.site).length} with an Investedia page</p>${action('Open '+c.name+' market','overview')}`;}
    else{
      html=`<div class="mf-eyebrow">${esc(regions[c.region]||'World')} · Country</div><h2 id="mf-panel-title"><img src="assets/globe/flags/${code.toLowerCase()}.svg" alt="">${esc(c.name)}</h2><div class="mf-tabs" role="tablist" aria-label="Market views">${[['overview','Facts'],['focus','Overview'],['structured','All developments'],['investments','Research'],['connections','Connections']].map(([key,label])=>`<button role="tab" type="button" data-tab="${key}" aria-selected="${tab===key||tab===key+'-all'}">${label}</button>`).join('')}</div>`;
      if(c.counts.articles_48h<=1&&tab!=='overview')html+=`<p class="mf-notice">Limited coverage: ${c.counts.articles_48h} ${c.counts.articles_48h===1?'development':'developments'} in 48 h. Coverage is uneven; article volume is not performance.</p>`;
      html+=tab==='overview'?overview(c,e):tab==='focus'?focus(c):tab==='structured'?focus(c,true):tab.startsWith('investments')?investments(c,tab.endsWith('-all')):connectionList(c);
    }
    panel.innerHTML=chrome+html+'<p class="mf-notice">AI-assisted analysis. Not investment advice.</p>';
    panel.hidden=false;document.body.classList.add('mf-panel-open');
    panel.querySelector('.mf-close').onclick=close;
    panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;panel.scrollTop=0;render();});
    panel.querySelectorAll('[data-connection]').forEach(b=>b.onclick=()=>openConnection(b.dataset.connection));
    panel.querySelectorAll('[data-all-group]').forEach(b=>b.onclick=()=>renderAllGroup(b.dataset.allGroup));
    const handle=panel.querySelector('.mf-handle');let start;
    handle.onpointerdown=e=>{start=e.clientY;handle.setPointerCapture(e.pointerId);};
    handle.onpointerup=e=>{if(start!==undefined&&e.clientY-start>35)close();start=undefined;};
    if(restorePanelFocus)(panel.querySelector('[role="tab"][aria-selected="true"]')||panel.querySelector('.mf-close')).focus({preventScroll:true});
    requestAnimationFrame(()=>{positionPhoneGlobe();occlusions();});
  }
  function renderAllGroup(group){
    const c=data.countries[code],raw=articles.filter(a=>a.location.country===c.name);
    // All uses the original source and the same event categorisation, never fabricated rows.
    const classify=a=>data.article_categories[a.id];
    const rows=raw.filter(a=>classify(a)===group).sort((a,b)=>b.published_at.localeCompare(a.published_at));
    panel.querySelectorAll('[data-group]').forEach(s=>{if(s.dataset.group===group)s.innerHTML=`<div class="mf-section-label">${esc(group)}</div>`+rows.map(a=>article({...a,category:group})).join('');});
    occlusions();
  }
  function open(nextCode,nextTab='overview',nextVenue=null){
    if(!data?.countries[nextCode])return;
    if(mode!=='markets'){mode='markets';hero.classList.add('hn-markets');document.querySelectorAll('[data-globe-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.globeMode===mode)));send({mode});}
    previousFocus=document.activeElement;code=nextCode;tab=nextTab;venue=nextVenue;connection=null;
    send({country:data.countries[code].name,exchange:venue});render();panel.scrollTop=0;panel.querySelector('.mf-close').focus({preventScroll:true});
  }
  function openConnection(id){const l=connections.find(l=>l.id===id);if(!l)return;code=code||l.origin.country;connection=id;tab='connection';render();send({connection:id});}
  function positionPhoneGlobe(){
    frame.style.transform='';
    if(!phone()||panel.hidden)return;
    const camera=frame.contentWindow.InvMarketGlobe?.state().camera;
    if(!camera)return;
    // The phone sheet reserves the upper screen for the globe, with the same
    // camera and radius. Desktop geometry is never changed.
    const center=($('.mf-header').getBoundingClientRect().bottom+panel.getBoundingClientRect().top)/2;
    frame.style.transform=`translateY(${center-frame.getBoundingClientRect().top-camera.cy}px)`;
  }
  function close(){code=null;connection=null;panel.hidden=true;frame.style.transform='';document.body.classList.remove('mf-panel-open');send({close:true});occlusions();previousFocus?.focus?.({preventScroll:true});}
  function headline(){
    const latest=[...articles].sort((a,b)=>(b.importance||1)-(a.importance||1)||Date.parse(b.published_at)-Date.parse(a.published_at))[0];
    if(!latest)return;
    $('#hnTick').innerHTML=`<a class="mf-headline" href="${safe(latest.source.url)}" target="_blank" rel="noopener" data-article="${esc(latest.id)}"><span class="mf-chip">${esc(data.article_categories[latest.id])}</span><span class="mf-headline-title">${esc(latest.location.country)} · ${esc(latest.headline)}</span><small>${esc(latest.source.name)} · ${esc(age(latest.published_at))}</small></a>`;
    $('#hnLive').innerHTML='<i></i>Updated '+esc(age(data.updated_at));
  }
  function place(){
    if(!data?.source_file)return;
    globeReady=false;
    let camera='cx=.7&cy=.5&r=.4';
    if(phone()){
      const hr=hero.getBoundingClientRect(),s=$('.hn-search').getBoundingClientRect(),pop=$('.hn-pop').getBoundingClientRect(),t=$('.hn-tick').getBoundingClientRect();
      const top=Math.max(s.bottom,pop.bottom)-hr.top,bot=t.top-hr.top,mid=(top+bot)/2,radius=Math.min(hr.width*.42,(bot-top)/2*1.02);
      camera=`cx=.5&cy=${(mid/hr.height).toFixed(4)}&r=${(radius/Math.min(hr.width,hr.height)).toFixed(4)}`;
    }
    frame.src='assets/globe/market-preview.html?embed=1&v='+encodeURIComponent($('meta[name="m1-build"]')?.content||'')+'&snapshot='+encodeURIComponent(data.source_file)+'&'+camera;
  }
  function search(){
    const dialog=$('#mf-search');dialog.showModal();$('#mf-query').focus();results('');
  }
  function results(query){
    if(!data)return;const q=query.trim().toLowerCase();
    const rows=Object.entries(data.countries).filter(([iso,c])=>[c.name,iso,...Object.values(exchanges).filter(e=>e.country===iso).flatMap(e=>[e.name,e.short,e.city])].some(v=>v.toLowerCase().includes(q))).slice(0,30);
    $('#mf-results').innerHTML=rows.map(([iso,c])=>`<button type="button" data-country="${iso}">${esc(c.name)} · ${c.counts.articles_48h} articles</button>`).join('')||'<p>No markets in our list match this search.</p>';
    $('#mf-results').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('#mf-search').close();open(b.dataset.country);});
  }
  async function load(){
    const read=u=>fetch(u,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(u);return r.json();});
    if(!data){panel.hidden=false;panel.innerHTML='<h2 id="mf-panel-title">Loading market developments…</h2><div class="mf-skeleton"></div><div class="mf-skeleton"></div><div class="mf-skeleton"></div>';}
    try{
      data=await read('assets/globe/market-focus.json');
      if(!/^market-focus-source-[a-f0-9]{12}\.json$/.test(data.source_file))throw Error('Invalid snapshot');
      const snapshot=await read('assets/globe/'+data.source_file);
      if(snapshot.updated_at!==data.updated_at)throw Error('Invalid snapshot date');
      exchanges=snapshot.exchanges;connections=snapshot.connections;articles=snapshot.articles;
      const byArticle=new Map(articles.map(a=>[a.id,a]));
      for(const c of Object.values(data.countries))for(const i of c.investments){
        const a=byArticle.get(i.evidence_article_id),impact=a?.impacts.find(p=>p.name===i.name&&['company','etf'].includes(p.kind));
        if(!a||!impact)throw Error('Preview evidence snapshot mismatch');
        i.evidence={article_id:a.id,headline:a.headline,source:a.source,published_at:a.published_at,why:impact.why||'',category:data.article_categories[a.id]};
      }
      headline();
      const suggestions=Object.entries(data.countries).filter(([,c])=>c.counts.articles_48h>0).sort((a,b)=>b[1].counts.articles_48h-a[1].counts.articles_48h).slice(0,5);
      $('#hnPop').innerHTML='<span class="hn-pop-l">Markets in focus:</span>'+suggestions.map(([iso,c])=>`<a href="#" data-market-suggestion="${iso}">${esc(c.name)}</a>`).join('');
      $('#hnPop').querySelectorAll('[data-market-suggestion]').forEach(a=>a.onclick=e=>{e.preventDefault();open(a.dataset.marketSuggestion);});
      place();
      if(params.get('country'))open(params.get('country'),params.get('view')||'overview',params.get('exchange'));
      else if(code)render();else panel.hidden=true;
      requestAnimationFrame(()=>{positionPhoneGlobe();occlusions();});
    }catch{showError();}
  }
  function showError(){globeReady=false;panel.innerHTML=`<h2 id="mf-panel-title">Couldn't load this market's developments. Try again.</h2><button id="mf-retry">Retry</button>`;panel.hidden=false;$('#mf-retry').onclick=load;}
  $('.hn-search').setAttribute('aria-haspopup','dialog');$('.hn-search').onclick=e=>{e.preventDefault();search();};
  $('.hn-open').href='#';$('.hn-open').setAttribute('aria-label','Explore markets');$('.hn-open').setAttribute('aria-haspopup','dialog');$('.hn-open .t').textContent='Explore markets';$('.hn-open').onclick=e=>{e.preventDefault();search();};
  $('#mf-query').oninput=e=>results(e.target.value);
  document.querySelectorAll('[data-globe-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.globeMode===mode));b.onclick=()=>{
    mode=b.dataset.globeMode;document.querySelectorAll('[data-globe-mode]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)));close();send({mode});
    hero.classList.toggle('hn-markets',mode==='markets');
  };});hero.classList.add('hn-markets');
  addEventListener('message',e=>{
    if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='investedia-market-preview')return;
    if(e.data.ready){globeReady=true;positionPhoneGlobe();occlusions();send({mode,...(code?{country:data.countries[code].name,exchange:venue,connection}:{} )});}
    if(e.data.error)showError();
    if(e.data.country&&data&&(e.data.country!==code||(e.data.venue||null)!==venue)){code=e.data.country;venue=e.data.venue||null;tab=venue?'centre':'overview';render();}
    if(e.data.connection)openConnection(e.data.connection);
    if(e.data.open===false&&!panel.hidden)close();
  });
  addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!panel.hidden)close();
    if(e.key==='Tab'&&!panel.hidden){const items=[...panel.querySelectorAll('button,a[href]')].filter(x=>x.offsetParent!==null),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  let previousWidth=innerWidth;
  addEventListener('resize',()=>{if(innerWidth!==previousWidth){previousWidth=innerWidth;place();}if(!panel.hidden&&code)render();occlusions();});
  window.InvMarketPreview={open,close,connection:openConnection,flags:{MARKET_LINKS_ENABLED,RISING_ATTENTION_ENABLED},state:()=>({ready:!!data&&globeReady,mode,code,tab,venue})};
  load();
})();
