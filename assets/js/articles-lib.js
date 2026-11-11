// All articles library (articles.html). Every filter lives in the URL (?page=2&cat=economy&date=7d&reg=eu&q=oil&sort=old),
// so each page can be shared, bookmarked and indexed. Unfiltered pages load one small file; filters load the compact index once.
function initArticles() {
  const $ = id => document.getElementById(id), BASE = 'assets/globe/library-index/';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT = { companies: 'Companies', economy: 'Economy', commodities: 'Commodities', markets: 'Markets', technology: 'Technology', geopolitics: 'Geopolitics', crypto: 'Crypto' };
  const REG = { na: 'North America', latam: 'Latin America', eu: 'Europe', af: 'Africa', me: 'Middle East', asia: 'Asia', oc: 'Oceania' };
  const DATES = [['', 'Any time'], ['1d', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days']];
  const fmt = n => n.toLocaleString('en-US'), nice = c => CAT[c] || (c ? c[0].toUpperCase() + c.slice(1) : 'News');
  const link = r => 'story.html?id=' + encodeURIComponent(r.id);
  const img = r => r.i ? 'assets/globe/' + r.i : null;
  let meta, all = null, live = [];
  const state = () => { const u = new URLSearchParams(location.search); return { page: Math.max(1, parseInt(u.get('page')) || 1), cat: u.get('cat') || '', date: u.get('date') || '', reg: u.get('reg') || '', q: (u.get('q') || '').trim(), sort: u.get('sort') || 'new' }; };
  const href = (s, ch) => { const n = { ...s, ...ch }, u = new URLSearchParams(); if (n.page > 1) u.set('page', n.page); for (const k of ['cat', 'date', 'reg', 'q']) if (n[k]) u.set(k, n[k]); if (n.sort !== 'new') u.set('sort', n.sort); const q = u.toString(); return (location.pathname.split('/').pop() || 'news.html') + (q ? '?' + q : '') + (document.querySelector('.al-onnews') ? '#all' : ''); };
  const go = (ch, push = true) => { const url = href(state(), { page: 1, ...ch }); if (push) history.pushState(null, '', url); else history.replaceState(null, '', url); render(); };
  const get = f => fetch(BASE + f, { cache: 'no-cache' }).then(r => { if (!r.ok) throw Error(f); return r.json(); });
  const day = t => new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = t => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const row = r => `<a class="al-row${img(r) ? '' : ' noimg'}" href="${link(r)}">${img(r) ? `<img src="${esc(img(r))}" alt="" loading="lazy" onerror="this.remove();this.parentNode&&this.parentNode.classList.add('noimg')">` : ''}<div><div class="al-ct">${esc(nice(r.c))} · ${time(r.t)}</div><h3>${esc(r.h)}</h3><div class="al-sr">${esc(r.s || '')}${r.n ? ' · ' + esc(r.n) : ''}${r.k > 1 ? ' · ' + r.k + ' sources' : ''}</div></div></a>`;
  function options(s) {
    const opt = (key, val, label, count) => `<button type="button" data-k="${key}" data-v="${esc(val)}" aria-pressed="${s[key] === val}"><i></i>${esc(label)}${count != null ? `<small>${fmt(count)}</small>` : ''}</button>`;
    $('al-cat').innerHTML = opt('cat', '', 'All', meta.total) + Object.entries(meta.categories).map(([c, n]) => opt('cat', c, nice(c), n)).join('');
    $('al-date').innerHTML = DATES.map(([v, l]) => opt('date', v, l)).join('');
    $('al-reg').innerHTML = opt('reg', '', 'All regions') + Object.entries(REG).filter(([k]) => meta.regions[k]).map(([k, l]) => opt('reg', k, l, meta.regions[k])).join('');
    $('al-chips').innerHTML = [['', 'All', meta.total], ...Object.entries(meta.categories).map(([c, n]) => [c, nice(c), n])].map(([v, l, n]) => `<button type="button" data-k="cat" data-v="${esc(v)}" aria-pressed="${s.cat === v}">${esc(l)} ${fmt(n)}</button>`).join('');
    if (document.activeElement !== $('al-q')) $('al-q').value = s.q; $('al-sort').value = s.sort;
  }
  async function rows(s) {
    const filtered = s.cat || s.date || s.reg || s.q || s.sort !== 'new';
    if (!filtered) { const r = await get('page-' + Math.min(s.page, meta.pages) + '.json'); return { list: s.page === 1 ? [...live, ...r] : r, total: meta.total + live.length }; }
    all = all || await get('all.json');
    const now = Date.now(), win = { '1d': 864e5, '7d': 7 * 864e5, '30d': 30 * 864e5 }[s.date], q = s.q.toLowerCase();
    let L = [...live, ...all].filter(r => (!s.cat || r.c === s.cat) && (!s.reg || r.g === s.reg) && (!win || now - Date.parse(r.t) <= win) && (!q || (r.h + ' ' + (r.s || '') + ' ' + (r.n || '')).toLowerCase().includes(q)));
    if (s.sort === 'old') L = L.reverse(); else if (s.sort === 'src') L = [...L].sort((a, b) => b.k - a.k || (a.t < b.t ? 1 : -1));
    return { list: L.slice((s.page - 1) * meta.per_page, s.page * meta.per_page), total: L.length };
  }
  function pager(s, pages) {
    if (pages <= 1) return '';
    const a = (p, label, extra = '') => `<a href="${href(s, { page: p })}" data-page="${p}"${p === s.page && !extra ? ' aria-current="page"' : ''}${extra}>${label}</a>`;
    const set = new Set([1, pages, s.page - 1, s.page, s.page + 1, s.page + 2].filter(p => p >= 1 && p <= pages)); if (s.page <= 3) [2, 3, 4, 5].forEach(p => p <= pages && set.add(p));
    let out = a(Math.max(1, s.page - 1), '‹', s.page === 1 ? ' aria-disabled="true" aria-label="Previous page"' : ' aria-label="Previous page"'), prev = 0;
    for (const p of [...set].sort((x, y) => x - y)) { if (p - prev > 1) out += '<span>…</span>'; out += a(p, p, '').replace('<a ', p > 3 && p !== pages && p !== s.page ? '<a class="far" ' : '<a '); prev = p; }
    return out + a(Math.min(pages, s.page + 1), '›', s.page === pages ? ' aria-disabled="true" aria-label="Next page"' : ' aria-label="Next page"');
  }
  async function render() {
    const s = state(); options(s);
    let res; try { res = await rows(s); } catch { $('al-list').innerHTML = '<p class="al-empty">Articles could not load. Please try again.</p>'; return; }
    const pages = Math.max(1, Math.ceil(res.total / meta.per_page)); let list = res.list, lead = '';
    if (s.page === 1 && !s.q && !document.querySelector('.al-onnews')) { const i = list.findIndex(img); if (i >= 0) { const r = list[i]; list = list.filter((_, k) => k !== i);
      lead = `<a class="al-lead" href="${link(r)}"><img src="${esc(img(r))}" alt=""><div><div class="al-ct">${esc(nice(r.c))} · ${day(r.t)} ${time(r.t)}</div><h2>${esc(r.h)}</h2><p id="al-lead-sum"></p><div class="al-sr">${esc(r.s || '')}${r.n ? ' · ' + esc(r.n) : ''}</div></div></a>`;
      fetch('assets/globe/library/' + encodeURIComponent(r.id) + '.json').then(x => x.ok ? x.json() : null).then(d => { const p = $('al-lead-sum'); if (p && d?.summary) p.textContent = d.summary; }).catch(() => {}); } }
    $('al-lead').innerHTML = lead;
    const from = res.total ? (s.page - 1) * meta.per_page + 1 : 0;
    $('al-count').textContent = res.total ? `Showing ${fmt(from)}–${fmt(Math.min(res.total, s.page * meta.per_page))} of ${fmt(res.total)}` : '';
    let html = '', d0 = ''; for (const r of list) { const d = day(r.t); if (d !== d0) { html += `<div class="al-day">${d}</div>`; d0 = d; } html += row(r); }
    $('al-list').innerHTML = html || '<p class="al-empty">No articles match these filters.</p>';
    $('al-pg').innerHTML = pager(s, pages);
    if (!document.querySelector('.al-onnews')) document.title = 'All articles' + (s.page > 1 ? ' · page ' + s.page : '') + ' · Investedia';
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (b) { go({ [b.dataset.k]: b.dataset.v }); return; }
    const p = e.target.closest('#al-pg a[data-page]'); if (p && !e.metaKey && !e.ctrlKey) { e.preventDefault(); history.pushState(null, '', p.getAttribute('href')); render(); const top = document.getElementById('all'); top ? top.scrollIntoView({ behavior: 'smooth' }) : scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  let qt; $('al-q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => go({ q: e.target.value.trim() }, false), 250); });
  $('al-sort').addEventListener('change', e => go({ sort: e.target.value }));
  $('al-fbtn').addEventListener('click', () => { const o = $('al-side').classList.toggle('open'); $('al-fbtn').setAttribute('aria-expanded', String(o)); });
  $('al-done').addEventListener('click', () => { $('al-side').classList.remove('open'); $('al-fbtn').setAttribute('aria-expanded', 'false'); scrollTo({ top: 0 }); });
  addEventListener('popstate', render);
  get('meta.json').then(async m => {
    meta = m; const sub = `${fmt(m.total)} articles from ${fmt(m.sources)} sources since ${new Date(m.first).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    // newest articles that arrived after the last site build come from the live feed, without duplicates
    try { const n = await fetch('assets/globe/news-live.json', { cache: 'no-cache' }).then(r => r.json()); const first = (await get('page-1.json'))[0];
      live = (n.stories || []).filter(x => first && x.published_at > first.t).map(x => ({ id: x.id, h: x.headline, c: x.category, t: x.published_at, s: x.source?.name, n: x.location?.country, g: x.location?.region, k: (x.sources || []).length || 1, i: x.image?.file })); } catch {}
    $('al-sub').textContent = sub; $('al-sub2').textContent = sub; render();
  }).catch(() => { $('al-sub').textContent = 'Articles could not load.'; });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initArticles); else initArticles();
