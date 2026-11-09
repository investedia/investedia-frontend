// Market moves: biggest movers per window, with the news around each move. Reads markets.json, intraday.json, news-live.json.
(() => {
  const $ = id => document.getElementById(id);
  const WIN = [['d', '24h', 1], ['w', 'Week', 7], ['m', 'Month', 30]];
  const TYPES = [['all', 'All'], ['stocks', 'Stocks'], ['crypto', 'Crypto'], ['cmd', 'Commodities'], ['fx', 'Currencies'], ['news', 'In the news']];
  const S = { q: '', win: 'd', type: 'all', assets: [], stories: [], intra: {}, shown: 10 };
  const pc = (a, b) => b ? (a / b - 1) * 100 : 0;
  const move = (a, k) => k === 'd' ? a.d : k === 'w' ? a.w : (a.sp && a.sp.length > 1 ? pc(a.sp[a.sp.length - 1], a.sp[0]) : 0);
  const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(Math.abs(v) >= 10 ? 1 : 2) + '%';
  const cls = v => v > 0.005 ? 'u' : v < -0.005 ? 'd' : 'o';
  const logo = a => !window.InvConsent?.allows('images') ? '' : a.t === 'crypto' ? `https://cdn.brandfetch.io/crypto/${encodeURIComponent(a.s.split('-')[0])}/w/96/h/96/fallback/404?c=${BF}` : a.t === 'stocks' && !/[\^=]/.test(a.s) ? `https://cdn.brandfetch.io/ticker/${encodeURIComponent(a.s)}/w/96/h/96/fallback/404?c=${BF}` : '';
  const icon = a => { const l = logo(a), ini = `<b class="mv-ini">${esc(a.n)[0]}</b>`; return l ? `<img class="nb-lg" src="${l}" alt="" onerror="this.outerHTML=this.dataset.f" data-f="${esc(ini)}">` : a.cc ? `<img class="nb-fl" src="assets/globe/flags/${a.cc}.svg" alt="" onerror="this.remove()">` : ini; };
  const storiesFor = (a, days) => S.stories.filter(s => Date.now() - Date.parse(s.published_at) <= days * 864e5 && (s.impacts || []).some(i => i.ticker === a.s));
  const series = (a, k) => k === 'd' ? (S.intra[a.s]?.d1?.c || (a.sp || []).slice(-2)) : k === 'w' ? (a.sp || []).slice(-6) : (a.sp || []);
  const path = (v, w, h, c) => { if (v.length < 2) return ''; const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1; return `<path d="${v.map((y, i) => (i ? 'L' : 'M') + (i / (v.length - 1) * w).toFixed(1) + ' ' + (h - 3 - (y - lo) / r * (h - 6)).toFixed(1)).join('')}" fill="none" stroke="${c}" stroke-width="${h > 40 ? 2.4 : 1.8}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`; };
  const col = v => v > 0.005 ? '#34d399' : v < -0.005 ? '#f87171' : '#8b8b94';
  function chart(a, k, list) {
    const v = series(a, k), days = WIN.find(w => w[0] === k)[2], lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
    const pins = list.map((s, n) => { const x = Math.min(1, Math.max(0, 1 - (Date.now() - Date.parse(s.published_at)) / (days * 864e5))); const idx = Math.round(x * (v.length - 1)); const y = (v.length ? (v[idx] - lo) / r : .5); return `<button type="button" class="mv-pin" data-n="${n}" style="left:${(x * 100).toFixed(1)}%;top:${((1 - y) * 94 + 3).toFixed(1)}%" aria-label="${esc(s.headline)}"></button>`; }).join('');
    return `<div class="mv-ch"><svg viewBox="0 0 300 150" preserveAspectRatio="none">${path(v, 300, 150, col(move(a, k)))}</svg>${pins}</div>`;
  }
  const detail = (a, k, list) => `${chart(a, k, list)}${list.length ? list.sort((x, y) => Date.parse(y.published_at) - Date.parse(x.published_at)).map((s, n) => `<a class="mv-s" data-n="${n}" href="story.html?id=${encodeURIComponent(s.id)}"><i>${ago(s.published_at)}${s.source?.name ? ' · ' + esc(s.source.name) : ''}</i><b>${esc(s.headline)}</b><p>${esc((s.impacts.find(i => i.ticker === a.s) || {}).why || s.why || '')}</p></a>`).join('') : '<p class="mv-none">No article in our feed mentions this asset in this window, so we can’t point to news for this move.</p>'}`;
  // Only well-known, liquid names: majors, anything with an intraday chart, crypto, commodities, or anything the news mentions.
  const known = (a, days) => !/[.\d]/.test(a.s.replace(/[=^-]/g, '')) && (a.m || a.t === 'crypto' || a.t === 'cmd' || a.t === 'fx' || S.intra[a.s] || storiesFor(a, 30).length) ;
  function draw() {
    const days = WIN.find(w => w[0] === S.win)[2];
    const q = S.q.trim().toLowerCase(), L = S.assets.filter(a => q ? (a.n.toLowerCase().includes(q) || a.s.toLowerCase().includes(q)) : (S.type === 'all' || S.type === 'news' ? a.t !== 'fx' : a.t === S.type) && known(a, days) && (S.type !== 'news' || storiesFor(a, days).length)).map(a => ({ a, m: move(a, S.win), n: storiesFor(a, days).length })).filter(x => isFinite(x.m) && Math.abs(x.m) < 40 && series(x.a, S.win).length >= (x.a.t === 'stocks' ? 6 : 2)).sort((x, y) => Math.abs(y.m) - Math.abs(x.m));
    if ($('mv-more')) { $('mv-more').hidden = L.length <= S.shown; } $('mv-list').innerHTML = L.slice(0, S.shown).map(({ a, m, n }, i) => `<div class="mv-r${i === 0 ? ' open' : ''}" data-s="${esc(a.s)}"><button type="button" class="mv-h" aria-expanded="${i === 0}"><span class="mv-ic">${icon(a)}</span><span><b>${esc(a.n)}</b>${n ? `<span class="mv-tag">${n} ${n === 1 ? 'article' : 'articles'}</span>` : ''}<small>${esc(a.s.replace(/[=^]/g, ''))}</small></span><svg viewBox="0 0 84 28" preserveAspectRatio="none">${path(series(a, S.win), 84, 28, col(m))}</svg><span class="mv-p ${cls(m)}">${fmt(m)}</span></button><div class="mv-d">${i === 0 ? detail(a, S.win, storiesFor(a, days)) : ''}</div></div>`).join('') || '<div class="nb-none">No data yet.</div>';
    document.querySelectorAll('#mv-win button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.win));
    document.querySelectorAll('#mv-type button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.type));
  }
  $('mv-win').innerHTML = WIN.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('');
  $('mv-type').innerHTML = TYPES.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('');
  if ($('mv-q')) { $('mv-q').addEventListener('input', e => { S.q = e.target.value; S.shown = 10; draw(); }); document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('mv-q').focus(); } }); }
  if ($('mv-more')) $('mv-more').onclick = () => { S.shown += 10; draw(); };
  const CATN = { markets: 'Markets', companies: 'Companies', economy: 'Economy', technology: 'Technology', crypto: 'Crypto', commodities: 'Commodities', geopolitics: 'Geopolitics' };
  let LS = 12;
  const thumb = s => { const e = (s.entities || []).find(company), f = flagSrc(s.location.country); return s.image ? `<img src="assets/globe/${esc(s.image.file)}" alt="" loading="lazy">` : e ? `<img class="nb-lg" src="${logoSrc(e)}" alt="" onerror="this.remove()">` : f ? `<img class="nb-lg" style="padding:0;background:none;border-radius:4px" src="${f}" alt="">` : ''; };
  const drawStories = () => { if (!$('nb-ls')) return; const L = [...S.stories].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)); $('nb-n').textContent = L.length + ' articles'; $('nb-ls').innerHTML = L.slice(0, LS).map(s => `<a class="nb-li" href="story.html?id=${encodeURIComponent(s.id)}"><span class="th">${thumb(s)}</span><span><span class="nb-eb">${esc(CATN[s.category] || '')} · ${esc(s.location.place.split(',')[0])}</span><h3>${esc(s.headline)}</h3><span class="m">${ago(s.published_at)} · ${esc(s.source?.name || '')}</span></span></a>`).join(''); $('nb-more').hidden = L.length <= LS; };
  if ($('nb-more')) $('nb-more').onclick = () => { LS += 12; drawStories(); };
  $('mv-win').onclick = e => { const b = e.target.closest('button'); if (b) { S.win = b.dataset.k; draw(); } };
  $('mv-type').onclick = e => { const b = e.target.closest('button'); if (b) { S.type = b.dataset.k; S.shown = 10; draw(); } };
  $('mv-list').addEventListener('click', e => {
    const pin = e.target.closest('.mv-pin');
    if (pin) { const r = pin.closest('.mv-r'); r.querySelectorAll('.mv-pin').forEach(p => p.classList.toggle('on', p === pin)); const t = r.querySelectorAll('.mv-s')[+pin.dataset.n]; t && t.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    const h = e.target.closest('.mv-h'); if (!h) return;
    const r = h.parentElement, open = !r.classList.contains('open'); r.classList.toggle('open', open); h.setAttribute('aria-expanded', open);
    const d = r.querySelector('.mv-d'); if (open && !d.innerHTML) { const a = S.assets.find(x => x.s === r.dataset.s); d.innerHTML = detail(a, S.win, storiesFor(a, WIN.find(w => w[0] === S.win)[2])); }
  });
  window.MV = { S, move, fmt, cls, detail, chart, storiesFor, ready: null };
  window.MV.ready = Promise.all([fetch('assets/globe/markets.json', { cache: 'no-cache' }).then(r => r.json()), fetch('assets/intraday.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ s: {} })), loadNews()])
    .then(([m, i, n]) => { S.assets = m.assets; S.by = Object.fromEntries(m.assets.map(a => [a.s, a])); S.intra = i.s || {}; S.stories = n.stories || []; ($('mv-up') || {}).textContent = 'Updated ' + new Date(m.asof).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); draw(); drawStories(); return S; })
      .catch(e => { console.error('movers', e); $('mv-list').innerHTML = '<div class="nb-none">Market data could not load. Please refresh.</div>'; });
})();
