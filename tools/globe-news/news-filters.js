// One set of controls is moved between the desktop column and phone Filters sheet.
var newsFilterPanel=document.createElement('section');newsFilterPanel.id='news-details-filters';newsFilterPanel.setAttribute('aria-label','Article filters');
function newsFilterUI(){
 const el=newsFilterPanel;if(!el)return;const wasOpen=el.querySelector('details')?.open,focused=el.contains(document.activeElement)?document.activeElement.dataset.newsFilter:null;
 const countries=[...new Set(stories.map(s=>s.location?.country).filter(Boolean))].sort((a,b)=>nm(a).localeCompare(nm(b))),limits=InvNewsFilters.bounds(T0,winMin());
 el.innerHTML=`<details${phone()||wasOpen?' open':''}><summary>Article filters${F.country||F.cat!=='all'||F.from||F.to?' · active':''}</summary><div class="news-filter-options"><label>Country<select data-news-filter="country"><option value="">All countries</option>${countries.map(c=>`<option value="${esc(c)}"${F.country===c?' selected':''}>${esc(nm(c))}</option>`).join('')}</select></label><label>Sector<select data-news-filter="cat">${CATS.map(([k,n])=>`<option value="${k}"${F.cat===k?' selected':''}>${esc(n)}</option>`).join('')}</select></label><div class="news-date-range"><label>From (UTC)<input type="date" data-news-filter="from" value="${esc(F.from)}" min="${limits.min}" max="${F.to||limits.max}"></label><label>To (UTC)<input type="date" data-news-filter="to" value="${esc(F.to)}" min="${F.from||limits.min}" max="${limits.max}"></label></div><p>Within the selected ${esc(F.win.toUpperCase())} window. Original publication dates.</p><button type="button" data-news-filter-clear>Clear country &amp; dates</button></div></details>`;
 el.querySelector('details').ontoggle=()=>{if(el.querySelector('details').open)closeGlobeMenus();};
 el.querySelectorAll('[data-news-filter]').forEach(input=>input.onchange=()=>{if(['from','to'].includes(input.dataset.newsFilter)&&input.value&&!InvNewsFilters.day(input.value))return;F[input.dataset.newsFilter]=input.value;Object.assign(F,InvNewsFilters.normalize(F,T0,winMin()));if(input.dataset.newsFilter==='cat')press($('cats'),F.cat);refresh();});
 el.querySelector('[data-news-filter-clear]').onclick=()=>{F.country=F.from=F.to='';refresh();};if(focused)el.querySelector(`[data-news-filter="${focused}"]`)?.focus({preventScroll:true});
 placeNewsFilters();
}
function placeNewsFilters(){const dest=phone()?$('fs-details'):$('lcol');if(dest&&newsFilterPanel.parentNode!==dest)phone()?dest.append(newsFilterPanel):dest.prepend(newsFilterPanel);}
addEventListener('resize',newsFilterUI);

addEventListener('click',e=>{const details=newsFilterPanel?.querySelector('details');if(!phone()&&details?.open&&!e.composedPath().includes(newsFilterPanel))details.open=false;});
addEventListener('keydown',e=>{const details=newsFilterPanel?.querySelector('details');if(e.key==='Escape'&&!phone()&&details?.open){details.open=false;details.querySelector('summary').focus();}});
