// Companies: the directory (/companies) and one company (/companies/<slug>). A company is the business; its listings are stocks
// with their own asset pages. Everything comes from cached files (data/companies.json, markets.json, the news feed): no live API calls.
window.InvCompany = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let data = null, bySym = {};
  const load = () => data ? Promise.resolve(data) : fetch('data/companies.json').then(r => r.json()).then(d => {
    data = d; for (const c of d.companies) for (const l of c.listings) bySym[l.s.toUpperCase()] = c; return d; });
  const href = c => `companies/${c.slug}`;
  const flag = cc => cc ? `<img class="co-flag" src="assets/globe/flags/${esc(cc)}.svg" alt="" width="18" height="13" loading="lazy">` : '';
  const arrow = d => d === 'up' || d > 0 ? '<span class="co-dir up" aria-label="up">↑</span>' : d === 'down' || d < 0 ? '<span class="co-dir down" aria-label="down">↓</span>' : '';
  // The one Company Entity chip used across the site: flag, optional direction, name. The whole chip opens the company page.
  const chip = (c, o = {}) => `<a class="co-chip" href="${href(c)}" title="${esc(c.name)} · company">${flag(c.cc)}${o.dir ? arrow(o.dir) : ''}<span>${esc(o.label || c.name)}</span></a>`;
  return { load, chip, href, flag, esc, arrow, of: sym => bySym[String(sym || '').toUpperCase()] || null, get data() { return data; } };
})();

