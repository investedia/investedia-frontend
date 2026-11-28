// Companies: the directory (/companies) and one company (/companies/<slug>). A company is the business; its listings are stocks
// with their own asset pages. Everything comes from cached files (data/companies.json, markets.json, the news feed): no live API calls.
window.InvCompany = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let data = null, bySym = {};
  const load = () => data ? Promise.resolve(data) : Promise.all([fetch('data/companies.json').then(r => r.json()),
    fetch('assets/globe/company-hq.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('data/companies-more.json').then(r => r.ok ? r.json() : null).catch(() => null)]).then(([d, hq, more]) => {
    // Head office: the sourced HQ file (Wikidata / GLEIF) fills companies whose directory entry has none.
    const H = hq?.companies || {};
    for (const c of d.companies) { const h = c.listings.map(l => H[l.s]).find(Boolean); if (h && Number.isFinite(h.hq_lat)) { c.lat = h.hq_lat; c.lon = h.hq_lon; c.city = h.hq_city; } if (!c.hq && h) c.hq = h.hq_city + (c.country ? ', ' + c.country : ''); }
    for (const c of d.companies) for (const l of c.listings) bySym[l.s.toUpperCase()] = c;
    /* owner 25 Nov 2026: ~7,000 more companies (Wikidata + Wikipedia-sourced descriptions). Their bare tickers can collide with other
       markets (e.g. FOX), so they are not used to match news; their pages open at company?c=<slug> and load details on demand. */
    const seen = new Set(d.companies.map(c => c.slug));
    for (const r of more?.companies || []) if (!seen.has(r.slug)) d.companies.push({ slug: r.slug, name: r.name, legal_name: r.name, country: r.country, region: r.region, sector: r.sector,
      city: r.city, lat: r.lat, lon: r.lon, logo: r.logo, emp: r.emp, public: !!r.tk, more: true, listings: r.tk ? [{ s: r.tk, exchange: '', tracked: false }] : [], story: [], sources: [] });
    data = d; return d; });
  const href = c => c.more ? `company?c=${encodeURIComponent(c.slug)}` : `companies/${c.slug}`;
  // owner 25 Nov 2026: globe points for the company globe (head office known only)
  const points = cos => cos.filter(c => Number.isFinite(c.lat)).sort((a, b) => (!!a.more - !!b.more) || ((b.emp || 0) - (a.emp || 0))).slice(0, 900)  /* the biggest 900 stay readable on the globe */.map(c => ({ key: c.slug, name: c.name, ticker: (c.listings[0] || {}).s, place: [c.city, c.country].filter(Boolean).join(', '), sector: c.sector || '', lat: c.lat, lon: c.lon, logo: c.logo || '', href: href(c) }));
  const flag = cc => cc ? `<img class="co-flag" src="assets/globe/flags/${esc(cc)}.svg" alt="" width="18" height="13" loading="lazy">` : '';
  const arrow = d => d === 'up' || d > 0 ? '<span class="co-dir up" aria-label="up">↑</span>' : d === 'down' || d < 0 ? '<span class="co-dir down" aria-label="down">↓</span>' : '';
  // The one Company Entity chip used across the site: flag, optional direction, name. The whole chip opens the company page.
  const chip = (c, o = {}) => `<a class="co-chip" href="${href(c)}" title="${esc(c.name)} · company">${flag(c.cc)}${o.dir ? arrow(o.dir) : ''}<span>${esc(o.label || c.name)}</span></a>`;
  return { load, chip, href, flag, esc, arrow, points, of: sym => bySym[String(sym || '').toUpperCase()] || null, get data() { return data; } };
})();

