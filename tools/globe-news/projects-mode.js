// Projects dashboard, built on Claude's supplied layout. Data lives in shared JSON.
const PROJ_START=new URLSearchParams(location.search).get('mode')==='projects';
const PROJ={on:false,sel:'line',tab:'overview',list:[],vis:[],hits:[],f:{c:'',t:'',s:'',w:false},sort:'relevance',n:30,phoneDetail:false,collapsed:false};
const PW=new Set((()=>{try{return JSON.parse(localStorage.getItem('inv-proj-watch')||'[]')}catch{return[]}})());
const pjArrow='<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M7 17L17 7M7 7h10v10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const pjStar=on=>`<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="1.4"/></svg>`;
const pjIcon=p=>`<svg class="pj-type-icon" viewBox="0 0 100 70" aria-hidden="true"><path d="M10 58h80M23 58V25l20-8v41m0-24h18v24m0-38h19v38M30 30v6m0 6v6m20-8v8m18-20v7m0 7v7" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;
const pjUrl=p=>p.sources?.find(x=>x.name==='Wikipedia')?.url||p.sources?.[0]?.url;
const pjStage=p=>p.stage||'Not stated';
const pjPhoto=p=>p.photo?.file?new URL(p.photo.file,new URL('assets/globe/',new URL('../../',location.href))).href:null;
function pjImage(p){const file=pjPhoto(p);return file?`<img src="${esc(file)}" alt="${esc(p.name)}" loading="lazy">`: `<span class="pji" aria-hidden="true">${pjIcon(p)}</span>`;}
function pjTag(stage){return stage?`<span class="pjt ${/operational|open|completed/i.test(stage)?'completed':/construction|progress/i.test(stage)?'progress':'planned'}">${esc(stage)}</span>`:'';}
function projAll(){
 if(!PROJ.ready){PROJ.ready=InvProjectsData.load().then(data=>{PROJ.list=data.projects;PROJ.curation=data.curation;PROJ.error=false;if(PROJ.on)projRender();}).catch(()=>{PROJ.ready=null;PROJ.error=true;if(PROJ.on)projRender();});}
 return PROJ.list;
}
function projFiltered(){
 const f=PROJ.f,q=(PROJ.q||'').trim().toLowerCase();let list=projAll().filter(p=>(!f.c||p.country===f.c)&&(!f.t||p.type===f.t)&&(!f.s||pjStage(p)===f.s)&&(!f.w||PW.has(p.id))&&(!q||[p.name,p.location,p.country,p.type,p.developer].some(x=>String(x||'').toLowerCase().includes(q))));
 return list.sort((a,b)=>PROJ.sort==='name'?a.name.localeCompare(b.name):PROJ.sort==='recent'?(Number(b.start_year)||0)-(Number(a.start_year)||0)||a.name.localeCompare(b.name):(Number(b.featured)-Number(a.featured))||a.name.localeCompare(b.name));
}
function projPick(id,fly=true){PROJ.sel=id;PROJ.tab='overview';PROJ.phoneDetail=phone();PROJ.collapsed=false;const p=PROJ.list.find(x=>x.id===id);if(fly&&p)flyTo(p.lon,p.lat,Math.max(1,Zt));projRender();}
function pjMilestones(p){
 if(!p.milestones?.length)return '<p class="pj-empty">No dated milestones have been verified for this project.</p>';
 return `<ol class="pj-timeline">${[...p.milestones].sort((a,b)=>a.date.localeCompare(b.date)).map(m=>{const status=InvProjectsData.milestoneStatus(m);return `<li class="${status==='Completed'?'completed':status==='In progress'?'progress':'planned'}"><div><b>${esc(m.title)}</b><time>${esc(m.label||m.date)}</time><a href="${esc(m.source.url)}" target="_blank" rel="noopener">${esc(m.source.name||'Source')} ${pjArrow}</a></div>${status?pjTag(status):''}</li>`;}).join('')}</ol>`;
}
function pjFacts(p){
 const figures=(p.figures||[]).filter(x=>x.source?.url);
 const facts=[{label:'Country',value:p.country},{label:'Type',value:p.type},...(p.start_year?[{label:'Started · Wikidata',value:p.start_year}]:[]),...figures];
 return `<dl class="pjk">${facts.map(f=>`<div><dd>${esc(String(f.value))}${f.unit?` ${esc(f.unit)}`:''}</dd><dt>${esc(f.label)}</dt>${f.source?`<a href="${esc(f.source.url)}" target="_blank" rel="noopener">Source ${pjArrow}</a>`:''}</div>`).join('')}</dl>`;
}
function projRender(){
 const all=projAll(),list=projFiltered();PROJ.vis=list;
 if(list.length&&!list.some(p=>p.id===PROJ.sel))PROJ.sel=list[0].id;
 const p=list.find(p=>p.id===PROJ.sel),ls=$('pjList'),detail=$('projPanel');
 document.documentElement.classList.toggle('proj-detail-open',phone()&&PROJ.phoneDetail&&!!p);document.documentElement.classList.toggle('proj-collapsed',PROJ.collapsed);
 const opt=(key,label,values)=>`<label><span class="sr-only">${label}</span><select data-pf="${key}" aria-label="${label}"><option value="">${label}</option>${[...new Set(values.filter(Boolean))].sort().map(v=>`<option value="${esc(v)}"${PROJ.f[key]===v?' selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
 ls.innerHTML=`<button type="button" class="pj-sheet-handle" data-pj-collapse aria-label="${PROJ.collapsed?'Expand':'Collapse'} projects list"><span></span></button><div class="pjl-h"><h2>Projects</h2><p>Global real estate &amp; infrastructure developments</p></div><label class="pj-search"><span class="sr-only">Search projects</span><input class="pjq" type="search" placeholder="Search projects, locations, developers…" value="${esc(PROJ.q||'')}"></label><div class="pj-f"><button type="button" data-pw-only aria-pressed="${PROJ.f.w}">${PROJ.f.w?'Watching':'All projects'} <span aria-hidden="true">▾</span></button>${opt('c','Country',all.map(p=>p.country))}${opt('t','Type',all.map(p=>p.type))}${opt('s','Stage',all.map(pjStage))}</div><div class="pjl-n"><span>${list.length} projects</span><label>Sort: <select data-pj-sort aria-label="Sort projects">${[['relevance','Relevance'],['name','Name'],['recent','Start year']].map(([key,label])=>`<option value="${key}"${key===PROJ.sort?' selected':''}>${label}</option>`).join('')}</select></label></div><div class="pjl-list">${list.slice(0,PROJ.n).map(p=>`<article class="pjr${p.id===PROJ.sel?' on':''}"><button type="button" class="pj-pick" data-pj="${esc(p.id)}">${pjImage(p)}<span><b>${esc(p.name)}</b><small>${esc(p.country)}</small><span class="pj-row-tags"><span class="pjt">${esc(p.type)}</span>${pjTag(p.stage)}</span></span></button><button type="button" class="pjw" data-pw="${esc(p.id)}" aria-label="${PW.has(p.id)?'Remove '+esc(p.name)+' from':'Add '+esc(p.name)+' to'} watchlist" aria-pressed="${PW.has(p.id)}">${pjStar(PW.has(p.id))}</button></article>`).join('')||`<p class="pj-empty">${PROJ.error?'Projects could not load. Please try again.':PROJ.ready&&all.length===0?'Loading projects…':'No projects match these filters.'}</p>`}${list.length>PROJ.n?'<button type="button" class="pjmore" data-pjmore>Load more projects</button>':''}</div>`;
 const costs=list.filter(p=>p.cost?.source?.url&&Number.isFinite(p.cost.value)&&p.cost.currency==='USD'),milestones=list.filter(p=>p.milestones?.length);
 $('pjStats').innerHTML=`<div><b>${list.length.toLocaleString()}</b><small>Projects</small></div><div><b>${costs.length?'$'+costs.reduce((sum,p)=>sum+p.cost.value,0).toLocaleString('en-US'):milestones.length}</b><small>${costs.length?`Disclosed value · ${costs.length} projects`:'With sourced milestones'}</small></div><div><b>${new Set(list.map(p=>p.country)).size}</b><small>Countries</small></div><div><b>${new Set(list.map(p=>p.type)).size}</b><small>Project types</small></div>`;
 bindProjectControls(ls);
 if(!p){detail.innerHTML='<p class="pj-empty">Select a project to see its sources.</p>';return;}
 const source=pjUrl(p),tabs=[['overview','Overview'],['milestones','Milestones'],['details','Details'],['sources','Sources']];
 let body=PROJ.tab==='overview'?`${p.description?`<p class="pj-description">${esc(p.description)}</p>`:''}${pjFacts(p)}<h3>Project timeline</h3>${pjMilestones(p)}`:PROJ.tab==='milestones'?`<h3>Dated milestones</h3>${pjMilestones(p)}`:PROJ.tab==='details'?`${pjFacts(p)}<dl class="pj-details"><dt>Map location</dt><dd>${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}</dd>${p.wikidata_id?`<dt>Wikidata</dt><dd>${esc(p.wikidata_id)}</dd>`:''}</dl><p class="pj-note">Coordinates identify the project's reported location, not its boundary. Unverified cost, population and target figures are not shown.</p>`:`<h3>Sources &amp; credits</h3><ul class="pj-sources">${p.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ${pjArrow}</a>${s.checked_at?`<small>Source check: ${esc(s.checked_at)}</small>`:''}</li>`).join('')}${p.photo?`<li><a href="${esc(p.photo.source_url)}" target="_blank" rel="noopener">Photo: ${esc(p.photo.author)} ${pjArrow}</a><small>${esc(p.photo.licence)} · Wikimedia Commons</small></li>`:''}</ul><p class="pj-note">Wikidata structured data: CC0. Milestones retain their individual sources and original date precision. No sample figures are published.</p>`;
 detail.innerHTML=`<button type="button" class="pj-back" data-pj-back>‹ Back to projects</button>${p.photo?`<div class="pjh">${pjImage(p)}<a href="${esc(p.photo.source_url)}" target="_blank" rel="noopener">Image: ${esc(p.photo.author)} · ${esc(p.photo.licence)}</a></div>`:`<div class="pjh pjh-icon">${pjIcon(p)}<span>${esc(p.type)} · location from Wikidata</span></div>`}<div class="pjd"><h2>${esc(p.name)}</h2><div class="pj-detail-meta"><span>${esc(p.country)}</span><span class="pjt">${esc(p.type)}</span>${pjTag(p.stage)}</div><div class="pj-tabs" role="tablist" aria-label="Project details">${tabs.map(([key,label])=>`<button type="button" role="tab" id="pj-tab-${key}" aria-controls="pj-tab-body" data-pjtab="${key}" aria-selected="${key===PROJ.tab}" tabindex="${key===PROJ.tab?0:-1}">${label}</button>`).join('')}</div><div class="pj-detail-body" id="pj-tab-body" role="tabpanel" aria-labelledby="pj-tab-${PROJ.tab}">${body}</div><p class="pj-note">Product preview · not a working feature yet. Watchlist stays on this device. Not investment advice.</p></div><div class="pjb"><button type="button" data-pw="${esc(p.id)}" aria-pressed="${PW.has(p.id)}">${pjStar(PW.has(p.id))} ${PW.has(p.id)?'Following':'Follow'}</button>${source?`<a class="pjgo" href="${esc(source)}" target="_blank" rel="noopener">Sources ${pjArrow}</a>`:''}</div>`;
 {const pb=detail.querySelector('.pjb'),pm=detail.querySelector('.pj-detail-meta');if(pb&&pm&&innerWidth>760)pm.after(pb);}
 bindProjectControls(detail);requestAnimationFrame(size);
}
function bindProjectControls(el){
 el.querySelectorAll('[data-pj]').forEach(b=>b.onclick=()=>projPick(b.dataset.pj));
 el.querySelectorAll('[data-pw]').forEach(b=>b.onclick=()=>{const key=b.dataset.pw;PW.has(key)?PW.delete(key):PW.add(key);try{localStorage.setItem('inv-proj-watch',JSON.stringify([...PW]))}catch{}projRender();});
 el.querySelectorAll('[data-pjtab]').forEach(b=>{b.onclick=()=>{PROJ.tab=b.dataset.pjtab;projRender();$('projPanel').querySelector(`[data-pjtab="${PROJ.tab}"]`)?.focus({preventScroll:true});};b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...el.querySelectorAll('[data-pjtab]')],i=tabs.indexOf(b);tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length].click();};});
 const input=el.querySelector('.pjq');if(input)input.oninput=()=>{PROJ.q=input.value;PROJ.n=30;const pos=input.selectionStart;projRender();const next=$('pjList').querySelector('.pjq');next.focus({preventScroll:true});next.setSelectionRange(pos,pos);};
 el.querySelectorAll('[data-pf]').forEach(b=>b.onchange=()=>{PROJ.f[b.dataset.pf]=b.value;PROJ.n=30;projRender();});
 const sort=el.querySelector('[data-pj-sort]');if(sort)sort.onchange=()=>{PROJ.sort=sort.value;projRender();};
 const watch=el.querySelector('[data-pw-only]');if(watch)watch.onclick=()=>{PROJ.f.w=!PROJ.f.w;projRender();};
 const more=el.querySelector('[data-pjmore]');if(more)more.onclick=()=>{const scroll=$('pjList').querySelector('.pjl-list').scrollTop;PROJ.n+=30;projRender();$('pjList').querySelector('.pjl-list').scrollTop=scroll;};
 const back=el.querySelector('[data-pj-back]');if(back)back.onclick=()=>{PROJ.phoneDetail=false;PROJ.collapsed=false;projRender();};
 const handle=el.querySelector('[data-pj-collapse]');if(handle){handle.onclick=()=>{PROJ.collapsed=!PROJ.collapsed;projRender();};let y;handle.onpointerdown=e=>{y=e.clientY;handle.setPointerCapture(e.pointerId);};handle.onpointerup=e=>{if(y!=null&&Math.abs(e.clientY-y)>40){PROJ.collapsed=e.clientY>y;projRender();}y=null;};}
}
function projectTopbar(){
 const bar=$('project-topbar');bar.innerHTML='<a class="pj-brand" href="../../index.html" aria-label="Investedia home">Invested<span class="pj-i">i</span>a</a><nav aria-label="Site"><a href="news.html" data-proj-news>Globe</a><a href="../../news.html">News</a><a href="../../markets.html">Markets</a><a href="../../pricing.html">Pricing</a></nav><label><span class="sr-only">Search projects</span><input type="search" placeholder="Search projects, countries…" aria-label="Search projects and countries"></label>';
 bar.querySelector('[data-proj-news]').onclick=e=>{e.preventDefault();projSet(false,{mode:'news'});marketSetMode('news');};
 bar.querySelector('input').oninput=e=>{PROJ.q=e.target.value;PROJ.n=30;projRender();};
}
projectTopbar();
const projectSwitchHome=document.createComment('Globe switch home');$('gswitch').before(projectSwitchHome);
function projSet(on,options={}){
 const was=PROJ.on;if(on&&!was){PROJ.previousPhone=phoneView;setSheet('closed');PROJ.savedCamera=[lon0,lat0,Zt];PROJ.phoneDetail=false;PROJ.collapsed=false;}
 const wide=innerWidth>760;if(!wide){if(on)$('project-topbar').after($('gswitch'));else projectSwitchHome.after($('gswitch'));}
 PROJ.on=on;const html=document.documentElement;html.classList.toggle('proj-mode',on);$('projPanel').hidden=!on;$('project-topbar').hidden=!on||wide;$('project-mode-subtitle').hidden=!on||wide;const qi=$('q');if(on){qi.placeholder='Search projects or places';qi.value=PROJ.q||'';$('res').hidden=true;}else if(was){qi.value='';qi.placeholder=MARKET.on?'Search countries, exchanges, indices & companies':'Search assets, countries & articles';}
 if(on){if(MARKET.on)marketSetMode('news');phoneView='projects';hideHover();if(phone()&&!was){PROJ.collapsed=true;PROJ.phoneDetail=false;}projRender();}
 else if(was){html.classList.remove('proj-detail-open','proj-collapsed');phoneView=options.mode==='markets'?'markets':PROJ.previousPhone==='projects'?'globe':PROJ.previousPhone||'globe';if(PROJ.savedCamera)flyTo(...PROJ.savedCamera);}
 const u=new URL(location.href);if(on)u.searchParams.set('mode','projects');else if(was){if(options.mode==='markets')u.searchParams.set('mode','markets');else u.searchParams.delete('mode');}
 if(was!==on){if(options.history===false)history.replaceState(null,'',u);else history.pushState(null,'',u);}
 document.querySelectorAll('#gswitch button').forEach(b=>b.setAttribute('aria-pressed',String(on?b.dataset.m==='projects':b.dataset.m===(options.mode==='markets'?'markets':MARKET.on?'markets':'news'))));
 $('peek').hidden=on||phoneView!=='globe';projTop();dockUpdate();requestAnimationFrame(size);
}
addEventListener('popstate',()=>{const mode=new URL(location.href).searchParams.get('mode');projSet(mode==='projects',{history:false,mode});if(mode!=='projects')marketSetMode(mode);});
addEventListener('resize',()=>{if(PROJ.on)projRender();});
const projectDock=document.createElement('button');projectDock.type='button';projectDock.dataset.v='projects';projectDock.textContent='Projects';$('dock').append(projectDock);
function drawProj(){
 PROJ.hits=[];
 const visible=InvProjectsCluster.project(PROJ.vis||[],{lon:lon0,lat:lat0,cx,cy,radius:R,width:W,height:H});
 // Owner choice (11 Nov 2026): every project is its own dot, no grouping.
 const singles=visible.map(n=>({p:n.p,x:n.x,y:n.y}));
 const co=[],boxes=[];for(const {p,x,y,group} of singles){const selected=p.id===PROJ.sel,r=selected?5.5:p.featured?4:2.5;ctx.beginPath();ctx.arc(x,y,r*2.6,0,7);ctx.fillStyle=selected?'rgba(255,122,26,.25)':'rgba(255,122,26,.08)';ctx.fill();ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle='#ff7a1a';ctx.fill();PROJ.hits.push({x,y,id:p.id,group});
  if(!group&&(['kx','noor','line'].includes(p.id)||selected))co.push({p,x,y,selected});}
 for(const {p,x,y,selected} of co){{const title=p.id==='kx'?"King's Cross":p.id==='noor'?'Noor Ouarzazate':p.name;ctx.font='600 11.5px Inter,sans-serif';let w=Math.min(230,Math.max(ctx.measureText(title).width,ctx.measureText(p.country).width)+22),h=43,l=Math.min((phone()?W:globeBox.right+20)-w-8,Math.max(8,x+12)),t=Math.min(H-100,Math.max(65,y-22));for(let k=0;k<6&&boxes.some(b=>l<b.l+b.w+4&&l+w+4>b.l&&t<b.t+b.h+4&&t+h+4>b.t);k++)t+=h+6;boxes.push({l,t,w,h});ctx.beginPath();ctx.roundRect(l,t,w,h,10);ctx.fillStyle=DAY?'rgba(255,255,255,.96)':'rgba(12,12,14,.96)';ctx.strokeStyle=selected?'#ff7a1a':DAY?'#d5d5d9':'#2a2a2f';ctx.fill();ctx.stroke();ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle=DAY?'#1d1d1f':'#eee';ctx.fillText(title.length>30?title.slice(0,29)+'…':title,l+10,t+17);ctx.font='10px Inter,sans-serif';ctx.fillStyle=DAY?'#52525b':'#a1a1aa';ctx.fillText(p.country,l+10,t+33);PROJ.hits.push({x:l+w/2,y:t+h/2,id:p.id,rect:{l,t,w,h}});}}
 ctx.textAlign='left';ctx.textBaseline='alphabetic';
}
function projTap(x,y){const h=PROJ.hits.find(h=>h.rect&&x>=h.rect.l&&x<=h.rect.l+h.rect.w&&y>=h.rect.t&&y<=h.rect.t+h.rect.h)||[...PROJ.hits].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).find(h=>Math.hypot(h.x-x,h.y-y)<16);if(!h)return;if(h.group){const n=h.group.reduce((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)<Math.hypot(b.x-h.x,b.y-h.y)?a:b);flyTo(n.p.lon,n.p.lat,Math.min(ZMAX,Zt*1.7));}else projPick(h.id);}

// shared top-left search drives the project list on PC
$('q').addEventListener('input',e=>{if(!PROJ.on)return;e.stopImmediatePropagation();PROJ.q=e.target.value;PROJ.n=30;projRender();},true);
function projTop(){if(PROJ.on)$('q').placeholder='Search projects or places';const b=$('sbox').getBoundingClientRect();document.documentElement.style.setProperty('--pj-top',(b.bottom+12)+'px');}
addEventListener('resize',projTop);
