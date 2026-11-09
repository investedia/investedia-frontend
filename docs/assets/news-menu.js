// Shared news navigation. Local marks require no third-party image requests.
window.InvNewsMenu = (() => {
  const paths = {
    economy:'<path d="m4 9 8-5 8 5H4Zm1 12h14M7 11v7m5-7v7m5-7v7"/>',
    oil:'<path d="M8 4h8c3 5 3 11 0 16H8C5 15 5 9 8 4ZM6 8h12M6 16h12"/>',
    chip:'<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',
    health:'<rect x="4" y="6" width="16" height="15" rx="3"/><path d="M8 6V3h8v3m-4 5v6m-3-3h6"/>',
    consumer:'<path d="M6 8h12l2 13H4L6 8Zm3 0V6a3 3 0 0 1 6 0v2"/>',
    industry:'<path d="M3 21V9l6 4V8l6 4V3h5v18H3Zm3-4h2m3 0h2m3 0h2"/>',
    bond:'<path d="M6 3h9l4 4v14H6V3Zm9 0v5h4M9 12h7m-7 4h5"/>'
  };
  const svg = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key] || paths.economy}</svg>`;
  const groups = {
    companies:['TSLA.svg','AAPL.svg','AMZN.png'], technology:['MSFT.svg','GOOGL.svg','NVDA.svg'],
    crypto:['ETH.svg','BTC.svg','SOL.svg'], stocks:['TSLA.svg','AAPL.svg','AMZN.png'], energy:['ENB.png','SHEL.svg','CVX.png'],
    indices:['MSFT.svg','AAPL.svg','NVDA.svg'], bonds:['flag:de','flag:us','flag:jp'], currencies:['flag:gb','flag:us','flag:eu'],
    europe:['flag:fr','flag:de','flag:gb'], northamerica:['flag:ca','flag:us','flag:mx'], asia:['flag:au','flag:jp','flag:in'],
    middleeast:['flag:ae','flag:sa','flag:il'], africa:['flag:ng','flag:za','flag:eg'], latinamerica:['flag:mx','flag:br','flag:ar']
  };
  function mark(key){
    const members=groups[key];
    if(members)return `<span class="nn-icon nn-cluster" aria-hidden="true">${members.map(m=>/^flag:/.test(m)?`<img class="nn-fl" src="assets/globe/flags/${m.slice(5)}.svg" alt="" loading="lazy">`:/\.(svg|png)$/.test(m)?`<img src="assets/logos/${m}" alt="" loading="lazy">`:paths[m]?`<span class="nn-mini">${svg(m)}</span>`:`<span class="nn-mini nn-symbol">${m}</span>`).join('')}</span>`;
    return `<span class="nn-icon" aria-hidden="true">${svg(key)}</span>`;
  }
  const items = {
    Assets:[['Stocks','stocks','asset','stocks'],['Indices','indices','asset','indices'],['Oil & energy','energy','asset','energy'],['Bonds','bonds','asset','bonds'],['Currencies','currencies','asset','currencies'],['Crypto','crypto','asset','crypto']],
    Sectors:[['Technology','chip','sector','technology'],['Energy','oil','sector','energy'],['Financials','economy','sector','financials'],['Healthcare','health','sector','healthcare'],['Consumer','consumer','sector','consumer'],['Industrials','industry','sector','industrials']],
    Geography:[['Europe','europe','region','Europe'],['North America','northamerica','region','North America'],['Asia-Pacific','asia','region','Asia-Pacific'],['Middle East','middleeast','region','Middle East'],['Africa','africa','region','Africa'],['Latin America','latinamerica','region','Latin America']]
  };
  const PH = { Assets: 'Search assets, companies, tickers', Sectors: 'Search sectors', Geography: 'Search a country or region' };
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const defaultItems = group => group === 'Sectors' && window.InvSectors
    ? InvSectors.list.slice(0, 6).map(x => `<a class="nn-item" href="news.html?sector=${encodeURIComponent(x.slug)}"><span class="nn-icon nn-sec">${InvSectors.icon(x.name)}</span><span>${x.name}</span></a>`).join('')
    : items[group].map(([label,key,param,value])=>`<a class="nn-item" href="news.html?${param}=${encodeURIComponent(value)}">${mark(key)}<span>${label}</span></a>`).join('');
  const content = (group, id = 'nn') => `<div class="nn-search"><span class="nn-si">${searchIcon}</span><input class="nn-q" type="search" placeholder="${PH[group]}" aria-label="${PH[group]}" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="${id}-res" data-group="${group}"></div><div class="nn-default"><div class="nn-items">${defaultItems(group)}</div></div><div class="nn-results" id="${id}-res" role="listbox" aria-label="Results" hidden></div>`;
  function html(id,initial='Assets'){return `<div class="nn-menu" data-news-menu><div class="nn-categories" role="group" aria-label="News filters" style="--i:${Math.max(0,Object.keys(items).indexOf(initial))}"><span class="nn-pill" aria-hidden="true"></span>${Object.keys(items).map(g=>`<button type="button" data-news-group="${g}" aria-pressed="${g===initial}" aria-controls="${id}">${g}</button>`).join('')}</div><div class="nn-content" id="${id}" data-group="${initial}">${content(initial, id)}</div><div class="nn-foot"><span>Browse financial news</span><a href="news.html">All news →</a></div></div>`;}
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(root, group) {
    const cats = root.querySelector('.nn-categories'), box = root.querySelector('.nn-content'), btns = [...root.querySelectorAll('[data-news-group]')];
    btns.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.newsGroup === group)));
    cats.style.setProperty('--i', btns.findIndex(t => t.dataset.newsGroup === group));
    if (box.dataset.group === group) return;
    const swap = () => { box.innerHTML = content(group, box.id); box.dataset.group = group; box.classList.remove('nn-out'); };
    if (reduce()) return swap();
    box.classList.add('nn-out'); clearTimeout(box._t); box._t = setTimeout(swap, 110);
  }
  // Hover (pointer devices): a stable hover on a group tab switches the panel without a click.
  let hoverT;
  document.addEventListener('mouseover', e => { const b = e.target.closest('[data-news-group]'); if (!b || !matchMedia('(hover:hover)').matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => show(b.closest('[data-news-menu]'), b.dataset.newsGroup), 40); });
  document.addEventListener('mouseout', e => { if (e.target.closest('[data-news-group]')) clearTimeout(hoverT); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-news-group]'); if (b) show(b.closest('[data-news-menu]'), b.dataset.newsGroup); });
  // Local search data, loaded once on first use.
  let DATA = null;
  const load = () => DATA || (DATA = Promise.all([fetch('assets/globe/markets.json').then(r => r.json()).catch(() => ({ assets: [] })), fetch('assets/globe/news-prices.json').then(r => r.json()).catch(() => ({ assets: {} })), fetch('assets/globe/logos.json').then(r => r.json()).catch(() => ({})), fetch('assets/globe/iso.json').then(r => r.json()).catch(() => ({}))]).then(([m, np, logos, iso]) => {
    const seen = new Set(), assets = [];
    for (const a of [...(m.assets || []), ...Object.values(np.assets || {})]) if (a && a.s && !seen.has(a.s)) { seen.add(a.s); assets.push(a); }
    return { assets, logos, iso };
  }));
  const REGIONS = [['Europe', 'europe'], ['North America', 'northamerica'], ['Asia-Pacific', 'asia'], ['Middle East', 'middleeast'], ['Africa', 'africa'], ['Latin America', 'latinamerica']];
  const initialTile = n => `<span class="nn-icon nn-ini" aria-hidden="true">${esc(String(n).trim()[0] || '?').toUpperCase()}</span>`;
  const hl = (t, q) => { const i = norm(t).indexOf(q); return i < 0 || !q ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
  async function results(group, q) {
    const d = await load(), nq = norm(q), out = [];
    const rank = (label, extra = '') => { const l = norm(label); const i = l.indexOf(nq); const j = norm(extra).indexOf(nq); return i === 0 ? 0 : (l.split(/[\s.&-]+/).some(w => w.startsWith(nq)) ? 1 : (i > 0 || j >= 0 ? 2 : -1)); };
    if (group === 'Assets') {
      for (const a of d.assets) { const r = rank(a.n, a.s.replace(/[=^-]/g, '')); if (r >= 0) out.push([r, a.n.length, { label: a.n, sub: a.s.replace(/=F$/, '').replace(/=X$/, '') + ' · ' + ({ stocks: 'Stock', crypto: 'Crypto', cmd: 'Commodity', fx: 'Currency' }[a.t] || a.t), href: `news.html?asset=${encodeURIComponent(a.s)}`, mark: (d.logos[a.s.replace(/-USD$/, '')] ? `<span class="nn-icon nn-lg"><img src="assets/globe/${esc(d.logos[a.s.replace(/-USD$/, '')])}" alt="" loading="lazy"></span>` : (a.cc ? `<span class="nn-icon nn-lg"><img class="nn-fl" src="assets/globe/flags/${esc(a.cc)}.svg" alt="" loading="lazy"></span>` : initialTile(a.n))) }]); }
    } else if (group === 'Sectors') {
      for (const x of (window.InvSectors ? InvSectors.list : [])) { const r = rank(x.name); if (r >= 0) out.push([r, x.name.length, { label: x.name, sub: 'Sector', href: `news.html?sector=${encodeURIComponent(x.slug)}`, mark: `<span class="nn-icon nn-sec">${InvSectors.icon(x.name)}</span>` }]); }
    } else {
      for (const [name, key] of REGIONS) { const r = rank(name); if (r >= 0) out.push([r, name.length, { label: name, sub: 'Region', href: `news.html?region=${encodeURIComponent(name)}`, mark: mark(key) }]); }
      for (const [name, c] of Object.entries(d.iso)) { const r = rank(name); if (r >= 0 && !/\bIs\.$/.test(name)) out.push([r + .5, name.length, { label: name === 'United States of America' ? 'United States' : name, sub: 'Country', href: `news.html?country=${encodeURIComponent(name)}`, mark: `<span class="nn-icon nn-lg"><img class="nn-fl" src="assets/globe/flags/${c.toLowerCase()}.svg" alt="" loading="lazy"></span>` }]); }
    }
    return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 6).map(x => x[2]);
  }
  document.addEventListener('input', async e => {
    const inp = e.target.closest('.nn-q'); if (!inp) return;
    const box = inp.closest('.nn-content'), res = box.querySelector('.nn-results'), def = box.querySelector('.nn-default'), q = norm(inp.value.trim());
    if (!q) { res.hidden = true; def.hidden = false; inp.setAttribute('aria-expanded', 'false'); return; }
    const list = await results(inp.dataset.group, q);
    if (norm(inp.value.trim()) !== q) return;
    def.hidden = true; res.hidden = false; inp.setAttribute('aria-expanded', 'true');
    res.innerHTML = list.length ? list.map((r, i) => `<a class="nn-item nn-res" role="option" id="${box.id}-o${i}" href="${r.href}">${r.mark}<span class="nn-rt"><b>${hl(r.label, q)}</b><small>${esc(r.sub)}</small></span></a>`).join('') : '<div class="nn-none">No match. Try a company, ticker, sector or country.</div>';
  });
  document.addEventListener('focusin', e => { if (e.target.closest('.nn-q')) load(); });
  document.addEventListener('keydown', e => {
    const inp = e.target.closest && e.target.closest('.nn-q'); const box = e.target.closest && e.target.closest('.nn-content');
    if (inp && (e.key === 'ArrowDown') && !box.querySelector('.nn-results').hidden) { e.preventDefault(); box.querySelector('.nn-res')?.focus(); }
    else if (inp && e.key === 'Escape' && inp.value) { e.preventDefault(); e.stopPropagation(); inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    else if (inp && e.key === 'Enter') { const f = box.querySelector('.nn-res'); if (f) { e.preventDefault(); location.href = f.getAttribute('href'); } }
    else if (box && e.target.classList.contains('nn-res') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const L = [...box.querySelectorAll('.nn-res')], i = L.indexOf(e.target); (L[i + (e.key === 'ArrowDown' ? 1 : -1)] || (e.key === 'ArrowUp' ? box.querySelector('.nn-q') : e.target)).focus(); }
  });
  document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement&&e.target.closest('.nn-icon'))e.target.remove();},true);
  function matches(story, params, markets=[]) {
    const category=params.get('category'),region=params.get('region'),asset=params.get('asset'),sector=params.get('sector'),country=params.get('country');
    if(country){const c=country.toLowerCase();if(!(String(story.location?.country||'').toLowerCase()===c||(story.impacts||[]).some(i=>i.kind==='country'&&String(i.name||'').toLowerCase()===c)))return false;}
    if(category && story.category!==category)return false;
    if(region){const codes={'Europe':['eu'],'North America':['na'],'Asia-Pacific':['asia','oc'],'Middle East':['me'],'Africa':['af'],'Latin America':['latam']};if(!(codes[region]||[]).includes(story.location?.region))return false;}
    const entities=[...(story.entities||[]),...(story.impacts||[])],symbols=entities.map(e=>e.ticker).filter(Boolean),known=markets.filter(a=>symbols.includes(a.s));
    const text=[story.headline,story.summary,...entities.map(e=>e.name)].join(' ').toLowerCase();
    if(asset){const types={stocks:()=>known.some(a=>a.t==='stocks'&&!/^\^/.test(a.s)&&a.g!=='Index')||symbols.some(s=>!/[-=^]/.test(s)),indices:()=>known.some(a=>a.g==='Index')||symbols.some(s=>/^\^|^(NQ|ES|YM)=/.test(s)),energy:()=>known.some(a=>a.g==='Energy')||/\b(oil|crude|brent|wti|natural gas|energy|petroleum)\b/.test(text),bonds:()=>/\b(bonds?|treasur(?:y|ies)|gilts?|bunds?|fixed.income)\b/.test(text),currencies:()=>known.some(a=>a.t==='fx')||symbols.some(s=>/=X$/.test(s))||/\b(currencies|currency|forex|euro|yen|dollar|sterling)\b/.test(text),crypto:()=>story.category==='crypto'||symbols.some(s=>/-USD$/.test(s))};if(types[asset]){if(!types[asset]())return false;}else{const t=asset.toUpperCase(),alias=[t,t.replace(/-USD$/,''),t.replace(/=X$/,'')];if(!(symbols.some(x=>alias.includes(String(x).toUpperCase()))||(story.impacts||[]).some(i=>alias.includes(String(i.ticker||'').toUpperCase()))))return false;}}
    if(sector){const SX=window.InvSectors&&InvSectors.list.find(x=>x.slug===sector);if(SX){if(!SX.re.test(text))return false;}else{const names={technology:['Technology','Communication'],energy:['Energy','Utilities'],financials:['Finance'],healthcare:['Healthcare'],consumer:['Consumer'],industrials:['Industrials']};const words={technology:/\b(technology|software|semiconductor|chips?|artificial intelligence)\b/,energy:/\b(oil|gas|energy|petroleum|power)\b/,financials:/\b(banks?|banking|insurers?|financial services)\b/,healthcare:/\b(healthcare|pharma|medical|drug|biotech)\b/,consumer:/\b(retail|consumer|brands|supermarket)\b/,industrials:/\b(manufactur|industrial|aerospace|transport|aviation)/};if(!known.some(a=>(names[sector]||[]).includes(a.g))&&!words[sector]?.test(text))return false;}}
    return true;
  }
  return {html,matches};
})();