const coStart = () => {
  const C = window.InvCompany, esc = C.esc, root = document.getElementById('co');
  if (!root) return;
  const get = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
  const ago = t => { const m = Math.max(1, Math.round((Date.now() - Date.parse(t)) / 6e4)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
  const pct = d => Number.isFinite(d) ? `<span class="pct ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${d > 0 ? '↑' : d < 0 ? '↓' : '↔︎'} ${Math.abs(d).toFixed(2)}%</span>` : '';
  const money = (p, cur) => { if(window.InvPrefs){const text=InvPrefs.fmt(p,{cur:cur||'USD',t:'stocks'});return !cur||cur==='USD'?`<span data-usd-value="${p}" data-usd-kind="price">${text}</span>`:text;}try{return new Intl.NumberFormat(undefined,{style:'currency',currency:cur||'USD',maximumFractionDigits:p<10?3:2}).format(p);}catch{return String(p);} };
  // a logo that fails to load (e.g. Wikimedia busy) becomes the letter tile, never a broken-image icon
  const logo = c => c.logo ? `<img class="co-logo" src="${esc(c.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-l="${esc(c.name[0])}" onerror="this.outerHTML='<span class=&quot;co-logo co-mono&quot;>'+this.dataset.l+'</span>'">` : `<span class="co-logo co-mono">${esc(c.name[0])}</span>`;
  const slug = (location.pathname.match(/companies\/([a-z0-9-]+)/) || [])[1] || new URLSearchParams(location.search).get('c');
  const news = () => Promise.all([get('assets/globe/news-live.json'), get('assets/globe/news-archive.json')]).then(([a, b]) => {
    const seen = new Set(); return [...(a?.stories || []), ...(b?.stories || [])].filter(s => s && !seen.has(s.id) && seen.add(s.id)).sort((x, y) => Date.parse(y.published_at) - Date.parse(x.published_at)); });
  // An article involves a company only when one of its confirmed tickers is in the article's impacts or named entities.
  const involves = (s, syms) => (s.impacts || []).some(i => syms.has(String(i.ticker || '').toUpperCase())) || (s.entities || []).some(e => syms.has(String(e.ticker || e.sym || '').toUpperCase()));

  if (root.dataset.view === 'list') return C.load().then(d => Promise.all([d, get('assets/globe/news-live.json')])).then(([d, live]) => list(d, live));
  Promise.all([C.load(), get('assets/globe/markets.json'), news()]).then(([d, m, all]) => page(d, m, all));

  function list(d, live) {
    const cos = d.companies, inNews = {};
    for (const s of live?.stories || []) { const hit = new Set(); for (const x of [...(s.impacts || []), ...(s.entities || [])]) { const c = C.of(x.ticker || x.sym); if (c) hit.add(c.slug); } hit.forEach(k => inNews[k] = (inNews[k] || 0) + 1); }
    const count = (k) => cos.reduce((o, c) => (o[c[k] || ''] = (o[c[k] || ''] || 0) + 1, o), {});
    const opts = (o, all) => `<option value="">${all}</option>` + Object.entries(o).filter(([k]) => k).sort().map(([k, n]) => `<option value="${esc(k)}">${esc(k)} (${n})</option>`).join('') + (o[''] ? `<option value="-">Not classified yet (${o['']})</option>` : '');
    const st = { q: '', country: '', sector: '', letter: '', sort: 'az', n: 48 };
    const secs = Object.entries(count('sector')).filter(([k]) => k).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const popular = ['apple', 'nvidia', 'safaricom', 'asml', 'hsbc', 'petrobras'].map(k => cos.find(c => c.slug === k)).filter(Boolean);
    /* owner 25 Nov 2026: centred title, search with rotating examples, sector buttons and the company globe */
    root.innerHTML = `<div class="page-head cog-head"><div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="markets.html">Markets</a><span>/</span><span>Companies</span></div>
      <h1>Companies</h1><p class="lede">The businesses behind the stocks, by sector and by place. ${cos.length} companies so far.</p>
      <label class="co-search cog-search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="co-q" type="search" placeholder="Try &quot;Nvidia&quot;" autocomplete="off" aria-label="Search companies or tickers"></label>
      ${popular.length ? `<p class="cog-pop">Popular: ${popular.map(c => `<a href="${C.href(c)}">${esc(c.name)}</a>`).join('')}</p>` : ''}
      <div class="cog-secs" id="cog-secs" role="group" aria-label="Sector"><button type="button" data-s="" aria-pressed="true">All</button>${secs.map(k => `<button type="button" data-s="${esc(k)}" aria-pressed="false">${esc(k)}</button>`).join('')}</div>
      <div class="cog-box" id="cog-box"></div><p class="cog-hint">Drag to turn the globe · hover a logo · click to open the company</p></div>
      ${Object.keys(inNews).length ? `<section class="sec"><div class="sec-head"><div><h2>In the news today</h2><p>Companies named in today’s Investedia articles.</p></div></div><div class="co-row">${cos.filter(c => inNews[c.slug]).sort((a, b) => inNews[b.slug] - inNews[a.slug]).slice(0, 14).map(c => C.chip(c, { label: `${c.name} · ${inNews[c.slug]}` })).join('')}</div></section>` : ''}
      <section class="sec"><div class="co-tools card">
        <select id="co-country" aria-label="Country">${opts(count('country'), 'All countries')}</select>
        <select id="co-sector" aria-label="Sector">${opts(count('sector'), 'All sectors')}</select>
        <select id="co-status" aria-label="Status"><option value="">Public and private</option><option value="pub">Public (${cos.filter(c => c.public).length})</option><option value="priv">Private (${cos.filter(c => !c.public).length})</option></select>
        <select id="co-sort" aria-label="Sort"><option value="az">A to Z</option><option value="news">Most in the news</option></select>
      </div><div class="co-letters" id="co-letters"></div><p class="co-count" id="co-count"></p><div class="co-grid" id="co-grid"></div><div class="co-more"><button class="btn" id="co-more" hidden>Show more</button></div></section>`;
    const letters = [...new Set(cos.map(c => (c.name[0] || '').toUpperCase()).filter(l => /[A-Z]/.test(l)))].sort();
    root.querySelector('#co-letters').innerHTML = `<button data-l="" aria-pressed="true">All</button>` + letters.map(l => `<button data-l="${l}" aria-pressed="false">${l}</button>`).join('') + `<button data-l="#" aria-pressed="false">#</button>`;
    const draw = () => {
      const q = st.q.toLowerCase();
      let r = cos.filter(c => (!q || c.name.toLowerCase().includes(q) || c.legal_name.toLowerCase().includes(q) || c.listings.some(l => l.s.toLowerCase().startsWith(q)))
        && (!st.country || c.country === st.country) && (!st.sector || (st.sector === '-' ? !c.sector : c.sector === st.sector))
        && (!st.status || (st.status === 'pub') === c.public)
        && (!st.letter || (st.letter === '#' ? !/[A-Z]/i.test(c.name[0]) : c.name[0].toUpperCase() === st.letter)));
      r = st.sort === 'news' ? r.sort((a, b) => (inNews[b.slug] || 0) - (inNews[a.slug] || 0) || a.name.localeCompare(b.name)) : r.sort((a, b) => a.name.localeCompare(b.name));
      root.querySelector('#co-count').textContent = `${r.length} ${r.length === 1 ? 'company' : 'companies'}`;
      root.querySelector('#co-grid').innerHTML = r.slice(0, st.n).map(c => `<a class="co-card" href="${C.href(c)}">${logo(c)}<span class="co-card-b"><b>${esc(c.name)}</b><small>${esc([c.city, c.country].filter(Boolean).join(', '))}${c.sector ? ' · ' + esc(c.sector) : ''}</small><span class="co-tk">${c.listings.slice(0, 3).map(l => `<i>${esc(l.s)}</i>`).join('')}${inNews[c.slug] ? `<em>In the news · ${inNews[c.slug]}</em>` : ''}</span></span></a>`).join('') || '<p class="co-empty">No companies match these filters.</p>';
      root.querySelector('#co-more').hidden = r.length <= st.n;
    };
    const on = (id, ev, f) => root.querySelector(id).addEventListener(ev, f);
    on('#co-q', 'input', e => { st.q = e.target.value.trim(); st.n = 48; draw(); });
    for (const k of ['country', 'status', 'sort']) on('#co-' + k, 'change', e => { st[k] = e.target.value; st.n = 48; draw(); });
    on('#co-letters', 'click', e => { const b = e.target.closest('button'); if (!b) return; st.letter = b.dataset.l; st.n = 48; root.querySelectorAll('#co-letters button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    on('#co-more', 'click', () => { st.n += 48; draw(); });
    const globe = window.InvCoGlobe ? InvCoGlobe(root.querySelector('#cog-box'), { items: C.points(cos), lon: 15, lat: 22 }) : null;
    const setSec = v => { st.sector = v; st.n = 48; root.querySelector('#co-sector').value = v; root.querySelectorAll('#cog-secs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === v))); if (globe) globe.setSector(v); draw(); };
    on('#cog-secs', 'click', e => { const b = e.target.closest('button'); if (b) setSec(b.dataset.s); });
    on('#co-sector', 'change', e => setSec(e.target.value === '-' ? '' : e.target.value));
    const ex = ['Try "Nvidia"', 'Try "Safaricom"', 'Try "HSBC"', 'Try a ticker, e.g. "ASML"', 'Try "Petrobras"'], qi = root.querySelector('#co-q'); let k = 0;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => { if (!qi.value && document.activeElement !== qi) qi.placeholder = ex[k = (k + 1) % ex.length]; }, 2800);
    draw();
  }

  function page(d, m, all) {
    const c = d.companies.find(x => x.slug === slug);
    if (c && c.more && !c.full) return get('data/companies-more/' + (/[a-z]/.test(c.slug[0]) ? c.slug[0] : '_') + '.json').then(f => { Object.assign(c, (f || {})[c.slug] || {}, { full: true }); page(d, m, all); });
    if (!c) { root.innerHTML = `<div class="page-head"><h1>Company not found</h1><p class="lede"><a href="companies">Browse all companies</a></p></div>`; return; }
    document.title = `${c.name}: company profile · Investedia`;
    /* owner 21 Nov 2026: cleaner company page. Price up top, only facts we have, no empty sections, articles back to 2022 */
    const px = Object.fromEntries((m?.assets || []).map(a => [a.s, a])), syms = new Set(c.listings.map(l => l.s.toUpperCase()));
    const main = c.listings.find(l => l.tracked && px[l.s]) || c.listings.find(l => l.tracked), a = main && px[main.s];
    const live = c.more ? [] : all.filter(s => involves(s, syms)).map(s => ({ id: s.id, h: s.headline, t: s.published_at, src: s.source?.name || '' }));
    const impl = all.flatMap(s => (s.impacts || []).filter(i => syms.has(String(i.ticker || '').toUpperCase()) && i.why).map(i => ({ s, i }))).slice(0, 4);
    const related = c.sector ? d.companies.filter(x => x !== c && x.sector === c.sector).sort((a, b) => (b.country === c.country) - (a.country === c.country) || a.name.localeCompare(b.name)).slice(0, 8) : [];
    const sgn = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`, cl = v => v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    const spark = sp => { if (!sp || sp.length < 3) return ''; const lo = Math.min(...sp), hi = Math.max(...sp), r = hi - lo || 1, W = 240, H = 64;
      const pts = sp.map((v, k) => [k / (sp.length - 1) * W, H - 4 - (v - lo) / r * (H - 8)]), d = pts.map((q, k) => (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
      const up = sp[sp.length - 1] >= sp[0], col = up ? '#34d399' : '#f87171';
      return `<svg class="co2-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="co2g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${W} ${H} L0 ${H}Z" fill="url(#co2g)"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`; };
    const facts = [['Legal name', c.legal_name !== c.name && c.legal_name], ['Headquarters', c.hq], ['Industry', c.industry], ['Founded', c.founded], ['Listed on', main && main.exchange]].filter(f => f[1]);
    const sec = (h, p, body) => `<section class="sec co2-sec"><div class="sec-head"><div><h2>${h}</h2>${p ? `<p>${p}</p>` : ''}</div></div>${body}</section>`;
    const artList = L => `<div class="card co2-news">${L.map(x => `<a href="story?id=${encodeURIComponent(x.id)}"><b>${esc(x.h)}</b><small>${esc(x.src)}${x.src ? ' · ' : ''}${Date.now() - Date.parse(x.t) < 7 * 864e5 ? ago(x.t) : new Date(x.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</small></a>`).join('')}</div>`;
    root.innerHTML = `<div class="page-head co2-head"><div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="companies">Companies</a><span>/</span><span>${esc(c.name)}</span></div>
      <div class="card co2-hero"><div class="co2-id">${logo(c)}<div><h1>${esc(c.name)}</h1><p class="co2-sub">${main ? `<span class="co2-tk">${esc(main.s)}</span>` : ''}${esc([c.city, c.country].filter(Boolean).join(', '))}${c.sector ? ' · ' + esc(c.sector) : ''} · ${c.public ? 'Public company' : 'Private company'}</p></div></div>
      ${a ? `<div class="co2-px"><div><b class="co2-p">${money(a.p, a.cur)}</b><span class="co2-mv ${cl(a.d)}">${sgn(a.d)} <small>today</small></span>${Number.isFinite(a.w) ? `<span class="co2-mv ${cl(a.w)}">${sgn(a.w)} <small>week</small></span>` : ''}</div>${spark(a.sp)}</div>` : ''}
      ${main && main.tracked ? `<a class="btn btn-primary co2-cta" href="asset.html?s=${encodeURIComponent(main.s)}">Open ${esc(main.s)} chart →</a>` : ''}</div></div>
      <div class="co-layout"><div class="co-main">
      ${c.description || facts.length || c.website ? sec('About', '', `<div class="card co-pad">${c.description ? `<p class="co-desc">${esc(c.description)}</p>` : ''}${facts.length || c.website ? `<div class="co2-facts">${facts.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}${c.website ? `<div><span>Website</span><b><a href="${esc(c.website)}" rel="noopener nofollow" target="_blank">${esc(c.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></b></div>` : ''}</div>` : ''}</div>`) : ''}
      <div id="co2-news"></div>
      ${impl.length ? sec('What our articles said', `How recent news could affect ${esc(c.name)}.`, `<div class="co-impl">${impl.map(({ s, i }) => `<div class="card co-im"><span class="co-im-h">${C.chip(c, { dir: i.direction })}<small>${ago(s.published_at)}</small></span><p>${esc(i.why)}</p><a class="co-im-src" href="story?id=${encodeURIComponent(s.id)}">From: ${esc(s.headline)} →</a></div>`).join('')}</div>`) : ''}
      ${c.story.length ? sec('Company story', 'Key moments, from sourced records only.', `<ol class="card co-story">${c.story.map(e => `<li><time>${esc(e.date)}</time><b>${esc(e.title)}</b><span>${esc(e.text)}</span></li>`).join('')}</ol>`) : ''}
      ${c.sources.length ? `<p class="co-sources">Sources: ${c.sources.map(s => `<a href="${esc(s.url)}" rel="noopener nofollow" target="_blank">${esc(s.name)}</a>`).join(' · ')}</p>` : ''}
      </div><aside class="co-side">
      ${Number.isFinite(c.lat) ? `<section class="card co-pad cog-card"><div class="card-head"><h3>${esc(c.name)} on the globe</h3></div><div class="cog-box cog-small" id="cog-one"></div><p class="cog-hint">${c.sector ? `With other ${esc(c.sector.toLowerCase())} companies · ` : ''}drag to turn</p></section>` : ''}
      ${c.listings.length > 1 ? `<section class="card co-pad"><div class="card-head"><h3>Stocks of ${esc(c.name)}</h3></div>${c.listings.map(l => { const q = px[l.s]; return `<a class="co2-lst" href="asset.html?s=${encodeURIComponent(l.s)}"><span><b>${esc(l.s)}</b><small>${esc(l.exchange)}</small></span>${q ? `<span><b>${money(q.p, q.cur)}</b><small class="${cl(q.d)}">${sgn(q.d)}</small></span>` : '<small>Price not tracked yet</small>'}</a>`; }).join('')}</section>` : ''}
      ${related.length ? `<section class="card co-pad"><div class="card-head"><h3>Similar companies</h3></div><div class="co2-rel">${related.map(x => { const l = x.listings.find(l => px[l.s]), q = l && px[l.s]; return `<a href="${C.href(x)}">${logo(x)}<span><b>${esc(x.name)}</b><small>${l ? esc(l.s) : esc(x.country)}</small></span>${q ? `<small class="${cl(q.d)}">${sgn(q.d)}</small>` : ''}</a>`; }).join('')}</div></section>` : ''}
      <section class="card co-pad"><div class="card-head"><h3>Learn</h3></div>${[['valuation', 'Valuing a company', 'How investors judge what a business is worth.'], ['charts', 'Reading a stock chart', 'Candles, trends and volume.']].map(([id, t, s]) => `<a class="co-art" href="lesson.html?c=${id}"><b>${t}</b><small>${s}</small></a>`).join('')}</section>
      </aside></div><p class="co-disc">Prices may be delayed. Company facts are updated periodically. Not investment advice.</p>`;
    { const el = root.querySelector('#cog-one'); if (el && window.InvCoGlobe) InvCoGlobe(el, { items: C.points(d.companies.filter(x => x !== c && c.sector && x.sector === c.sector)).slice(0, 400).concat(C.points([c])), focus: c.slug, lon: c.lon, lat: Math.max(-40, Math.min(50, c.lat)) }); }
    /* articles: today's feed plus the archive index by ticker (back to 2022) */
    Promise.all(c.more ? [] : [...new Set([...syms].map(t => /[A-Z]/.test(t[0]) ? t[0] : '_'))].map(k => get('assets/globe/library-index/tick-' + k + '.json'))).then(sh => {
      const seen = new Set(), L = [...live, ...sh.flatMap(o => [...syms].flatMap(t => (o && o[t]) || []).map(r => ({ id: r[0], h: r[1], t: r[2], src: r[3] })))]
        .filter(x => !seen.has(x.id) && seen.add(x.id)).sort((p, q) => Date.parse(q.t) - Date.parse(p.t)).slice(0, 8);
      const el = root.querySelector('#co2-news'); if (el && L.length) el.outerHTML = sec('In the news', `Investedia articles that name ${esc(c.name)}.`, artList(L));
      if (main) alertCard(L[0]);
    });
    /* owner 21 Nov 2026 (design C): email alerts card that shows what the email looks like. Uses the existing watchlist alerts (email when a followed name is in the news). */
    function alertCard(top) {
      const it = { kind: 'asset', src: 'site', s: main.s }, W = window.INVWATCH, PK = 'inv-pending-watch';
      const mv = a && Number.isFinite(a.d) ? `<span class="co2-am ${cl(a.d)}">${esc(main.s)} ${sgn(a.d)} today</span>` : '';
      const box = document.createElement('section'); box.className = 'sec co2-sec';
      const paint = () => { const on = W && W.has(it);
        box.innerHTML = `<div class="card co2-alert"><h3>${on ? `You get ${esc(c.name)} alerts` : `Get emails like this for ${esc(c.name)}`}</h3>
          ${top ? `<div class="co2-mail"><div class="co2-mf"><b>Investedia</b><span>when it happens</span></div><div class="co2-mh">${esc(c.name)} in the news: ${esc(top.h)}</div>${mv}</div>` : ''}
          ${on ? `<p class="co2-fine">${esc(c.name)} is in your watchlist. Manage alerts from the bell or <a href="watchlist.html">your watchlist</a>.</p>`
            : `<form class="co2-af" novalidate>${W && W.user ? '' : '<input type="email" placeholder="you@email.com" autocomplete="email" aria-label="Email address">'}<button type="submit" class="co2-ab">Get alerts</button></form><p class="co2-fine">${W && W.user ? 'Adds ' + esc(c.name) + ' to your watchlist.' : 'Free account · unsubscribe any time'}</p>`}</div>`;
        const f = box.querySelector('form'); if (f) f.onsubmit = e => { e.preventDefault();
          if (W && W.user) { if (!W.has(it)) W.toggle(it); return; }
          const em = (f.querySelector('input') || {}).value || '';
          try { localStorage.setItem(PK, JSON.stringify(it)); } catch {}
          if (window.openAuth) { openAuth('up'); const i = document.querySelector('.auth-f input[name=email]'); if (i && em) { i.value = em; i.dispatchEvent(new Event('input', { bubbles: true })); } } }; };
      if (W) W.on(() => { let pk = null; try { pk = JSON.parse(localStorage.getItem(PK) || 'null'); } catch {}
        if (W.user && pk && pk.s === it.s) { try { localStorage.removeItem(PK); } catch {} if (!W.has(it)) W.toggle(it); } paint(); });
      paint();
      const at = root.querySelector('.co2-news') ? root.querySelector('.co2-news').closest('section') : root.querySelector('#co2-news');
      if (at) at.after(box); else root.querySelector('.co-main').appendChild(box);
    }
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', coStart); else coStart();  // page scripts load before the page body