const coStart = () => {
  const C = window.InvCompany, esc = C.esc, root = document.getElementById('co');
  if (!root) return;
  const get = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
  const ago = t => { const m = Math.max(1, Math.round((Date.now() - Date.parse(t)) / 6e4)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
  const pct = d => Number.isFinite(d) ? `<span class="pct ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${d > 0 ? '↑' : d < 0 ? '↓' : '↔'} ${Math.abs(d).toFixed(2)}%</span>` : '';
  const money = (p, cur) => { if(window.InvPrefs){const text=InvPrefs.fmt(p,{cur:cur||'USD',t:'stocks'});return !cur||cur==='USD'?`<span data-usd-value="${p}" data-usd-kind="price">${text}</span>`:text;}try{return new Intl.NumberFormat(undefined,{style:'currency',currency:cur||'USD',maximumFractionDigits:p<10?3:2}).format(p);}catch{return String(p);} };
  const logo = c => c.logo ? `<img class="co-logo" src="${esc(c.logo)}" alt="" loading="lazy">` : `<span class="co-logo co-mono">${esc(c.name[0])}</span>`;
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
    root.innerHTML = `<div class="page-head"><div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="markets.html">Markets</a><span>/</span><span>Companies</span></div>
      <div class="sec-head" style="margin:0"><div><h1>Companies</h1><p class="lede">The businesses behind the stocks. ${cos.length} companies so far; the directory grows as Investedia covers more markets.</p></div></div></div>
      ${Object.keys(inNews).length ? `<section class="sec"><div class="sec-head"><div><h2>In the news today</h2><p>Companies named in today’s Investedia articles.</p></div></div><div class="co-row">${cos.filter(c => inNews[c.slug]).sort((a, b) => inNews[b.slug] - inNews[a.slug]).slice(0, 14).map(c => C.chip(c, { label: `${c.name} · ${inNews[c.slug]}` })).join('')}</div></section>` : ''}
      <section class="sec"><div class="co-tools card">
        <label class="co-search"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="co-q" type="search" placeholder="Search companies or tickers" autocomplete="off" aria-label="Search companies or tickers"></label>
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
      root.querySelector('#co-grid').innerHTML = r.slice(0, st.n).map(c => `<a class="co-card" href="${C.href(c)}">${logo(c)}<span class="co-card-b"><b>${esc(c.name)}</b><small>${C.flag(c.cc)} ${esc(c.country)}${c.sector ? ' · ' + esc(c.sector) : ''}</small><span class="co-tk">${c.listings.slice(0, 3).map(l => `<i>${esc(l.s)}</i>`).join('')}${inNews[c.slug] ? `<em>In the news · ${inNews[c.slug]}</em>` : ''}</span></span></a>`).join('') || '<p class="co-empty">No companies match these filters.</p>';
      root.querySelector('#co-more').hidden = r.length <= st.n;
    };
    const on = (id, ev, f) => root.querySelector(id).addEventListener(ev, f);
    on('#co-q', 'input', e => { st.q = e.target.value.trim(); st.n = 48; draw(); });
    for (const k of ['country', 'sector', 'status', 'sort']) on('#co-' + k, 'change', e => { st[k] = e.target.value; st.n = 48; draw(); });
    on('#co-letters', 'click', e => { const b = e.target.closest('button'); if (!b) return; st.letter = b.dataset.l; st.n = 48; root.querySelectorAll('#co-letters button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    on('#co-more', 'click', () => { st.n += 48; draw(); });
    draw();
  }

  function page(d, m, all) {
    const c = d.companies.find(x => x.slug === slug);
    if (!c) { root.innerHTML = `<div class="page-head"><h1>Company not found</h1><p class="lede"><a href="companies">Browse all companies</a></p></div>`; return; }
    document.title = `${c.name}: company profile · Investedia`;
    const px = Object.fromEntries((m?.assets || []).map(a => [a.s, a])), syms = new Set(c.listings.map(l => l.s.toUpperCase()));
    const arts = all.filter(s => involves(s, syms)).slice(0, 8);
    const impl = all.flatMap(s => (s.impacts || []).filter(i => syms.has(String(i.ticker || '').toUpperCase()) && i.why).map(i => ({ s, i }))).slice(0, 6);
    const related = c.sector ? d.companies.filter(x => x !== c && x.sector === c.sector).sort((a, b) => (b.country === c.country) - (a.country === c.country) || a.name.localeCompare(b.name)).slice(0, 6) : [];
    const lessons = [['valuation', 'Valuing a company', 'How investors judge what a business like this is worth.'], ['charts', 'Reading a stock chart', 'Candles, trends and volume on any stock page.']];
    const fact = (k, v) => `<div class="co-fact"><span>${k}</span><b>${v ? esc(v) : '<em>Not yet available</em>'}</b></div>`;
    const empty = t => `<p class="co-empty">${t}</p>`;
    const asset = l => { const a = px[l.s]; return l.tracked && a ? `<a class="co-asset" href="asset.html?s=${encodeURIComponent(l.s)}"><span><b>${esc(l.s)}</b><small>${esc(l.name)} · ${esc(l.exchange)}</small></span><span class="co-asset-r"><b>${money(a.p, a.cur)}</b>${pct(a.d)}</span><span class="co-go">View ${esc(l.s)} stock →</span></a>`
      : `<div class="co-asset off"><span><b>${esc(l.s)}</b><small>${esc(l.name)} · ${esc(l.exchange)}</small></span><span class="co-asset-r"><small>Price not tracked yet</small></span></div>`; };
    root.innerHTML = `<div class="page-head"><div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="companies">Companies</a><span>/</span><span>${esc(c.name)}</span></div>
      <div class="co-hero">${logo(c)}<div><h1>${esc(c.name)}</h1><p class="co-sub">${C.flag(c.cc)} ${esc(c.country)}${c.sector ? ' · ' + esc(c.sector) : ''} · <span class="co-badge">${c.public ? 'Public company' : 'Private company'}</span></p></div>
      ${c.listings.find(l => l.tracked) ? `<a class="btn btn-primary co-cta" href="asset.html?s=${encodeURIComponent(c.listings.find(l => l.tracked).s)}">View ${esc(c.listings.find(l => l.tracked).s)} stock →</a>` : ''}</div></div>
      <div class="co-layout"><div class="co-main">
      <section class="sec card co-pad"><div class="card-head"><h3>Overview</h3></div>${c.description ? `<p class="co-desc">${esc(c.description)}</p>` : empty('A company description has not been added yet.')}
        <div class="co-facts">${fact('Legal name', c.legal_name)}${fact('Country', c.country)}${fact('Headquarters', c.hq)}${fact('Sector', c.sector)}${fact('Industry', c.industry)}${fact('Founded', c.founded)}${fact('Status', c.public ? 'Public, listed' : 'Private')}
        <div class="co-fact"><span>Website</span><b>${c.website ? `<a href="${esc(c.website)}" rel="noopener nofollow" target="_blank">${esc(c.website.replace(/^https?:\/\//, ''))}</a>` : '<em>Not yet available</em>'}</b></div></div></section>
      <section class="sec"><div class="sec-head"><div><h2>Latest news</h2><p>Investedia articles that name ${esc(c.name)}.</p></div></div>${arts.length ? `<div class="card co-list">${arts.map(s => `<a class="co-art" href="story.html?id=${encodeURIComponent(s.id)}"><b>${esc(s.headline)}</b><small>${esc(s.source?.name || '')} · ${ago(s.published_at)}</small></a>`).join('')}</div>` : empty(`No recent Investedia articles name ${esc(c.name)}.`)}</section>
      <section class="sec"><div class="sec-head"><div><h2>Market implications</h2><p>What our articles said this could mean for ${esc(c.name)}.</p></div></div>${impl.length ? `<div class="co-impl">${impl.map(({ s, i }) => `<div class="card co-im"><span class="co-im-h">${C.chip(c, { dir: i.direction })}<small>${ago(s.published_at)}</small></span><p>${esc(i.why)}</p><a class="co-im-src" href="story.html?id=${encodeURIComponent(s.id)}">From: ${esc(s.headline)} →</a></div>`).join('')}</div>` : empty('No market implications recorded yet.')}</section>
      <section class="sec"><div class="sec-head"><div><h2>Company story</h2><p>Key moments, from sourced records only.</p></div></div>${c.story.length ? `<ol class="card co-story">${c.story.map(e => `<li><time>${esc(e.date)}</time><b>${esc(e.title)}</b><span>${esc(e.text)}</span></li>`).join('')}</ol>` : empty('No sourced timeline yet.')}</section>
      <section class="sec"><div class="sec-head"><div><h2>Watch</h2><p>Official and legally embeddable videos about ${esc(c.name)}.</p></div></div>${c.videos.length ? '' : empty('No videos added yet.')}</section>
      ${c.sources.length ? `<p class="co-sources">Sources: ${c.sources.map(s => `<a href="${esc(s.url)}" rel="noopener nofollow" target="_blank">${esc(s.name)}</a>`).join(' · ')}</p>` : ''}
      </div><aside class="co-side">
      <section class="card co-pad"><div class="card-head"><h3>Stocks of ${esc(c.name)}</h3></div><p class="co-note">A company can have several stocks. Each has its own price page.</p>${c.listings.map(asset).join('')}</section>
      <section class="card co-pad"><div class="card-head"><h3>Related companies</h3></div>${related.length ? `<p class="co-note">Same sector: ${esc(c.sector)}</p><div class="co-row">${related.map(x => C.chip(x)).join('')}</div>` : empty('Not enough data to relate companies yet.')}</section>
      <section class="card co-pad"><div class="card-head"><h3>Learn</h3></div><p class="co-note">General lessons that apply to any listed company.</p>${lessons.map(([id, t, s]) => `<a class="co-art" href="lesson.html?c=${id}"><b>${t}</b><small>${s}</small></a>`).join('')}</section>
      </aside></div><p class="co-disc">Company facts are updated periodically, not live. Not investment advice.</p>`;
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', coStart); else coStart();  // page scripts load before the page body
