(() => {
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const regions = {USD:['US','us'],EUR:['Euro area','eu'],GBP:['UK','gb'],JPY:['Japan','jp'],CNY:['China','cn'],CHF:['Switzerland','ch'],CAD:['Canada','ca'],AUD:['Australia','au'],other:['Others','']};
  // Markets shown for an event, by currency (all must exist in assets/globe/markets.json; missing ones are skipped).
  const WATCH = {USD:['^GSPC','^IXIC','EURUSD'],EUR:['EURUSD','^GDAXI','^STOXX50E'],GBP:['GBPUSD','^FTSE'],JPY:['USDJPY'],CNY:['USDCNY'],CHF:['USDCHF','^SSMI'],CAD:['USDCAD','^GSPTSE'],AUD:['AUDUSD'],NZD:['NZDUSD']};
  const PAIR = s => /^[A-Z]{6}$/.test(s) ? s.slice(0,3)+'/'+s.slice(3) : null;
  // Event title -> words that must appear in a related article.
  const TOPICS = [[/fomc|federal funds|\bfed\b/i,/\bfed\b|federal reserve|fomc|powell/i],[/ecb|refinancing|monetary policy statement/i,/\becb\b|european central bank|lagarde/i],[/\bboe\b|bank of england|\bmpc\b|official bank rate/i,/bank of england|\bboe\b/i],[/\bboj\b|bank of japan/i,/bank of japan|\bboj\b/i],[/gdp/i,/\bgdp\b|economic growth/i],[/cpi|inflation|pce|price index/i,/inflation|\bcpi\b|\bpce\b|consumer prices/i],[/employment|payroll|unemployment|job openings|jobs/i,/jobs|payroll|unemployment|labor market|employment/i]];
  const defaults = {date:'week',impact:'3',region:'',type:'economic',q:'',from:'',to:'',mine:'0'};
  let saved={};try{saved=JSON.parse(localStorage.getItem('inv-calendar-filters') || '{}');}catch{}
  const params=new URLSearchParams(location.search), state={...defaults,...saved};
  if(params.size)Object.assign(state,defaults,Object.fromEntries([...params].filter(([k])=>k in defaults)));
  if(location.hash === '#earnings')state.type='earnings';
  let rows=[], markets=[], stories=[], list=[], sel=-1;
  const phone=()=>matchMedia('(max-width:900px)').matches;
  const setOf=k=>state[k].split(',').filter(Boolean), selected=(k,v)=>setOf(k).includes(v);
  const chip=(k,v,t)=>`<button type="button" class="cal-chip" data-key="${k}" data-val="${v}" aria-pressed="${selected(k,v)}">${t}</button>`;
  const dayKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const bounds=()=>{const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);if(state.date==='tomorrow'){start.setDate(start.getDate()+1);end.setDate(end.getDate()+2);}else if(state.date==='today')end.setDate(end.getDate()+1);else if(state.date==='week'||state.date==='next'){const wk=start.getDay()===0||start.getDay()===6?7:0;start.setDate(start.getDate()-((start.getDay()+6)%7)+wk+(state.date==='next'?7:0));end.setTime(+start);end.setDate(end.getDate()+7);}else if(state.date==='custom'){return [state.from?new Date(state.from+'T00:00'):new Date(0),state.to?new Date(new Date(state.to+'T00:00').setDate(new Date(state.to+'T00:00').getDate()+1)):new Date(8640000000000000)];}else end.setDate(end.getDate()+30);return[start,end];};
  const persist=()=>{const p=new URLSearchParams();Object.entries(state).forEach(([k,v])=>{if(v!==defaults[k])p.set(k,v);});history.replaceState(null,'',location.pathname+(p.size?'?'+p:'') );try{localStorage.setItem('inv-calendar-filters',JSON.stringify(state));}catch{}};
  function controls(){
    $('cal-dates').innerHTML=[['today','Today'],['tomorrow','Tomorrow'],['week','This week'],['next','Next week'],['month','30 days'],['custom','Custom']].map(([v,t])=>chip('date',v,t)).join('');
    $('cal-high').setAttribute('aria-pressed',state.impact==='3');$('cal-earn').setAttribute('aria-pressed',selected('type','earnings'));
    $('cal-regions').innerHTML=chip('region','','All regions')+Object.entries(regions).map(([v,[t,f]])=>chip('region',v,`${f?`<img src="assets/globe/flags/${f}.svg" alt="">`:''}${t}`)).join('');
    $('cal-regions').firstElementChild.setAttribute('aria-pressed',state.region==='');
    const n=setOf('region').length;$('cal-region-btn').innerHTML=`${n===1?esc(regions[state.region]?.[0]||'Region'):n>1?n+' regions':'Region'} <span aria-hidden="true">▾</span>`;
    $('cal-search').value=state.q;$('cal-custom').hidden=state.date!=='custom';$('cal-from').value=state.from;$('cal-to').value=state.to;$('cal-mine').checked=state.mine==='1';$('cal-mine-label').hidden=!window.invUser;
  }
  const bars=n=>`<span class="cal-bars ${({3:'h',2:'m',1:'l'})[n]||''}" role="img" aria-label="${({3:'High',2:'Medium',1:'Low'})[n]||'No'} impact">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;
  const num=s=>{const m=String(s).replace(/,/g,'').match(/[-+]?\d*\.?\d+/);return m?Number(m[0]):NaN;};
  const arrow=e=>{const a=num(e.actual),f=num(e.fc);return Number.isFinite(a)&&Number.isFinite(f)?a>f?'↑ ':a<f?'↓ ':'↔ ':'';};
  const clock=(e,d)=>e.dateOnly?esc(e.when||'All day'):d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  const pct=v=>`<span class="cal-pct ${v>0?'up':v<0?'down':'flat'}">${v>0?'↑':v<0?'↓':'↔'} ${Math.abs(v).toFixed(2)}%</span>`;
  const left=ms=>{const m=Math.max(0,Math.ceil(ms/60000));const d=Math.floor(m/1440),h=Math.floor(m%1440/60);return d?`in ${d} d ${h} h`:h?`in ${h} h ${m%60} min`:m?`in ${m} min`:'now';};
  function paint(){controls();const [start,end]=bounds(), watch=window.INVWATCH?.all()||[], currencies=new Set(watch.flatMap(w=>{const a=markets.find(a=>a.s===w.s);return a?[a.cur,...(a.t==='fx'?a.s.match(/[A-Z]{3}/g)||[]:[])]:[];}));
    list=rows.filter(e=>{const t=new Date(e.at),region=regions[e.c]?e.c:'other';return t>=start&&t<end&&selected('type',e.type)&&(e.type==='earnings'||selected('impact',String(e.imp)))&&(!state.region||selected('region',region))&&(!state.q||e.t.toLocaleLowerCase().includes(state.q.toLocaleLowerCase()))&&(state.mine!=='1'||!!window.invUser&&currencies.has(e.c));}).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    $('cal-count').textContent=`${list.length} events · ${start.toLocaleDateString()} – ${new Date(+end-1).toLocaleDateString()}`;
    if(!list.some(e=>e.i===sel)){const nh=nextHigh(),up=list.find(e=>nh&&e.i===nh.i)||list.find(e=>e.type==='economic'&&e.imp===3&&Date.parse(e.at)>=Date.now()-60000)||list.find(e=>Date.parse(e.at)>=Date.now())||list[0];sel=up?up.i:-1;}
    const days=new Map();for(const e of list){const k=dayKey(new Date(e.at));(days.get(k)||days.set(k,[]).get(k)).push(e);}
    let body='';for(const [,es] of days){const d=new Date(es[0].at),hi=es.filter(e=>e.type==='economic'&&e.imp===3).length;body+=`<li><h2 class="cal-day">${d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})}${hi?` · ${hi} high-impact`:''}</h2><ul class="cal-list">`;
      for(const e of es){const d2=new Date(e.at),f=regions[e.c]?.[1],earn=e.type==='earnings';body+=`<li><button type="button" class="cal-row${d2<Date.now()?' past':''}" data-id="${e.i}" data-impact="${e.imp}" data-region="${esc(e.c)}" aria-pressed="${e.i===sel}"><span class="cal-time">${clock(e,d2)}</span><span class="cal-flag">${f?`<img src="assets/globe/flags/${f}.svg" alt="${esc(e.c)}">`:''}</span><span class="cal-name">${esc(e.t)}</span>${earn?'<span class="cal-bars" aria-hidden="true"></span>':bars(e.imp)}<span class="cal-nums"><span class="cal-num cal-fc">${e.fc?`${earn?'EPS ':'Fcst '}<b>${esc(e.fc)}</b>`:'—'}</span><span class="cal-num cal-pv">${e.prev?`Prev <b>${esc(e.prev)}</b>`:''}</span><span class="cal-num cal-ac cal-act">${e.actual?`Act <b>${arrow(e)}${esc(e.actual)}</b>`:''}</span></span></button></li>`;}
      body+='</ul></li>';}
    $('cal-results').innerHTML=list.length?`<ul class="cal-list" aria-label="Events by day">${body}</ul>`:'<p class="cal-empty">No scheduled events match these filters. Try another date or region.</p>';
    detail();countdown();
  }
  const AREA={USD:/united states|\bu\.?s\.?\b|america|wall street|\bfed\b|federal reserve/i,EUR:/euro|\becb\b|germany|france|italy|spain/i,GBP:/united kingdom|\buk\b|britain|bank of england/i,JPY:/japan|\bboj\b/i,CAD:/canada|\bboc\b/i,AUD:/australia|\brba\b/i,NZD:/new zealand|\brbnz\b/i,CHF:/switzerland|\bsnb\b|swiss/i,CNY:/china/i};
  function related(e){const t=TOPICS.find(([ev])=>ev.test(e.t)),area=AREA[e.c];if(!t||!area)return null;return stories.filter(s=>t[1].test(s.headline)&&(area.test(s.headline)||area.test(s.location?.country||''))).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at))[0]||null;}
  const MAJOR=['USD','EUR','GBP'],nextHigh=()=>{const up=rows.filter(e=>e.type==='economic'&&e.imp===3&&Date.parse(e.at)>Date.now()-60000).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));return up.find(e=>MAJOR.includes(e.c))||up[0];};
  function detail(){const box=$('cal-detail'),e=rows.find(r=>r.i===sel);if(!e){box.innerHTML='';box.classList.remove('open');return;}
    const d=new Date(e.at),earn=e.type==='earnings',names=(WATCH[e.c]||[]).map(s=>markets.find(a=>a.s===s)).filter(Boolean),art=related(e),f=regions[e.c]?.[0]||e.c;
    const when=d<Date.now()?'Released':left(d-Date.now());
    box.innerHTML=`<button type="button" class="cal-chip cal-close" id="cal-close">Close</button><div class="cal-ttl">Selected · ${d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})}${e.dateOnly?'':' · '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</div><h2>${esc(e.t)}</h2><div class="cal-sub">${esc(f)} · ${earn?'Earnings':({3:'High',2:'Medium',1:'Low'})[e.imp]+' impact'} · ${when}${e.src?` · Source: ${esc(e.src)}`:''}</div>
    <div class="cal-tri"><div><span>${earn?'EPS forecast':'Forecast'}</span><b>${esc(e.fc||'—')}</b></div><div><span>Previous</span><b>${esc(e.prev||'—')}</b></div><div><span>Actual</span><b>${e.actual?arrow(e)+esc(e.actual):'—'}</b></div></div>
    ${names.length?`<div class="cal-ttl">Watch these markets</div><div class="cal-mk">${names.map(a=>`<button type="button" data-s="${esc(a.s)}">${esc(PAIR(a.s)||a.n)} ${pct(a.d)}</button>`).join('')}</div>`:''}
    ${art?`<div class="cal-ttl">Latest related article</div><a class="cal-art" href="assets/globe/news.html?story=${encodeURIComponent(art.id)}">${esc(art.headline)}<small>${esc(art.source?.name||'')}</small></a>`:''}`;
    if(!phone())box.classList.remove('open');}
  function countdown(){const e=nextHigh();if(!e){$('cal-next').textContent='No upcoming high-impact release supplied by the current feed.';return;}$('cal-next').textContent=`Next high impact: ${e.t} · ${left(Date.parse(e.at)-Date.now())}`;}
  const closeMenu=()=>{$('cal-regions').hidden=true;$('cal-region-btn').setAttribute('aria-expanded','false');};
  $('cal-region-btn').onclick=()=>{const open=$('cal-regions').hidden;$('cal-regions').hidden=!open;$('cal-region-btn').setAttribute('aria-expanded',String(open));};
  document.addEventListener('click',e=>{if(!e.target.closest('.cal-menu'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('cal-regions').hidden){closeMenu();$('cal-region-btn').focus();}else if($('cal-detail').classList.contains('open'))$('cal-close')?.click();});
  document.querySelector('.cal-bar').addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(!b)return;const {key:k,val:v}=b.dataset;if(k==='date')state[k]=v;else if(k==='region'&&!v)state[k]='';else{const s=new Set(setOf(k));s.has(v)?s.delete(v):s.add(v);state[k]=[...s].join(',');}persist();paint();});
  $('cal-high').onclick=()=>{state.impact=state.impact==='3'?'1,2,3':'3';persist();paint();};
  $('cal-earn').onclick=()=>{const s=new Set(setOf('type'));s.has('earnings')?s.delete('earnings'):s.add('earnings');if(!s.size)s.add('economic');state.type=[...s].join(',');persist();paint();};
  for(const [id,k] of [['cal-search','q'],['cal-from','from'],['cal-to','to']])$(id).addEventListener('input',()=>{state[k]=$(id).value;persist();paint();});
  $('cal-mine').onchange=()=>{state.mine=$('cal-mine').checked?'1':'0';persist();paint();};$('cal-reset').onclick=()=>{Object.assign(state,defaults);persist();paint();};
  $('cal-results').addEventListener('click',e=>{const b=e.target.closest('.cal-row');if(!b)return;sel=Number(b.dataset.id);$('cal-results').querySelectorAll('.cal-row').forEach(r=>r.setAttribute('aria-pressed',String(r===b)));detail();if(phone()){$('cal-detail').classList.add('open');$('cal-close').focus();}});
  $('cal-detail').addEventListener('click',e=>{if(e.target.closest('#cal-close')){$('cal-detail').classList.remove('open');$('cal-results').querySelector(`.cal-row[data-id="${sel}"]`)?.focus();return;}const m=e.target.closest('[data-s]');if(m)window.InvPeek?InvPeek.open(m.dataset.s):location.href='asset.html?s='+encodeURIComponent(m.dataset.s);});
  $('cal-zone').textContent=`Times in ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  Promise.all([fetch('assets/calendar-live.json').then(r=>r.json()),fetch('assets/globe/markets.json').then(r=>r.json()),fetch('assets/globe/news-live.json').then(r=>r.json()).catch(()=>({stories:[]}))]).then(([data,m,n])=>{markets=m.assets||[];stories=n.stories||[];rows=[...(data.events||[]).map(e=>({...e,type:'economic'})),...(data.earnings||[]).map(e=>({...e,t:e.n+' earnings',c:e.c||'USD',at:e.at||e.date+'T12:00:00',dateOnly:!e.at,imp:0,fc:e.eps,type:'earnings'}))].map((e,i)=>({...e,i}));$('cal-source').textContent=`Sources: ${data.sources?.events || 'ForexFactory'} · ${data.sources?.earnings || 'Nasdaq'}. Updated ${new Date(data.updated_at).toLocaleString()}. Earnings dates without a published time show the supplied session.`;paint();}).catch(()=>{$('cal-results').textContent='Calendar data could not be loaded. Please try again.';});
  window.addEventListener('inv-user',paint);setInterval(countdown,30000);controls();
})();
